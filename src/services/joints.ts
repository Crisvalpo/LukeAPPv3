/**
 * Bolted Joints Service
 * Handles parsing and managing Bolted Joints data from Excel
 */

import { createClient } from '@/lib/supabase/client'

export interface JointRow {
    iso_number: string
    rev_number: string | null
    line_number: string | null
    sheet: string | null
    joint_number: string
    piping_class: string | null
    material: string | null
    rating: string | null
    nps: string | null
    bolt_size: string | null
    excel_row: number
}

export interface JointsSummary {
    bolt_size: string
    rating: string
    joints_count: number
}

/**
 * Parse Joints data from Excel-like array
 * Expected columns: ISO NUMBER, REV, LINE NUMBER, SHEET, FLANGED JOINT NUMBER, PIPING CLASS, MATERIAL, RATING, NPS, BOLT SIZE
 */
export function parseJointsFromArray(data: any[]): JointRow[] {
    const jointRows: JointRow[] = []

    // Skip header row, start from index 1
    for (let i = 1; i < data.length; i++) {
        const row = data[i]

        // Skip empty rows
        if (!row || row.length === 0 || !row[0]) continue

        try {
            const jointRow: JointRow = {
                iso_number: String(row[0] || '').trim(),
                rev_number: row[1] ? String(row[1]).trim() : null,
                line_number: row[2] ? String(row[2]).trim() : null,
                sheet: row[3] ? String(row[3]).trim() : null,
                joint_number: String(row[4] || '').trim(), // FLANGED JOINT NUMBER
                piping_class: row[5] ? String(row[5]).trim() : null,
                material: row[6] ? String(row[6]).trim() : null,
                rating: row[7] ? String(row[7]).trim() : null,
                nps: row[8] ? String(row[8]).trim() : null,
                bolt_size: row[9] ? String(row[9]).trim() : null,
                excel_row: i + 1
            }

            // Basic validation
            if (!jointRow.iso_number || !jointRow.joint_number) {
                console.warn(`Skipping row ${i + 1}: Missing required fields`)
                continue
            }

            jointRows.push(jointRow)
        } catch (error) {
            console.error(`Error parsing row ${i + 1}:`, error)
        }
    }

    return jointRows
}

/**
 * Upload Joints data to database for a specific revision
 */
export async function uploadJoints(
    revisionId: string,
    projectId: string,
    companyId: string,
    jointsData: JointRow[]
): Promise<void> {
    const supabase = createClient()

    // Delete existing Joints data for this revision
    const { error: deleteError } = await supabase
        .from('spools_joints')
        .delete()
        .eq('revision_id', revisionId)

    if (deleteError) {
        throw new Error(`Error deleting existing Joints: ${deleteError.message}`)
    }

    // Insert new Joints data in batches
    const BATCH_SIZE = 500
    for (let i = 0; i < jointsData.length; i += BATCH_SIZE) {
        const batch = jointsData.slice(i, i + BATCH_SIZE)

        const rowsToInsert = batch.map(row => ({
            revision_id: revisionId,
            project_id: projectId,
            company_id: companyId,
            iso_number: row.iso_number,
            rev_number: row.rev_number,
            line_number: row.line_number,
            sheet: row.sheet,
            joint_number: row.joint_number,
            piping_class: row.piping_class,
            material: row.material,
            rating: row.rating,
            nps: row.nps,
            bolt_size: row.bolt_size,
            excel_row: row.excel_row
        }))

        const { error: insertError } = await supabase
            .from('spools_joints')
            .insert(rowsToInsert)

        if (insertError) {
            throw new Error(`Error inserting Joints batch: ${insertError.message}`)
        }
    }
}

/**
 * Get Joints summary for a revision
 */
export async function getJointsSummary(revisionId: string): Promise<JointsSummary[]> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('get_joints_summary', {
        revision_id_param: revisionId
    })

    if (error) {
        throw new Error(`Error getting Joints summary: ${error.message}`)
    }

    return data || []
}

/**
 * Get Joints count for a revision
 */
export async function getJointsCount(revisionId: string): Promise<number> {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('spools_joints')
        .select('*', { count: 'exact', head: true })
        .eq('revision_id', revisionId)

    if (error) {
        throw new Error(`Error counting Joints: ${error.message}`)
    }

    return count || 0
}

/**
 * Delete Joints data for a revision
 */
export async function deleteJoints(revisionId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('spools_joints')
        .delete()
        .eq('revision_id', revisionId)

    if (error) {
        throw new Error(`Error deleting Joints: ${error.message}`)
    }
}
