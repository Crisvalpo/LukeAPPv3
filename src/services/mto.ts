/**
 * MTO (Material Take-Off) Service
 * Handles parsing and managing Material Take-Off data from Excel
 */

import { createClient } from '@/lib/supabase/client'

export interface MTORow {
    line_number: string
    area: string | null
    sheet: string | null
    spool_number: string
    spool_full_id: string
    piping_class: string | null
    rev_number: string | null
    qty: number
    qty_unit: string
    item_code: string
    fab_type: 'F' | 'G' | null
    excel_row: number
}

export interface MTOSummary {
    item_code: string
    total_qty: number
    qty_unit: string
    fab_type: string | null
    spools_count: number
}

/**
 * Parse MTO data from Excel-like array
 * Expected columns: LINE NUMBER, AREA, SHEET, SPOOL NUMBER, SPOOL-ID, PIPING CLASS, REV, QTY, QTY UNIT, ITEM CODE, FAB
 */
export function parseMTOFromArray(data: any[]): MTORow[] {
    const mtoRows: MTORow[] = []

    // Skip header row, start from index 1
    for (let i = 1; i < data.length; i++) {
        const row = data[i]

        // Skip empty rows
        if (!row || row.length === 0 || !row[0]) continue

        try {
            const mtoRow: MTORow = {
                line_number: String(row[0] || '').trim(),
                area: row[1] ? String(row[1]).trim() : null,
                sheet: row[2] ? String(row[2]).trim() : null,
                spool_number: String(row[3] || '').trim(),
                spool_full_id: String(row[4] || '').trim(),
                piping_class: row[5] ? String(row[5]).trim() : null,
                rev_number: row[6] ? String(row[6]).trim() : null,
                qty: parseFloat(String(row[7] || '0').replace(',', '.')),
                qty_unit: String(row[8] || 'PCS').trim(),
                item_code: String(row[9] || '').trim(),
                fab_type: row[10] ? (String(row[10]).trim() as 'F' | 'G') : null,
                excel_row: i + 1 // Excel rows are 1-indexed
            }

            // Basic validation
            if (!mtoRow.line_number || !mtoRow.spool_number || !mtoRow.item_code) {
                console.warn(`Skipping row ${i + 1}: Missing required fields`)
                continue
            }

            mtoRows.push(mtoRow)
        } catch (error) {
            console.error(`Error parsing row ${i + 1}:`, error)
        }
    }

    return mtoRows
}

/**
 * Upload MTO data to database for a specific revision
 */
export async function uploadMTO(
    revisionId: string,
    projectId: string,
    companyId: string,
    mtoData: MTORow[]
): Promise<void> {
    const supabase = createClient()

    // Delete existing MTO data for this revision (replace strategy)
    const { error: deleteError } = await supabase
        .from('spools_mto')
        .delete()
        .eq('revision_id', revisionId)

    if (deleteError) {
        throw new Error(`Error deleting existing MTO: ${deleteError.message}`)
    }

    // Insert new MTO data in batches (Supabase has a limit)
    const BATCH_SIZE = 500
    for (let i = 0; i < mtoData.length; i += BATCH_SIZE) {
        const batch = mtoData.slice(i, i + BATCH_SIZE)

        const rowsToInsert = batch.map(row => ({
            revision_id: revisionId,
            project_id: projectId,
            company_id: companyId,
            line_number: row.line_number,
            area: row.area,
            sheet: row.sheet,
            spool_number: row.spool_number,
            spool_full_id: row.spool_full_id,
            piping_class: row.piping_class,
            rev_number: row.rev_number,
            qty: row.qty,
            qty_unit: row.qty_unit,
            item_code: row.item_code,
            fab_type: row.fab_type,
            excel_row: row.excel_row
        }))

        const { error: insertError } = await supabase
            .from('spools_mto')
            .insert(rowsToInsert)

        if (insertError) {
            throw new Error(`Error inserting MTO batch: ${insertError.message}`)
        }
    }
}

/**
 * Get MTO summary for a revision using the database function
 */
export async function getMTOSummary(revisionId: string): Promise<MTOSummary[]> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('get_mto_summary', {
        revision_id_param: revisionId
    })

    if (error) {
        throw new Error(`Error getting MTO summary: ${error.message}`)
    }

    return data || []
}

/**
 * Get MTO count for a revision
 */
export async function getMTOCount(revisionId: string): Promise<number> {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('spools_mto')
        .select('*', { count: 'exact', head: true })
        .eq('revision_id', revisionId)

    if (error) {
        throw new Error(`Error counting MTO: ${error.message}`)
    }

    return count || 0
}

/**
 * Delete MTO data for a revision
 */
export async function deleteMTO(revisionId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('spools_mto')
        .delete()
        .eq('revision_id', revisionId)

    if (error) {
        throw new Error(`Error deleting MTO: ${error.message}`)
    }
}
