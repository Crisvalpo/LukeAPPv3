import { createClient } from '@/lib/supabase/client'

export interface ProjectWeekInfo {
    start_date: string | null
    week_end_day: number
    current_week: number | null
    project_day: number | null
}

/**
 * Get current week information for a project
 */
export async function getProjectWeekInfo(projectId: string): Promise<ProjectWeekInfo> {
    const response = await fetch(`/api/projects/${projectId}/week-config`)
    const json = await response.json()

    if (!json.success) {
        throw new Error(json.error || 'Error loading project week info')
    }

    return json.data
}

/**
 * Update project week configuration
 */
export async function updateProjectWeekConfig(
    projectId: string,
    config: {
        start_date: string
        week_end_day: number
    }
): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/week-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    })

    const json = await response.json()

    if (!json.success) {
        throw new Error(json.error || 'Error updating project week config')
    }
}

/**
 * Calculate week number for a specific date
 */
export async function calculateWeekNumber(
    projectId: string,
    date: Date = new Date()
): Promise<number | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('calculate_project_week', {
            p_project_id: projectId,
            p_date: date.toISOString().split('T')[0]
        })

    if (error) throw new Error(`Error calculating week: ${error.message}`)

    return data
}

/**
 * Get start date of a specific week
 */
export async function getWeekStartDate(
    projectId: string,
    weekNumber: number
): Promise<Date | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_week_start_date', {
            p_project_id: projectId,
            p_week_number: weekNumber
        })

    if (error) throw new Error(`Error getting week start date: ${error.message}`)

    return data ? new Date(data) : null
}

/**
 * Get end date of a specific week
 */
export async function getWeekEndDate(
    projectId: string,
    weekNumber: number
): Promise<Date | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_week_end_date', {
            p_project_id: projectId,
            p_week_number: weekNumber
        })

    if (error) throw new Error(`Error getting week end date: ${error.message}`)

    return data ? new Date(data) : null
}

/**
 * Get date range for a week range
 */
export async function getWeekRangeDates(
    projectId: string,
    weekStart: number,
    weekEnd: number
): Promise<{ startDate: Date | null, endDate: Date | null }> {
    const [startDate, endDate] = await Promise.all([
        getWeekStartDate(projectId, weekStart),
        getWeekEndDate(projectId, weekEnd)
    ])

    return { startDate, endDate }
}

/**
 * Format week display string
 */
export function formatWeekDisplay(weekNumber: number | null): string {
    if (weekNumber === null) return 'Sin configurar'
    return `Semana ${weekNumber}`
}

/**
 * Format week range display string
 */
export function formatWeekRangeDisplay(weekStart: number, weekEnd: number): string {
    if (weekStart === weekEnd) return `Semana ${weekStart}`
    return `Semanas ${weekStart}-${weekEnd}`
}
