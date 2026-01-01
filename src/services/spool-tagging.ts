/**
 * Service: Spool Tagging System
 * Auto-assigns management tags to spools with Lifecycle Logic (Merge/Split/Obsolete)
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

type WeldSignature = string[]; // Sorted list of weld numbers

/**
 * Helper: Get 1-1 map of IDs to weld signatures for a revision
 * Returns Map<SpoolNumber, WeldSignature>
 */
async function getWeldSignatures(
    revisionId: string,
    spoolNumbers: string[],
    supabaseClient?: ReturnType<typeof createClient>
): Promise<Map<string, WeldSignature>> {
    const supabase = supabaseClient || createClient()

    if (spoolNumbers.length === 0) return new Map()

    const { data: welds } = await supabase
        .from('spools_welds')
        .select('spool_number, weld_number')
        .eq('revision_id', revisionId)
        .in('spool_number', spoolNumbers)

    const map = new Map<string, string[]>()

    welds?.forEach(w => {
        const current = map.get(w.spool_number) || []
        current.push(w.weld_number)
        map.set(w.spool_number, current)
    })

    // Sort valid signatures for comparison
    map.forEach(val => val.sort())

    return map
}

/**
 * Helper: Get weld signatures for OLD tags from their last seen revision
 * Returns Map<TagId, WeldSignature>
 */
async function getTagWeldSignatures(
    tags: SpoolTag[],
    supabaseClient?: ReturnType<typeof createClient>
): Promise<Map<string, WeldSignature>> {
    const supabase = supabaseClient || createClient()
    const map = new Map<string, string[]>()

    // Group by revision to minimize queries
    const tagsByRev = new Map<string, SpoolTag[]>()

    tags.forEach(t => {
        if (!t.last_seen_revision_id) return
        const list = tagsByRev.get(t.last_seen_revision_id) || []
        list.push(t)
        tagsByRev.set(t.last_seen_revision_id, list)
    })

    // Execute queries per revision
    for (const [revId, group] of tagsByRev.entries()) {
        const spoolNames = group.map(t => t.current_spool_number || t.first_spool_number)

        const { data: welds } = await supabase
            .from('spools_welds')
            .select('spool_number, weld_number')
            .eq('revision_id', revId)
            .in('spool_number', spoolNames)

        // Map back to Tag ID
        welds?.forEach(w => {
            // Find which tag(s) had this spool name in this revision
            // (Simpler: Assuming 1-1 mapping in a single revision context)
            const matchingTags = group.filter(t =>
                (t.current_spool_number === w.spool_number) ||
                (t.first_spool_number === w.spool_number && !t.current_spool_number)
            )

            matchingTags.forEach(t => {
                const current = map.get(t.id) || []
                current.push(w.weld_number)
                map.set(t.id, current)
            })
        })
    }

    map.forEach(val => val.sort())
    return map
}

/**
 * Get next available tag number for a project
 */
async function getNextTagNumber(projectId: string, supabaseClient?: ReturnType<typeof createClient>): Promise<number> {
    const supabase = supabaseClient || createClient()

    const { data, error } = await supabase.rpc('get_next_tag_number', {
        p_project_id: projectId,
    })

    if (error) {
        // Fallback
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
 * Create a new tag (Centralized)
 */
async function createTag(
    projectId: string,
    companyId: string,
    isometricId: string,
    spoolNumber: string,
    revisionId: string,
    tagNumber: number,
    tagSuffix: string | null = null,
    splitFromId: string | null = null,
    notes: string | null = null
): Promise<SpoolTag> {
    const supabase = createClient()
    const { data: result } = await supabase.rpc('format_tag_display', {
        p_tag_number: tagNumber,
        p_tag_suffix: tagSuffix
    })

    // Fallback if RPC fails or returns null
    const display = (result as string) ||
        (tagSuffix ? `${String(tagNumber).padStart(5, '0')}-${tagSuffix}` : String(tagNumber).padStart(5, '0'))

    const { data, error } = await supabase
        .from('spool_tags_registry')
        .insert({
            project_id: projectId,
            company_id: companyId,
            tag_number: tagNumber,
            tag_suffix: tagSuffix,
            tag_display: display,
            first_spool_number: spoolNumber,
            current_spool_number: spoolNumber,
            isometric_id: isometricId,
            status: tagSuffix ? 'ACTIVE' : 'ACTIVE', // Splits are immediately active
            created_in_revision_id: revisionId,
            last_seen_revision_id: revisionId,
            split_from_tag_id: splitFromId,
            notes: notes
        })
        .select()
        .single()

    if (error) throw new Error(`Create tag error: ${error.message}`)
    return data as SpoolTag
}

/**
 * Main function: Auto-assign tags to spools
 */
export async function assignSpoolTags(
    projectId: string,
    companyId: string,
    revisionId: string,
    spools: SpoolToTag[],
    supabaseClient?: ReturnType<typeof createClient>
): Promise<Map<string, string>> {
    const supabase = supabaseClient || createClient()
    const tagAssignments = new Map<string, string>()

    // 1. Get Isometric ID (assuming all spools belong to same ISO for this batch, or logic handles mix)
    // The previous service call iterates by Revision, so ISOs might be mixed? 
    // Usually spools are grouped by ISO in the caller, but let's separate them to be safe.
    const spoolsByIso = new Map<string, SpoolToTag[]>()
    spools.forEach(s => {
        const list = spoolsByIso.get(s.isometric_id) || []
        list.push(s)
        spoolsByIso.set(s.isometric_id, list)
    })

    // 2. Process each Isometric group independently
    for (const [isoId, isoSpools] of spoolsByIso) {

        // A. Fetch all existing tags for this ISO
        const { data: existingTags } = await supabase
            .from('spool_tags_registry')
            .select('*')
            .eq('project_id', projectId)
            .eq('isometric_id', isoId)

        const dbTags = (existingTags || []) as SpoolTag[]

        // B. Prepare Weld Signatures
        const incomingWeldSigs = await getWeldSignatures(revisionId, isoSpools.map(s => s.spool_number), supabase)
        const activeTags = dbTags.filter(t => t.status === 'ACTIVE')
        const oldWeldSigs = await getTagWeldSignatures(activeTags, supabase)

        // C. logic buckets
        const matchedSpools = new Set<string>() // spool_id
        const matchedTags = new Set<string>() // tag_id

        // --- PHASE 1: EXACT MATCH (Persistence) ---
        for (const spool of isoSpools) {
            // Find tag where current_spool_number matches EXACTLY
            const match = dbTags.find(t =>
                (t.current_spool_number === spool.spool_number) ||
                (t.first_spool_number === spool.spool_number && !t.current_spool_number)
            )

            if (match) {
                // UPDATE TAG
                await supabase
                    .from('spool_tags_registry')
                    .update({
                        last_seen_revision_id: revisionId,
                        status: 'ACTIVE',
                        current_spool_number: spool.spool_number
                    })
                    .eq('id', match.id)

                // LINK SPOOL
                await supabase.from('spools').update({
                    tag_registry_id: match.id,
                    management_tag: match.tag_display
                }).eq('id', spool.spool_id)

                matchedSpools.add(spool.spool_id)
                matchedTags.add(match.id)
                tagAssignments.set(spool.spool_id, match.tag_display)
            }
        }

        // --- PHASE 2: COMPLEX MATCH (Splits/Merges) via Welds ---
        // Only verify logic if we have Weld Data, otherwise skip to new birth

        const unmatchedSpools = isoSpools.filter(s => !matchedSpools.has(s.spool_id))
        const unmatchedTags = activeTags.filter(t => !matchedTags.has(t.id))

        if (unmatchedSpools.length > 0 && unmatchedTags.length > 0) {

            // 2.1 SPLIT DETECTION (One Old Tag -> Many New Spools)
            for (const tag of unmatchedTags) {
                const tagWelds = oldWeldSigs.get(tag.id) || []
                if (tagWelds.length === 0) continue

                // Find ALL new spools whose welds are SUBSETS of this tag's welds
                // And together cover most of the tag? Or just strictly subsets?
                const children = unmatchedSpools.filter(s => {
                    const sWelds = incomingWeldSigs.get(s.spool_number) || []
                    return sWelds.length > 0 && sWelds.every(w => tagWelds.includes(w))
                })

                if (children.length >= 2) {
                    // SPLIT DETECTED!
                    // Mark Parent as SPLIT
                    await supabase.from('spool_tags_registry').update({
                        status: 'SPLIT',
                        notes: `Split into ${children.map(c => c.spool_number).join(', ')} in rev`
                    }).eq('id', tag.id)
                    matchedTags.add(tag.id) // Mark processed

                    // Create Children Tags
                    let suffixIndex = 0
                    for (const child of children) {
                        const suffix = String.fromCharCode(65 + suffixIndex) // A, B, C...
                        try {
                            const newTag = await createTag(
                                projectId, companyId, isoId, child.spool_number,
                                revisionId, tag.tag_number, suffix, tag.id,
                                `Split from ${tag.tag_display}`
                            )

                            // Link
                            await supabase.from('spools').update({
                                tag_registry_id: newTag.id,
                                management_tag: newTag.tag_display
                            }).eq('id', child.spool_id)

                            matchedSpools.add(child.spool_id)
                            tagAssignments.set(child.spool_id, newTag.tag_display)
                            suffixIndex++
                        } catch (e) {
                            console.error('Split creation check failed', e)
                        }
                    }
                }
            }
        }

        // --- PHASE 3: NEW BIRTH ---
        let nextTagNumber = await getNextTagNumber(projectId, supabase)

        const remainingSpools = isoSpools.filter(s => !matchedSpools.has(s.spool_id))

        for (const spool of remainingSpools) {
            try {
                const newTag = await createTag(
                    projectId, companyId, isoId, spool.spool_number,
                    revisionId, nextTagNumber
                )

                await supabase.from('spools').update({
                    tag_registry_id: newTag.id,
                    management_tag: newTag.tag_display
                }).eq('id', spool.spool_id)

                tagAssignments.set(spool.spool_id, newTag.tag_display)
                nextTagNumber++
            } catch (e) {
                console.error("New tag creation failed", e)
            }
        }

        // --- PHASE 4: OBSOLETE MARKING ---
        // Any Active Tag that was NOT matched and is NOT in this revision -> OBSOLETE
        const obsoleteTags = activeTags.filter(t => !matchedTags.has(t.id))
        if (obsoleteTags.length > 0) {
            await supabase
                .from('spool_tags_registry')
                .update({
                    status: 'OBSOLETE',
                    notes: 'Marked obsolete in batch update'
                })
                .in('id', obsoleteTags.map(t => t.id))
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
