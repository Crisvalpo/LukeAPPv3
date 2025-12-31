/**
 * Service: Spool Tagging System
 * Auto-assigns management tags to spools
 */

import { createClient } from '@/lib/supabase/client'

export interface SpoolTag {
    id: string
    project_id: string
    company_id: string
    tag_number: number
    tag_suffix: string | null
    tag_display: string
    first_spool_number: string
    current_spool_number: string | null
    isometric_id: string
    status: 'ACTIVE' | 'OBSOLETE' | 'MERGED' | 'SPLIT'
    created_in_revision_id: string | null
    last_seen_revision_id: string | null
    merged_into_tag_id: string | null
    split_from_tag_id: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

interface SpoolToTag {
    spool_id: string
    spool_number: string
    isometric_id: string
    revision_id: string
}

/**
 * Get next available tag number for a project
 */
async function getNextTagNumber(projectId: string): Promise<number> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('get_next_tag_number', {
        p_project_id: projectId,
    })

    if (error) {
        console.error('Error getting next tag number:', error)
        // Fallback: query max manually
        const { data: maxData } = await supabase
            .from('spool_tags_registry')
            .select('tag_number')
            .eq('project_id', projectId)
            .order('tag_number', { ascending: false })
            .limit(1)
            .single()

        return maxData ? maxData.tag_number + 1 : 1
    }

    return data as number
}

/**
 * Format tag display (00001, 00054-A)
 */
function formatTagDisplay(tagNumber: number, tagSuffix: string | null): string {
    const paddedNumber = tagNumber.toString().padStart(5, '0')
    return tagSuffix ? `${paddedNumber}-${tagSuffix}` : paddedNumber
}

/**
 * Find existing tag for a spool
 */
async function findExistingTag(
    projectId: string,
    isometricId: string,
    spoolNumber: string
): Promise<SpoolTag | null> {
    const supabase = createClient()

    // Try to find by exact spool_number match
    const { data, error } = await supabase
        .from('spool_tags_registry')
        .select('*')
        .eq('project_id', projectId)
        .eq('isometric_id', isometricId)
        .or(`first_spool_number.eq.${spoolNumber},current_spool_number.eq.${spoolNumber}`)
        .single()

    if (error || !data) return null

    return data as SpoolTag
}

/**
 * Create a new tag
 */
async function createTag(
    projectId: string,
    companyId: string,
    isometricId: string,
    spoolNumber: string,
    revisionId: string,
    tagNumber: number,
    tagSuffix: string | null = null
): Promise<SpoolTag> {
    const supabase = createClient()

    const tagDisplay = formatTagDisplay(tagNumber, tagSuffix)

    const { data, error } = await supabase
        .from('spool_tags_registry')
        .insert({
            project_id: projectId,
            company_id: companyId,
            tag_number: tagNumber,
            tag_suffix: tagSuffix,
            tag_display: tagDisplay,
            first_spool_number: spoolNumber,
            isometric_id: isometricId,
            status: 'ACTIVE',
            created_in_revision_id: revisionId,
            last_seen_revision_id: revisionId,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating tag:', error)
        throw new Error(`Failed to create tag: ${error.message}`)
    }

    return data as SpoolTag
}

/**
 * Update last_seen_revision for existing tag
 */
async function updateTagLastSeen(tagId: string, revisionId: string) {
    const supabase = createClient()

    await supabase
        .from('spool_tags_registry')
        .update({ last_seen_revision_id: revisionId })
        .eq('id', tagId)
}

/**
 * Main function: Auto-assign tags to spools
 */
export async function assignSpoolTags(
    projectId: string,
    companyId: string,
    revisionId: string,
    spools: SpoolToTag[]
): Promise<Map<string, string>> {
    const supabase = createClient()

    // Map: spool_id -> management_tag
    const tagAssignments = new Map<string, string>()

    // Get next available tag number
    let nextTagNumber = await getNextTagNumber(projectId)

    // Process each spool
    for (const spool of spools) {
        try {
            // Check if tag already exists for this spool
            const existingTag = await findExistingTag(projectId, spool.isometric_id, spool.spool_number)

            let tag: SpoolTag

            if (existingTag) {
                // Reuse existing tag
                tag = existingTag
                await updateTagLastSeen(tag.id, revisionId)
            } else {
                // Create new tag
                tag = await createTag(
                    projectId,
                    companyId,
                    spool.isometric_id,
                    spool.spool_number,
                    revisionId,
                    nextTagNumber
                )
                nextTagNumber++
            }

            // Update spool table
            await supabase
                .from('spools')
                .update({
                    tag_registry_id: tag.id,
                    management_tag: tag.tag_display,
                })
                .eq('id', spool.spool_id)

            tagAssignments.set(spool.spool_id, tag.tag_display)
        } catch (error) {
            console.error(`Error assigning tag to spool ${spool.spool_number}:`, error)
            // Continue with other spools
        }
    }

    return tagAssignments
}

/**
 * Get tag info for a spool
 */
export async function getSpoolTag(spoolId: string): Promise<SpoolTag | null> {
    const supabase = createClient()

    const { data: spool } = await supabase
        .from('spools')
        .select('tag_registry_id')
        .eq('id', spoolId)
        .single()

    if (!spool?.tag_registry_id) return null

    const { data: tag } = await supabase
        .from('spool_tags_registry')
        .select('*')
        .eq('id', spool.tag_registry_id)
        .single()

    return tag as SpoolTag | null
}

/**
 * Get all tags for a project
 */
export async function getProjectTags(projectId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('spool_tags_registry')
        .select('*')
        .eq('project_id', projectId)
        .order('tag_number', { ascending: true })

    if (error) {
        console.error('Error fetching project tags:', error)
        return { data: null, error }
    }

    return { data: data as SpoolTag[], error: null }
}
