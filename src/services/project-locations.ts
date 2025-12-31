/**
 * Service: Project Locations Management
 * Handles CRUD operations for project-level locations
 */

import { createClient } from '@/lib/supabase/client'

export interface ProjectLocation {
    id: string
    project_id: string
    company_id: string
    name: string
    code: string | null
    type: 'workshop' | 'storage' | 'field' | 'transit' | 'other'
    description: string | null
    parent_location_id: string | null
    capacity: number | null
    gps_coords: { lat: number; lng: number } | null
    custom_metadata: Record<string, any>
    is_active: boolean
    created_at: string
    updated_at: string
    created_by: string | null
    updated_by: string | null
}

export type CreateLocationInput = Omit<
    ProjectLocation,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>

export type UpdateLocationInput = Partial<
    Omit<ProjectLocation, 'id' | 'project_id' | 'company_id' | 'created_at' | 'updated_at'>
>

/**
 * Get all locations for a project
 */
export async function getProjectLocations(projectId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_locations')
        .select('*')
        .eq('project_id', projectId)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching project locations:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation[], error: null }
}

/**
 * Get active locations only
 */
export async function getActiveProjectLocations(projectId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_locations')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching active locations:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation[], error: null }
}

/**
 * Get location by ID
 */
export async function getLocationById(locationId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_locations')
        .select('*')
        .eq('id', locationId)
        .single()

    if (error) {
        console.error('Error fetching location:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation, error: null }
}

/**
 * Create a new location
 */
export async function createProjectLocation(input: CreateLocationInput) {
    const supabase = createClient()

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('project_locations')
        .insert({
            ...input,
            created_by: user?.id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating location:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation, error: null }
}

/**
 * Update an existing location
 */
export async function updateProjectLocation(locationId: string, updates: UpdateLocationInput) {
    const supabase = createClient()

    // Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('project_locations')
        .update({
            ...updates,
            updated_by: user?.id,
        })
        .eq('id', locationId)
        .select()
        .single()

    if (error) {
        console.error('Error updating location:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation, error: null }
}

/**
 * Soft delete (deactivate) a location
 */
export async function deactivateLocation(locationId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_locations')
        .update({ is_active: false })
        .eq('id', locationId)
        .select()
        .single()

    if (error) {
        console.error('Error deactivating location:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation, error: null }
}

/**
 * Hard delete a location (use with caution)
 */
export async function deleteLocation(locationId: string) {
    const supabase = createClient()

    const { error } = await supabase.from('project_locations').delete().eq('id', locationId)

    if (error) {
        console.error('Error deleting location:', error)
        return { error }
    }

    return { error: null }
}

/**
 * Get location hierarchy (breadcrumbs)
 */
export async function getLocationHierarchy(locationId: string): Promise<ProjectLocation[]> {
    const supabase = createClient()

    const hierarchy: ProjectLocation[] = []
    let currentId: string | null = locationId

    while (currentId) {
        const { data, error } = await supabase
            .from('project_locations')
            .select('*')
            .eq('id', currentId)
            .single()

        if (error || !data) break

        hierarchy.unshift(data as ProjectLocation)
        currentId = data.parent_location_id
    }

    return hierarchy
}

/**
 * Get all child locations
 */
export async function getChildLocations(parentLocationId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('project_locations')
        .select('*')
        .eq('parent_location_id', parentLocationId)
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching child locations:', error)
        return { data: null, error }
    }

    return { data: data as ProjectLocation[], error: null }
}
