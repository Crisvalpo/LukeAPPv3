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

    // 1. Fetch all spools for this revision to build lookup map
    const { data: spoolsData, error: spoolsError } = await supabase
        .from('spools')
        .select('id, spool_number, revision_id')
        .eq('revision_id', revisionId)

    if (spoolsError) {
        throw new Error(`Error fetching spools: ${spoolsError.message}`)
    }

    // 2. Create map: spool_number -> spool_id
    const spoolMap = new Map<string, string>()
    spoolsData?.forEach(spool => {
        spoolMap.set(spool.spool_number, spool.id)
    })

    console.log(`[MTO Upload] Found ${spoolMap.size} spools in revision`)

    // 3. Delete existing MTO data for this revision (replace strategy)
    const { error: deleteError } = await supabase
        .from('spools_mto')
        .delete()
        .eq('revision_id', revisionId)

    if (deleteError) {
        throw new Error(`Error deleting existing MTO: ${deleteError.message}`)
    }

    // Track spools not found for logging
    const spoolsNotFound = new Set<string>()

    // 4. Consolidate duplicate items (same spool + item_code) by summing quantities
    const consolidatedMap = new Map<string, any>()

    mtoData.forEach(row => {
        const spoolId = spoolMap.get(row.spool_number) || null

        if (!spoolId && row.spool_number) {
            spoolsNotFound.add(row.spool_number)
        }

        // Key: spool_number + item_code (unique combination)
        const consolidationKey = `${row.spool_number}_${row.item_code}`

        if (consolidatedMap.has(consolidationKey)) {
            // Item already exists, sum the quantity and round to 1 decimal
            const existing = consolidatedMap.get(consolidationKey)
            existing.qty = Math.round((existing.qty + row.qty) * 10) / 10
        } else {
            // New item, add to map with rounded quantity
            consolidatedMap.set(consolidationKey, {
                revision_id: revisionId,
                project_id: projectId,
                company_id: companyId,
                spool_id: spoolId,
                line_number: row.line_number,
                area: row.area,
                sheet: row.sheet,
                spool_number: row.spool_number,
                spool_full_id: row.spool_full_id,
                piping_class: row.piping_class,
                rev_number: row.rev_number,
                qty: Math.round(row.qty * 10) / 10,  // Round to 1 decimal
                qty_unit: row.qty_unit,
                item_code: row.item_code,
                fab_type: row.fab_type,
                excel_row: row.excel_row
            })
        }
    })

    // 5. Insert consolidated data in batches
    const consolidatedRows = Array.from(consolidatedMap.values())
    const BATCH_SIZE = 500

    for (let i = 0; i < consolidatedRows.length; i += BATCH_SIZE) {
        const batch = consolidatedRows.slice(i, i + BATCH_SIZE)

        const { error: insertError } = await supabase
            .from('spools_mto')
            .insert(batch)

        if (insertError) {
            throw new Error(`Error inserting MTO batch: ${insertError.message}`)
        }
    }

    // Log warnings for spools not found
    if (spoolsNotFound.size > 0) {
        console.warn(`[MTO Upload] Warning: ${spoolsNotFound.size} spool(s) not found in spools table:`,
            Array.from(spoolsNotFound).join(', '))
        console.warn(`[MTO Upload] These MTO entries will have spool_id = NULL. Consider creating spools first or re-uploading MTO.`)
    } else {
        console.log(`[MTO Upload] ✓ All spools successfully linked`)
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
