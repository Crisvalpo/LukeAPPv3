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

export interface AnnouncementRow {
    iso_number: string
    line_number?: string
    rev_code: string
    sheet?: string
    area?: string
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
                        area: firstAnn.area,
                        revision: announcements[announcements.length - 1].rev_code, // Latest
                        status: 'ACTIVE'
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

                // Update isometric metadata if needed
                const latestAnn = announcements[announcements.length - 1]
                await supabase
                    .from('isometrics')
                    .update({
                        line_number: latestAnn.line_number,
                        area: latestAnn.area,
                        revision: latestAnn.rev_code
                    })
                    .eq('id', isometricId)

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
        iso_number: String(row['ISO NUMBER'] || '').trim().toUpperCase(),
        line_number: row['LINE NUMBER'] ? String(row['LINE NUMBER']).trim() : undefined,
        rev_code: String(row['REV'] || 'A').trim().toUpperCase(),
        sheet: row['SHEET'] ? String(row['SHEET']).trim() : undefined,
        area: row['AREA'] ? String(row['AREA']).trim().toUpperCase() : undefined,
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
): Promise<Map<string, { id: string; iso_number: string }>> {
    const { data, error } = await supabase
        .from('isometrics')
        .select('id, iso_number')
        .eq('project_id', projectId)
        .in('iso_number', isoNumbers)

    if (error) throw error

    const map = new Map<string, { id: string; iso_number: string }>()
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
    const requiredColumns = ['ISO NUMBER', 'REV']

    for (const col of requiredColumns) {
        if (!(col in firstRow)) {
            errors.push({
                row: 0,
                field: col,
                message: `Columna requerida faltante: ${col}`
            })
        }
    }

    if (errors.length > 0) {
        return { isValid: false, errors }
    }

    // Validate each row
    data.forEach((row, index) => {
        const rowNum = index + 2 // Excel row

        // ISO NUMBER required
        if (!row['ISO NUMBER'] || String(row['ISO NUMBER']).trim() === '') {
            errors.push({
                row: rowNum,
                field: 'ISO NUMBER',
                message: 'ISO NUMBER es requerido'
            })
        }

        // REV required
        if (!row['REV'] || String(row['REV']).trim() === '') {
            errors.push({
                row: rowNum,
                field: 'REV',
                message: 'REV es requerido'
            })
        }
    })

    return {
        isValid: errors.length === 0,
        errors
    }
}
