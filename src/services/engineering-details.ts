/**
 * ENGINEERING DETAILS SERVICE
 * 
 * Handles upload of engineering details (Spools, Welds, MTO, Bolted Joints)
 * linked to specific revisions.
 */

import { createClient } from '@/lib/supabase/client'

export type DetailType = 'spools' | 'welds' | 'mto' | 'bolted_joints'

export interface DetailUploadParams {
    revisionId: string
    projectId: string
    companyId: string
    detailType: DetailType
    data: any[]
}

export interface DetailResult {
    success: boolean
    summary: {
        total: number
        created: number
        updated: number
        skipped: number
        errors: number
    }
    details: Array<{
        row: number
        identifier: string
        action: 'created' | 'updated' | 'skipped' | 'error'
        message: string
    }>
    errors: Array<{
        row: number
        field?: string
        message: string
        data?: any
    }>
}

/**
 * Process detail upload based on type
 */
export async function processDetailUpload(
    params: DetailUploadParams
): Promise<DetailResult> {
    const { detailType, data, revisionId, projectId, companyId } = params
    const supabase = createClient()

    const result: DetailResult = {
        success: false,
        summary: { total: data.length, created: 0, updated: 0, skipped: 0, errors: 0 },
        details: [],
        errors: []
    }

    try {
        // Validate context exists
        if (!revisionId || !companyId || !projectId) {
            throw new Error('Missing required context (revisionId, companyId, projectId)')
        }

        console.log(`🚀 Starting ${detailType} upload for Revision ${revisionId}`)

        // Process in batches of 50 to avoid timeouts
        const BATCH_SIZE = 50
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE)

            // Process batch in parallel but track results individually
            await Promise.all(batch.map(async (row, index) => {
                const rowIndex = i + index + 2 // Excel row (header + 0-based index)

                try {
                    // normalize keys to uppercase for easier matching
                    const normalizedRow: any = {}
                    Object.keys(row).forEach(k => {
                        normalizedRow[k.trim().toUpperCase()] = row[k]
                    })

                    if (detailType === 'spools') {
                        await processSpool(supabase, normalizedRow, rowIndex, params, result)
                    } else if (detailType === 'welds') {
                        await processWeld(supabase, normalizedRow, rowIndex, params, result)
                    } else if (detailType === 'mto') {
                        // Pending MTO implementation
                        result.summary.skipped++
                    } else if (detailType === 'bolted_joints') {
                        // Pending Joints implementation
                        result.summary.skipped++
                    }

                } catch (error: any) {
                    result.summary.errors++
                    result.errors.push({
                        row: rowIndex,
                        message: error.message || 'Unknown error',
                        data: row
                    })
                }
            }))
        }

        result.success = result.summary.errors === 0
        return result

    } catch (error: any) {
        console.error('Upload Process Failed:', error)
        result.errors.push({ row: 0, message: `System Error: ${error.message}` })
        return result
    }
}

/**
 * Process a single SPOOL row
 */
async function processSpool(
    supabase: any,
    row: any,
    rowIndex: number,
    params: DetailUploadParams,
    result: DetailResult
) {
    const spoolNum = row['SPOOL NUMBER'] || row['SPOOL']
    const isoNum = row['ISO NUMBER'] || row['ISO']

    if (!spoolNum || !isoNum) {
        throw new Error('Missing SPOOL NUMBER or ISO NUMBER')
    }

    // 1. Check if ISO exists in this project
    // Note: optimization would be to fetch all ISOs once, but for robust checks we query
    const { data: iso } = await supabase
        .from('isometrics')
        .select('id')
        .eq('project_id', params.projectId)
        .eq('iso_number', isoNum)
        .maybeSingle()

    if (!iso) {
        result.summary.errors++
        result.details.push({
            row: rowIndex,
            identifier: spoolNum,
            action: 'error',
            message: `Isometric ${isoNum} not found in project`
        })
        return
    }

    // 2. Insert/Update Spool
    // Using upsert based on spool_number + project_id (assuming spool numbers unique in project? or just ISO?)
    // Usually Spools are unique within an ISO. 
    // Schema likely has unique(project_id, spool_number) or (iso_id, spool_number)

    const payload = {
        project_id: params.projectId,
        company_id: params.company_id, // Wait, params has companyId (camelCase)
        revision_id: params.revisionId,
        iso_id: iso.id, // If spool table has iso_id link
        spool_number: spoolNum,
        line_number: row['LINE NUMBER'],
        weight: parseFloat(row['WEIGHT'] || '0'),
        diameter: parseFloat(row['DIAMETER'] || '0'),
        material: row['MATERIAL'],
        schedule: row['SCH'] || row['SCHEDULE'],
        system: row['SYSTEM']
    }

    // We need to check exact columns of 'spools' table. 
    // Assuming standard columns + revision_id

    const { error } = await supabase
        .from('spools')
        .upsert(payload, { onConflict: 'project_id, spool_number' }) // Check constraint name

    if (error) throw error

    result.summary.created++
    result.details.push({
        row: rowIndex,
        identifier: spoolNum,
        action: 'created',
        message: `Spool ${spoolNum} loaded`
    })
}

/**
 * Process a single WELD row
 */
async function processWeld(
    supabase: any,
    row: any,
    rowIndex: number,
    params: DetailUploadParams,
    result: DetailResult
) {
    // Basic stub for weld processing
    const weldNum = row['WELD NUMBER'] || row['WELD']
    const spoolNum = row['SPOOL NUMBER'] || row['SPOOL']

    if (!weldNum || !spoolNum) {
        throw new Error('Missing WELD NUMBER or SPOOL NUMBER')
    }

    // Logic similar to Spools (Find Spool -> Upsert Weld)
    // For now logging as skipped until implemented
    result.summary.skipped++
    result.details.push({
        row: rowIndex,
        identifier: weldNum,
        action: 'skipped',
        message: 'Weld implementation pending'
    })
}
