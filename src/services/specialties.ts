import { createClient } from '@/lib/supabase/client'
import { Specialty } from '@/types'

/**
 * Get all available specialties (disciplines)
 */
export async function getAllSpecialties(): Promise<Specialty[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching specialties:', error)
        return []
    }

    return data as Specialty[]
}

/**
 * Get active specialties for a specific project
 */
export async function getProjectSpecialties(projectId: string): Promise<Specialty[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_specialties')
        .select(`
            specialty_id,
            specialties (*)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching project specialties:', error)
        return []
    }

    return (data as any[]).map(item => item.specialties) as Specialty[]
}
