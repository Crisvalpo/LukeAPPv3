/**
 * ENGINEERING DETAILS SERVICE - WELDS-FIRST PATTERN
 * 
 * Based on PIPING-REF proven architecture:
 * - Upload Welds (with spool_number column)
 * - Spools auto-generated from welds grouping
 * - Auto-spooling logic for first revisions
 * - Impact evaluation flag for subsequent revisions
 */

import { createClient } from '@/lib/supabase/client'
import { assignSpoolTags } from './spool-tagging'

export interface SpoolWeldRow {
    'ISO NUMBER': string
    'REV': string
    'LINE NUMBER'?: string
    'SPOOL NUMBER': string
    'SHEET'?: string
    'WELD NUMBER': string
    'DESTINATION'?: string  // SHOP / FIELD
    'TYPE WELD'?: string    // BW / SW / TW
    'NPS'?: string
    'SCH'?: string
    'THICKNESS'?: string
    'PIPING CLASS'?: string
    'MATERIAL'?: string
}

export interface UploadWeldsResult {
    success: boolean
    message: string
    revision_id?: string
    was_auto_spooled: boolean
    requires_impact_evaluation: boolean
    details: {
        welds_inserted: number
        spools_detected: number
    }
    errors: string[]
}

/**
 * REMOVED: Auto-spool logic
 * Status "Spooleado" is now derived from data_status = 'COMPLETO'
 * See: Phase 8 Architecture Refactor
 */

/**
 * Upload Welds for a specific revision
 * Main function following PIPING-REF pattern
 */
export async function uploadSpoolsWelds(
    revisionId: string,
    projectId: string,
    companyId: string,
    excelRows: SpoolWeldRow[],
    userId?: string
): Promise<UploadWeldsResult> {
    const supabase = createClient()

    const result: UploadWeldsResult = {
        success: false,
        message: '',
        was_auto_spooled: false,
        requires_impact_evaluation: false,
        details: {
            welds_inserted: 0,
            spools_detected: 0
        },
        errors: []
    }

    try {
        // 1. Validate revision exists and is VIGENTE
        const { data: revision, error: revError } = await supabase
            .from('engineering_revisions')
            .select('id, revision_status, isometric_id')
            .eq('id', revisionId)
            .maybeSingle()

        if (revError || !revision) {
            result.errors.push('Revisión no encontrada')
            result.message = 'La revisión especificada no existe'
            return result
        }

        if (revision.revision_status !== 'VIGENTE') {
            result.errors.push('Revisión no está en estado VIGENTE')
            result.message = `La revisión está en estado ${revision.revision_status}, solo se pueden cargar detalles a revisiones VIGENTE`
            return result
        }

        // 2. Filter and validate rows
        const validRows = excelRows.filter(row =>
            row['WELD NUMBER'] && row['SPOOL NUMBER']
        )

        if (validRows.length === 0) {
            result.errors.push('No se encontraron filas válidas (deben tener WELD NUMBER y SPOOL NUMBER)')
            result.message = 'El archivo no contiene soldaduras válidas'
            return result
        }

        // 3. Count unique spools
        const uniqueSpools = new Set(validRows.map(r => r['SPOOL NUMBER']))
        result.details.spools_detected = uniqueSpools.size

        // 4. Map rows to DB schema
        const weldsToInsert = validRows.map((row, index) => ({
            revision_id: revisionId,
            project_id: projectId,
            company_id: companyId,
            iso_number: String(row['ISO NUMBER'] || ''),
            rev: String(row['REV'] || ''),
            line_number: row['LINE NUMBER'] ? String(row['LINE NUMBER']) : null,
            spool_number: String(row['SPOOL NUMBER']),
            sheet: row['SHEET'] ? String(row['SHEET']) : null,
            weld_number: String(row['WELD NUMBER']),
            destination: row['DESTINATION'] ? String(row['DESTINATION']) : null,
            type_weld: row['TYPE WELD'] ? String(row['TYPE WELD']) : null,
            nps: row['NPS'] ? String(row['NPS']) : null,
            sch: row['SCH'] ? String(row['SCH']) : null,
            thickness: row['THICKNESS'] ? String(row['THICKNESS']) : null,
            piping_class: row['PIPING CLASS'] ? String(row['PIPING CLASS']) : null,
            material: row['MATERIAL'] ? String(row['MATERIAL']) : null,
            display_order: index + 1,
            created_by: userId || null
        }))

        // 5. Insert in batches of 100
        const BATCH_SIZE = 100
        let totalInserted = 0

        for (let i = 0; i < weldsToInsert.length; i += BATCH_SIZE) {
            const batch = weldsToInsert.slice(i, i + BATCH_SIZE)

            const { data: inserted, error: insertError } = await supabase
                .from('spools_welds')
                .insert(batch)
                .select('id')

            if (insertError) {
                result.errors.push(`Error en batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`)
                console.error('Insert Error:', insertError)
            } else {
                totalInserted += inserted?.length || 0
            }
        }

        result.details.welds_inserted = totalInserted

        if (totalInserted === 0) {
            result.message = 'No se pudieron insertar soldaduras'
            return result
        }

        // 6. Auto-assign tags to spools (NEW)
        // Fetch all spools created by trigger for this revision
        const { data: spools } = await supabase
            .from('spools')
            .select('id, spool_number') // Removed erroneous isometric_id
            .eq('revision_id', revisionId)

        if (spools && spools.length > 0) {
            try {
                const spoolsToTag = spools.map(s => ({
                    spool_id: s.id,
                    spool_number: s.spool_number,
                    isometric_id: revision.isometric_id, // Use valid isometric_id from revision
                    revision_id: revisionId
                }))

                const tagAssignments = await assignSpoolTags(
                    projectId,
                    companyId,
                    revisionId,
                    spoolsToTag
                )

                console.log(`✅ Auto-assigned tags to ${tagAssignments.size} spools`)
            } catch (tagError) {
                console.error('Error auto-assigning tags:', tagError)
                result.errors.push('Tags no pudieron asignarse automáticamente')
            }
        }

        // 7. REMOVED: Auto-spool logic (now derived from data_status)
        // The revision will show "SPOOLEADO" badge in UI when data_status = COMPLETO
        result.was_auto_spooled = false
        result.requires_impact_evaluation = false

        // 8. Success
        result.success = totalInserted > 0
        result.revision_id = revisionId
        result.message = `Se cargaron ${totalInserted} soldaduras en ${uniqueSpools.size} spools`

        // Message already complete, no auto-spool messaging needed

        // 9. Update Parent Isometric Timestamp (Touch)
        // Ensure this action floats to the top of the Master View
        await supabase
            .from('isometrics')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', revision.isometric_id)


        return result

    } catch (error: any) {
        result.errors.push(`Error inesperado: ${error.message}`)
        result.message = 'Error al procesar la carga de soldaduras'
        console.error('Upload Welds Error:', error)
        return result
    }
}
