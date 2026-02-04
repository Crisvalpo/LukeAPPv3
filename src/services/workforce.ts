import { createClient } from '@/lib/supabase/client'

export interface ProjectPersonnel {
    id: string
    project_id: string
    rut: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    role_tag: string
    active: boolean
    work_schedule_id?: string
    schedule_name?: string
    internal_id?: string
    shift_type?: 'DIA' | 'NOCHE'
}

export interface WorkSchedule {
    id: string
    project_id: string
    name: string
    active: boolean
}

/**
 * Get all personnel for a project
 */
export async function getProjectPersonnel(projectId: string): Promise<ProjectPersonnel[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_personnel')
        .select(`
            *,
            work_schedule:work_schedules(name)
        `)
        .eq('project_id', projectId)
        .eq('active', true)
        .order('last_name')

    if (error) {
        console.error('Error fetching personnel:', error)
        return []
    }

    return data.map((p: any) => ({
        ...p,
        schedule_name: p.work_schedule?.name
    }))
}

/**
 * Get all schedules for a project
 */
export async function getProjectSchedules(projectId: string): Promise<WorkSchedule[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('project_id', projectId)
        .eq('active', true)
        .order('name')

    if (error) {
        console.error('Error fetching schedules:', error)
        return []
    }

    return data
}

/**
 * Delete a person (Soft delete)
 */
export async function deletePerson(id: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('project_personnel')
        .update({ active: false })
        .eq('id', id)

    if (error) {
        console.error('Error deleting person:', error)
        return false
    }
    return true
}

export async function createPerson(person: Omit<ProjectPersonnel, 'id' | 'schedule_name'>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await supabase
        .from('project_personnel')
        .insert(person)

    if (error) {
        console.error('Error creating person:', error)

        // Check for duplicate RUT (unique constraint violation)
        // Supabase returns code '23505' for PostgreSQL unique constraint violations
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            return { success: false, error: 'El trabajador ya existe en este proyecto' }
        }

        return { success: false, error: error.message || 'Error al crear trabajador' }
    }
    return { success: true }
}
