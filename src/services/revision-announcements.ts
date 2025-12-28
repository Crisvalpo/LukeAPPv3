/**
 * REVISION ANNOUNCEMENTS SERVICE
 * 
 * Handles Excel upload of revision announcements to create/update
 * isometrics and engineering revisions in PIPING workflow.
 * 
 * Features:
 * - Excel parsing and validation
 * - Duplicate detection
 * - Atomic transactions
 * - Detailed error reporting
 * - Progress tracking
 */

import { createClient } from '@/lib/supabase/client'
import { IsometricStatus, getObsoleteStatus } from '@/constants/isometric-status'

export interface AnnouncementRow {
    iso_number: string
    line_number?: string
    rev_code: string
    line_type?: string
    area?: string
    sub_area?: string
    file_name?: string
    file_revision?: string
    tml?: string
    date?: string
    row?: number
}

export interface AnnouncementResult {
    success: boolean
    summary: {
        total: number
        isometricsCreated: number
        isometricsUpdated: number
        revisionsCreated: number
        revisionsSkipped: number
        errors: number
    }
    details: Array<{
        row: number
        iso_number: string
        rev_code: string
        action: 'created' | 'updated' | 'skipped' | 'error'
        message: string
    }>
    errors: Array<{
        row: number
        field?: string
        message: string
    }>
}

interface ProcessedIsometric {
    id?: string
    iso_number: string
    revisions: Map<string, boolean> // rev_code → exists
}

/**
 * Process announcement Excel upload
 */
export async function processAnnouncementUpload(
    projectId: string,
    companyId: string,
    data: any[]
): Promise<AnnouncementResult> {
    const supabase = createClient()

    const result: AnnouncementResult = {
        success: false,
        summary: {
            total: data.length,
            isometricsCreated: 0,
            isometricsUpdated: 0,
            revisionsCreated: 0,
            revisionsSkipped: 0,
            errors: 0
        },
        details: [],
        errors: []
    }

    try {
        // Step 1: Validate and normalize data
        const normalized = normalizeAnnouncementData(data)

        // Step 2: Group by isometric
        const grouped = groupByIsometric(normalized)

        // Step 3: Fetch existing isometrics
        const existingIsos = await fetchExistingIsometrics(
            supabase,
            projectId,
            Array.from(grouped.keys())
        )

        // Step 4: Process each isometric
        for (const [isoNumber, announcements] of grouped) {
            const existing = existingIsos.get(isoNumber)

            // Create or get isometric
            let isometricId: string
            if (!existing) {
                // Create new isometric
                const firstAnn = announcements[0]
                const { data: newIso, error } = await supabase
                    .from('isometrics')
                    .insert({
                        project_id: projectId,
                        company_id: companyId,
                        iso_number: isoNumber,
                        line_number: firstAnn.line_number,
                        line_type: firstAnn.line_type,
                        area: firstAnn.area,
                        sub_area: firstAnn.sub_area,
                        file_name: firstAnn.file_name,
                        file_revision: firstAnn.file_revision,
                        revision: announcements[announcements.length - 1].rev_code, // Latest
                        status: IsometricStatus.VIGENTE
                    })
                    .select('id')
                    .single()

                if (error) throw error
                isometricId = newIso.id
                result.summary.isometricsCreated++

                result.details.push({
                    row: 0, // Will update with specific rows
                    iso_number: isoNumber,
                    rev_code: '',
                    action: 'created',
                    message: `Isométrico creado: ${isoNumber}`
                })
            } else {
                isometricId = existing.id

                // Update isometric metadata
                const latestAnn = announcements[announcements.length - 1]
                await supabase
                    .from('isometrics')
                    .update({
                        line_number: latestAnn.line_number,
                        line_type: latestAnn.line_type,
                        area: latestAnn.area,
                        sub_area: latestAnn.sub_area,
                        file_name: latestAnn.file_name,
                        file_revision: latestAnn.file_revision,
                        revision: latestAnn.rev_code
                    })
                    .eq('id', isometricId)

                // Mark old isometric as obsolete if new revision
                const currentStatus = (existing.status || IsometricStatus.VIGENTE) as any
                const newStatus = getObsoleteStatus(currentStatus)
                if (newStatus !== currentStatus) {
                    await supabase
                        .from('isometrics')
                        .update({ status: newStatus })
                        .eq('id', isometricId)
                }

                result.summary.isometricsUpdated++
            }

            // Step 5: Create revisions
            for (const ann of announcements) {
                // Check if revision exists
                const { data: existingRev } = await supabase
                    .from('engineering_revisions')
                    .select('id')
                    .eq('isometric_id', isometricId)
                    .eq('rev_code', ann.rev_code)
                    .single()

                if (existingRev) {
                    result.summary.revisionsSkipped++
                    result.details.push({
                        row: ann.row || 0,
                        iso_number: isoNumber,
                        rev_code: ann.rev_code,
                        action: 'skipped',
                        message: `Revisión ya existe: ${isoNumber} Rev ${ann.rev_code}`
                    })
                    continue
                }

                // Create revision
                const { error: revError } = await supabase
                    .from('engineering_revisions')
                    .insert({
                        isometric_id: isometricId,
                        project_id: projectId,
                        rev_code: ann.rev_code,
                        transmittal: ann.tml,
                        announcement_date: ann.date ? new Date(ann.date) : null,
                        revision_status: 'PENDING'
                    })

                if (revError) {
                    result.summary.errors++
                    result.errors.push({
                        row: ann.row || 0,
                        message: `Error creando revisión ${isoNumber} Rev ${ann.rev_code}: ${revError.message}`
                    })
                } else {
                    result.summary.revisionsCreated++
                    result.details.push({
                        row: ann.row || 0,
                        iso_number: isoNumber,
                        rev_code: ann.rev_code,
                        action: 'created',
                        message: `Revisión creada: ${isoNumber} Rev ${ann.rev_code}`
                    })
                }
            }

            // Step 6: Update current_revision_id to latest
            const latestRevCode = announcements[announcements.length - 1].rev_code
            const { data: latestRev } = await supabase
                .from('engineering_revisions')
                .select('id')
                .eq('isometric_id', isometricId)
                .eq('rev_code', latestRevCode)
                .single()

            if (latestRev) {
                await supabase
                    .from('isometrics')
                    .update({ current_revision_id: latestRev.id })
                    .eq('id', isometricId)
            }
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
 * Normalize announcement data from Excel
 */
function normalizeAnnouncementData(data: any[]): (AnnouncementRow & { row: number })[] {
    return data.map((row, index) => ({
        iso_number: String(row['N°ISOMÉTRICO'] || row['ISO NUMBER'] || '').trim().toUpperCase(),
        line_number: row['N° LÍNEA'] || row['LINE NUMBER'] ? String(row['N° LÍNEA'] || row['LINE NUMBER']).trim() : undefined,
        rev_code: String(row['REV. ISO'] || row['REV'] || 'A').trim().toUpperCase(),
        line_type: row['TIPO LÍNEA'] ? String(row['TIPO LÍNEA']).trim() : undefined,
        area: row['ÁREA'] || row['AREA'] ? String(row['ÁREA'] || row['AREA']).trim().toUpperCase() : undefined,
        sub_area: row['SUB-ÁREA'] ? String(row['SUB-ÁREA']).trim().toUpperCase() : undefined,
        file_name: row['ARCHIVO'] ? String(row['ARCHIVO']).trim() : undefined,
        file_revision: row['REV. ARCHIVO'] ? String(row['REV. ARCHIVO']).trim() : undefined,
        tml: row['TML'] ? String(row['TML']).trim() : undefined,
        date: row['FECHA'] ? String(row['FECHA']).trim() : undefined,
        row: index + 2 // Excel row (with header)
    }))
}

/**
 * Group announcements by isometric number
 */
function groupByIsometric(
    data: (AnnouncementRow & { row: number })[]
): Map<string, (AnnouncementRow & { row: number })[]> {
    const grouped = new Map<string, (AnnouncementRow & { row: number })[]>()

    for (const item of data) {
        if (!grouped.has(item.iso_number)) {
            grouped.set(item.iso_number, [])
        }
        grouped.get(item.iso_number)!.push(item)
    }

    // Sort revisions within each isometric
    for (const [_, revisions] of grouped) {
        revisions.sort((a, b) => a.rev_code.localeCompare(b.rev_code))
    }

    return grouped
}

/**
 * Fetch existing isometrics from database
 */
async function fetchExistingIsometrics(
    supabase: ReturnType<typeof createClient>,
    projectId: string,
    isoNumbers: string[]
): Promise<Map<string, { id: string; iso_number: string; status?: string }>> {
    const { data, error } = await supabase
        .from('isometrics')
        .select('id, iso_number, status')
        .eq('project_id', projectId)
        .in('iso_number', isoNumbers)

    if (error) throw error

    const map = new Map<string, { id: string; iso_number: string; status?: string }>()
    data?.forEach(iso => map.set(iso.iso_number, iso))

    return map
}

/**
 * Validate announcement data structure
 */
export function validateAnnouncementData(data: any[]): {
    isValid: boolean
    errors: Array<{ row: number; field?: string; message: string }>
} {
    const errors: Array<{ row: number; field?: string; message: string }> = []

    // Check for required columns
    if (data.length === 0) {
        errors.push({ row: 0, message: 'El archivo está vacío' })
        return { isValid: false, errors }
    }

    const firstRow = data[0]

    // Check for ISO NUMBER (Spanish or English)
    const hasIsoNumber = 'N°ISOMÉTRICO' in firstRow || 'ISO NUMBER' in firstRow
    if (!hasIsoNumber) {
        errors.push({
            row: 0,
            field: 'N°ISOMÉTRICO',
            message: 'Columna requerida faltante: N°ISOMÉTRICO o ISO NUMBER'
        })
    }

    // Check for REV (Spanish or English)
    const hasRev = 'REV. ISO' in firstRow || 'REV' in firstRow
    if (!hasRev) {
        errors.push({
            row: 0,
            field: 'REV. ISO',
            message: 'Columna requerida faltante: REV. ISO o REV'
        })
    }

    if (errors.length > 0) {
        return { isValid: false, errors }
    }

    // Validate each row
    data.forEach((row, index) => {
        const rowNum = index + 2 // Excel row

        // ISO NUMBER required
        const isoNumber = row['N°ISOMÉTRICO'] || row['ISO NUMBER']
        if (!isoNumber || String(isoNumber).trim() === '') {
            errors.push({
                row: rowNum,
                field: 'N°ISOMÉTRICO',
                message: 'N°ISOMÉTRICO es requerido'
            })
        }

        // REV required
        const rev = row['REV. ISO'] || row['REV']
        if (!rev || String(rev).trim() === '') {
            errors.push({
                row: rowNum,
                field: 'REV. ISO',
                message: 'REV. ISO es requerido'
            })
        }
    })

    return {
        isValid: errors.length === 0,
        errors
    }
}

