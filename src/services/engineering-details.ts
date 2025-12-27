/**
 * ENGINEERING DETAILS SERVICE
 * 
 * Handles Phase 2 upload: Engineering details (spools, welds, MTO, bolted joints)
 * linked to specific revisions.
 * 
 * Features:
 * - Multi-entity support (4 detail types)
 * - Revision-based linking
 * - Duplicate detection
 * - Batch processing
 * - Detailed error reporting
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
    }>
}

/**
 * Process engineering details upload
 */
export async function processDetailUpload(
    params: DetailUploadParams
): Promise<DetailResult> {
    const { revisionId, projectId, companyId, detailType, data } = params

    const supabase = createClient()

    const result: DetailResult = {
        success: false,
        summary: {
            total: data.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        },
        details: [],
        errors: []
    }

    try {
        // Route to correct handler based on detail type
        switch (detailType) {
            case 'spools':
                await processSpools(supabase, revisionId, projectId, data, result)
                break
            case 'welds':
                await processWelds(supabase, revisionId, projectId, data, result)
                break
            case 'mto':
                await processMTO(supabase, revisionId, projectId, data, result)
                break
            case 'bolted_joints':
                await processBoltedJoints(supabase, revisionId, projectId, data, result)
                break
        }

        result.success = result.summary.errors === 0

    } catch (error: any) {
        result.success = false
        result.errors.push({
            row: 0,
            message: `Error general: ${error.message}`
        })
    }

    return result
}

/**
 * Process spools upload
 */
async function processSpools(
    supabase: ReturnType<typeof createClient>,
    revisionId: string,
    projectId: string,
    data: any[],
    result: DetailResult
) {
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2 // Excel row

        const spoolNumber = String(row['SPOOL NUMBER'] || '').trim()

        if (!spoolNumber) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                field: 'SPOOL NUMBER',
                message: 'SPOOL NUMBER es requerido'
            })
            continue
        }

        // Check if spool exists for this revision
        const { data: existing } = await supabase
            .from('spools')
            .select('id')
            .eq('revision_id', revisionId)
            .eq('spool_number', spoolNumber)
            .single()

        if (existing) {
            result.summary.skipped++
            result.details.push({
                row: rowNum,
                identifier: spoolNumber,
                action: 'skipped',
                message: `Spool ya existe: ${spoolNumber}`
            })
            continue
        }

        // Insert spool
        const { error } = await supabase
            .from('spools')
            .insert({
                revision_id: revisionId,
                project_id: projectId,
                spool_number: spoolNumber,
                iso_number: String(row['ISO NUMBER'] || '').trim(),
                line_number: String(row['LINE NUMBER'] || '').trim(),
                revision: String(row['REV'] || '').trim(),
                weight: row['WEIGHT'] ? parseFloat(row['WEIGHT']) : null,
                diameter: String(row['DIAMETER'] || '').trim() || null,
                fabrication_status: 'NOT_STARTED'
            })

        if (error) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                message: `Error insertando spool ${spoolNumber}: ${error.message}`
            })
        } else {
            result.summary.created++
            result.details.push({
                row: rowNum,
                identifier: spoolNumber,
                action: 'created',
                message: `Spool creado: ${spoolNumber}`
            })
        }
    }
}

/**
 * Process welds upload
 */
async function processWelds(
    supabase: ReturnType<typeof createClient>,
    revisionId: string,
    projectId: string,
    data: any[],
    result: DetailResult
) {
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2

        const weldNumber = String(row['WELD NUMBER'] || '').trim()
        const spoolNumber = String(row['SPOOL NUMBER'] || '').trim()

        if (!weldNumber) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                field: 'WELD NUMBER',
                message: 'WELD NUMBER es requerido'
            })
            continue
        }

        // Check if weld exists for this revision
        const { data: existing } = await supabase
            .from('welds')
            .select('id')
            .eq('revision_id', revisionId)
            .eq('weld_number', weldNumber)
            .single()

        if (existing) {
            result.summary.skipped++
            result.details.push({
                row: rowNum,
                identifier: weldNumber,
                action: 'skipped',
                message: `Soldadura ya existe: ${weldNumber}`
            })
            continue
        }

        // Insert weld
        const { error } = await supabase
            .from('welds')
            .insert({
                revision_id: revisionId,
                project_id: projectId,
                weld_number: weldNumber,
                spool_number: spoolNumber,
                weld_type: String(row['TYPE WELD'] || '').trim() || null,
                nps: String(row['NPS'] || '').trim() || null,
                sch: String(row['SCH'] || '').trim() || null,
                thickness: row['THICKNESS'] ? parseFloat(row['THICKNESS']) : null,
                piping_class: String(row['PIPING CLASS'] || '').trim() || null,
                material: String(row['MATERIAL'] || '').trim() || null,
                destination: String(row['DESTINATION'] || '').trim() || null,
                sheet: String(row['SHEET'] || '').trim() || null,
                status: 'NOT_EXECUTED'
            })

        if (error) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                message: `Error insertando soldadura ${weldNumber}: ${error.message}`
            })
        } else {
            result.summary.created++
            result.details.push({
                row: rowNum,
                identifier: weldNumber,
                action: 'created',
                message: `Soldadura creada: ${weldNumber}`
            })
        }
    }
}

/**
 * Process MTO upload
 */
async function processMTO(
    supabase: ReturnType<typeof createClient>,
    revisionId: string,
    projectId: string,
    data: any[],
    result: DetailResult
) {
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2

        const itemCode = String(row['ITEM CODE'] || '').trim()

        if (!itemCode) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                field: 'ITEM CODE',
                message: 'ITEM CODE es requerido'
            })
            continue
        }

        // Check if MTO item exists for this revision
        const { data: existing } = await supabase
            .from('material_take_off')
            .select('id')
            .eq('revision_id', revisionId)
            .eq('item_code', itemCode)
            .single()

        if (existing) {
            result.summary.skipped++
            result.details.push({
                row: rowNum,
                identifier: itemCode,
                action: 'skipped',
                message: `MTO item ya existe: ${itemCode}`
            })
            continue
        }

        // Insert MTO
        const { error } = await supabase
            .from('material_take_off')
            .insert({
                revision_id: revisionId,
                project_id: projectId,
                item_code: itemCode,
                qty: row['QTY'] ? parseFloat(row['QTY']) : null,
                qty_unit: String(row['QTY UNIT'] || '').trim() || null,
                piping_class: String(row['PIPING CLASS'] || '').trim() || null,
                fab: String(row['FAB'] || '').trim() || null,
                sheet: String(row['SHEET'] || '').trim() || null,
                line_number: String(row['LINE NUMBER'] || '').trim() || null,
                area: String(row['AREA'] || '').trim() || null,
                spool_full_id: String(row['SPOOL FULL ID'] || '').trim() || null,
                spool_number: String(row['SPOOL NUMBER'] || '').trim() || null,
                revision: String(row['REVISION'] || '').trim() || null
            })

        if (error) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                message: `Error insertando MTO ${itemCode}: ${error.message}`
            })
        } else {
            result.summary.created++
            result.details.push({
                row: rowNum,
                identifier: itemCode,
                action: 'created',
                message: `MTO creado: ${itemCode}`
            })
        }
    }
}

/**
 * Process bolted joints upload
 */
async function processBoltedJoints(
    supabase: ReturnType<typeof createClient>,
    revisionId: string,
    projectId: string,
    data: any[],
    result: DetailResult
) {
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNum = i + 2

        const jointNumber = String(row['FLANGED JOINT NUMBER'] || '').trim()

        if (!jointNumber) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                field: 'FLANGED JOINT NUMBER',
                message: 'FLANGED JOINT NUMBER es requerido'
            })
            continue
        }

        // Check if joint exists for this revision
        const { data: existing } = await supabase
            .from('bolted_joints')
            .select('id')
            .eq('revision_id', revisionId)
            .eq('flanged_joint_number', jointNumber)
            .single()

        if (existing) {
            result.summary.skipped++
            result.details.push({
                row: rowNum,
                identifier: jointNumber,
                action: 'skipped',
                message: `Junta ya existe: ${jointNumber}`
            })
            continue
        }

        // Insert bolted joint
        const { error } = await supabase
            .from('bolted_joints')
            .insert({
                revision_id: revisionId,
                project_id: projectId,
                flanged_joint_number: jointNumber,
                piping_class: String(row['PIPING CLASS'] || '').trim() || null,
                material: String(row['MATERIAL'] || '').trim() || null,
                rating: String(row['RATING'] || '').trim() || null,
                nps: String(row['NPS'] || '').trim() || null,
                bolt_size: String(row['BOLT SIZE'] || '').trim() || null,
                sheet: String(row['SHEET'] || '').trim() || null,
                line_number: String(row['LINE NUMBER'] || '').trim() || null,
                iso_number: String(row['ISO NUMBER'] || '').trim() || null,
                revision: String(row['REVISION'] || '').trim() || null
            })

        if (error) {
            result.summary.errors++
            result.errors.push({
                row: rowNum,
                message: `Error insertando junta ${jointNumber}: ${error.message}`
            })
        } else {
            result.summary.created++
            result.details.push({
                row: rowNum,
                identifier: jointNumber,
                action: 'created',
                message: `Junta creada: ${jointNumber}`
            })
        }
    }
}
