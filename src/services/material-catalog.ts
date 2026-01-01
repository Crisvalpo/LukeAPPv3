/**
 * Material Catalog Service
 * Manages material master data (descriptions, specifications, etc.)
 */

import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

export interface MaterialCatalogItem {
    id: string
    project_id: string
    company_id: string
    ident_code: string
    short_desc: string
    long_desc?: string
    commodity_code?: string
    spec_code?: string
    unit_weight?: number
    part_group?: string
    sap_mat_grp?: string
    commodity_group?: string
    created_at: string
    updated_at: string
}

export interface CreateMaterialParams {
    ident_code: string
    short_desc: string
    long_desc?: string
    short_code?: string
    commodity_code?: string
    spec_code?: string
    unit_weight?: number
    part_group?: string
    sap_mat_grp?: string
    commodity_group?: string
    custom_fields?: Record<string, any>
}

/**
 * Get all materials for a project
 */
/**
 * Get materials with server-side pagination and filtering
 */
export async function getMaterialCatalog(
    projectId: string,
    params?: {
        page?: number
        limit?: number
        search?: string
        partGroup?: string
        inputFilters?: Record<string, string>
    }
): Promise<{ data: MaterialCatalogItem[]; count: number }> {
    const supabase = createClient()
    const page = params?.page || 1
    const limit = params?.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from('material_catalog')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)

    // Text search (ident or description)
    if (params?.search) {
        query = query.or(`ident_code.ilike.%${params.search}%,short_desc.ilike.%${params.search}%`)
    }

    // Part group filter
    if (params?.partGroup) {
        query = query.ilike('part_group', `%${params.partGroup}%`)
    }

    // Custom Input filters (JSONB)
    if (params?.inputFilters) {
        Object.entries(params.inputFilters).forEach(([key, value]) => {
            if (value) {
                // Query JSONB field: custom_fields ->> 'Input N' ilike value
                query = query.ilike(`custom_fields->>${key}`, `%${value}%`)
            }
        })
    }

    // Pagination
    query = query
        .order('ident_code')
        .range(from, to)

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching catalog: ${error.message}`)
    return { data: data || [], count: count || 0 }
}

/**
 * Get single material by ident code
 */
export async function getMaterialByIdent(
    projectId: string,
    identCode: string
): Promise<MaterialCatalogItem | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_catalog')
        .select('*')
        .eq('project_id', projectId)
        .eq('ident_code', identCode)
        .maybeSingle()

    if (error) throw new Error(`Error fetching material: ${error.message}`)
    return data
}

/**
 * Create a single material
 */
export async function createMaterial(
    projectId: string,
    companyId: string,
    params: CreateMaterialParams
): Promise<MaterialCatalogItem> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_catalog')
        .insert({
            project_id: projectId,
            company_id: companyId,
            ...params
        })
        .select()
        .single()

    if (error) throw new Error(`Error creating material: ${error.message}`)
    return data
}

/**
 * Update a material
 */
export async function updateMaterial(
    id: string,
    updates: Partial<CreateMaterialParams>
): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('material_catalog')
        .update(updates)
        .eq('id', id)

    if (error) throw new Error(`Error updating material: ${error.message}`)
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string): Promise<void> {
    const supabase = createClient()

    // TODO: Check if material is referenced in MTO/requests before deleting

    const { error } = await supabase
        .from('material_catalog')
        .delete()
        .eq('id', id)

    if (error) throw new Error(`Error deleting material: ${error.message}`)
}

/**
 * Delete ALL materials for a project
 * CAUTION: Destructive operation
 */
export async function deleteAllMaterials(projectId: string): Promise<void> {
    const supabase = createClient()

    // Safety check: Ensure we assume valid project
    if (!projectId) throw new Error("Project ID is required")

    const { error } = await supabase
        .from('material_catalog')
        .delete()
        .eq('project_id', projectId)

    if (error) throw new Error(`Error clearing catalog: ${error.message}`)
}

/**
 * Parse material catalog from Excel array
 */
export function parseMaterialCatalogFromArray(rows: any[]): CreateMaterialParams[] {
    const materials: CreateMaterialParams[] = []

    rows.forEach((row, index) => {
        // Skip header row if it resembles a header
        if (index === 0 && row['Ident'] === 'Ident') return

        // Map Excel columns to our fields
        const ident = row['Ident'] || row['Ident code']
        const shortDesc = row['Short Desc']

        // Require ident and description
        if (!ident || !shortDesc) {
            console.warn(`Row ${index + 1}: Missing ident or description, skipping`)
            return
        }

        // Parse weight with comma support (e.g. "16,077" -> 16.077)
        let weight: number | undefined = undefined
        const rawWeight = row['Unit Weight']
        if (rawWeight !== undefined && rawWeight !== null) {
            if (typeof rawWeight === 'number') {
                weight = rawWeight
            } else {
                // Replace comma with dot and parse
                const normalized = String(rawWeight).replace(',', '.')
                const parsed = parseFloat(normalized)
                if (!isNaN(parsed)) weight = parsed
            }
        }

        // Capture custom inputs
        const customFields: Record<string, any> = {}
        if (row['Input 1'] !== undefined) customFields['Input 1'] = row['Input 1']
        if (row['Input 2'] !== undefined) customFields['Input 2'] = row['Input 2']
        if (row['Input 3'] !== undefined) customFields['Input 3'] = row['Input 3']
        if (row['Input 4'] !== undefined) customFields['Input 4'] = row['Input 4']
        // Save "Ident code" (the numeric one) separately if "Ident" was used as the main key
        if (row['Ident code']) customFields['alt_ident_code'] = row['Ident code']

        materials.push({
            ident_code: String(ident).trim(),
            short_desc: String(shortDesc).trim(),
            long_desc: row['Long Desc'] || undefined, // Keep mapping if present, though not in user list
            short_code: row['Short Code'] || undefined,
            commodity_code: row['Commodity Code'] || undefined,
            spec_code: row['Spec Code'] || undefined,
            unit_weight: weight,
            part_group: row['Part Group'] || undefined,
            sap_mat_grp: row['Sap Mat Grp'] || undefined,
            commodity_group: row['Commodity Group'] || undefined,
            custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined
        })
    })

    return materials
}

/**
 * Bulk upload materials from Excel
 */
/**
 * Get distinct values for filter dropdowns
 */
export async function getCatalogFilterOptions(projectId: string): Promise<{
    partGroups: string[]
    input1: string[]
    input2: string[]
    input3: string[]
    input4: string[]
}> {
    const supabase = createClient()

    // We fetch relevant columns to compute distincts
    // NOTE: For very large datasets (100k+), this should be replaced by a Postgres RPC 
    // to avoid fetching data. For now (up to ~20k), fetching these strings is fast enough.
    const { data, error } = await supabase
        .from('material_catalog')
        .select('part_group, custom_fields')
        .eq('project_id', projectId)

    if (error) throw new Error(`Error fetching filter options: ${error.message}`)

    const partGroups = new Set<string>()
    const input1 = new Set<string>()
    const input2 = new Set<string>()
    const input3 = new Set<string>()
    const input4 = new Set<string>()

    data?.forEach(item => {
        if (item.part_group) partGroups.add(item.part_group)
        if (item.custom_fields) {
            if (item.custom_fields['Input 1']) input1.add(item.custom_fields['Input 1'])
            if (item.custom_fields['Input 2']) input2.add(item.custom_fields['Input 2'])
            if (item.custom_fields['Input 3']) input3.add(item.custom_fields['Input 3'])
            if (item.custom_fields['Input 4']) input4.add(item.custom_fields['Input 4'])
        }
    })

    return {
        partGroups: Array.from(partGroups).sort(),
        input1: Array.from(input1).sort(),
        input2: Array.from(input2).sort(),
        input3: Array.from(input3).sort(),
        input4: Array.from(input4).sort(),
    }
}

/**
 * Bulk upload materials from Excel (Optimized Upsert)
 */
export async function bulkUploadMaterials(
    projectId: string,
    companyId: string,
    items: CreateMaterialParams[],
    onProgress?: (current: number, total: number) => void
): Promise<{ inserted: number; updated: number; skipped: number; errors: string[] }> {
    const supabase = createClient()

    let inserted = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []
    const total = items.length

    // Chunk size for bulk operations
    const CHUNK_SIZE = 100

    for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE)

        // Prepare payload with explicit IDs/Foreign Keys
        const payload = chunk.map(item => ({
            project_id: projectId,
            company_id: companyId,
            ...item,
            // Ensure spec_code is at least empty string if undefined to satisfy unique index safely if needed
            // But usually NULL works if index handles it. Our migration uses COALESCE(spec_code, '').
            // To be safe with the unique index, we should probably normalize empty/null here if the DB expects it.
            // Let's pass it as is.
        }))

        try {
            // OPTIMIZED: Batch operations (1 SELECT + 1 INSERT + parallel UPDATEs)

            // Step 1: Single query to get ALL existing items in this chunk
            const chunkIdents = chunk.map(item => item.ident_code)
            const { data: existingItems } = await supabase
                .from('material_catalog')
                .select('id, ident_code, spec_code')
                .eq('project_id', projectId)
                .in('ident_code', chunkIdents)

            // Step 2: Build lookup map (key = ident|||spec)
            const existingMap = new Map<string, string>()
            existingItems?.forEach(e => {
                const key = `${e.ident_code}|||${e.spec_code || ''}`
                existingMap.set(key, e.id)
            })

            // Step 3: Separate into new vs existing
            const toInsert: any[] = []
            const toUpdate: any[] = []

            chunk.forEach(item => {
                const fullItem = {
                    project_id: projectId,
                    company_id: companyId,
                    ...item
                }

                const key = `${item.ident_code}|||${item.spec_code || ''}`
                const existingId = existingMap.get(key)

                if (existingId) {
                    // Always update on exact match (Ident + Spec)
                    toUpdate.push({ id: existingId, ...fullItem })
                } else {
                    toInsert.push(fullItem)
                }
            })

            // Step 4: Batch INSERT all new items (FAST!)
            if (toInsert.length > 0) {
                const { error: insertError, data: insertedData } = await supabase
                    .from('material_catalog')
                    .insert(toInsert)
                    .select()

                if (insertError) {
                    errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} INSERT: ${insertError.message}`)
                } else {
                    inserted += (insertedData?.length || 0)
                }
            }

            // Step 5: Parallel UPDATE for existing items
            if (toUpdate.length > 0) {
                const updatePromises = toUpdate.map(item =>
                    supabase.from('material_catalog').update(item).eq('id', item.id)
                )

                const results = await Promise.allSettled(updatePromises)
                results.forEach((result, idx) => {
                    if (result.status === 'fulfilled' && !result.value.error) {
                        updated++
                    } else {
                        errors.push(`Update failed: ${toUpdate[idx].ident_code}`)
                    }
                })
            }

            if (onProgress) {
                onProgress(Math.min(i + CHUNK_SIZE, total), total)
            }

        } catch (error: any) {
            const errorMsg = error.message
                || error.details
                || error.hint
                || (typeof error === 'object' ? JSON.stringify(error) : String(error))

            const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1
            errors.push(`Chunk ${chunkIndex} Error: ${errorMsg} (Code: ${error.code})`)

            console.error(`Bulk upload failed at Chunk ${chunkIndex}:`, {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                fullError: error
            })
        }
    }

    return { inserted, updated, skipped, errors }
}

/**
 * Export catalog to Excel
 */
/**
 * Export catalog to Excel
 */
export async function exportCatalogToExcel(projectId: string): Promise<void> {
    // Fetch all items (limit 10000)
    const { data: materials } = await getMaterialCatalog(projectId, { limit: 10000 })

    const exportData = materials.map(m => ({
        'Ident': m.ident_code,
        'Short Desc': m.short_desc,
        'Long Desc': m.long_desc || '',
        'Commodity Code': m.commodity_code || '',
        'Spec Code': m.spec_code || '',
        'Unit Weight': m.unit_weight || '',
        'Part Group': m.part_group || '',
        'Sap Mat Grp': m.sap_mat_grp || '',
        'Commodity Group': m.commodity_group || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials')

    XLSX.writeFile(workbook, `material_catalog_${projectId.slice(0, 8)}.xlsx`)
}

/**
 * Clone catalog from another project
 */
export async function cloneCatalogFromProject(
    sourceProjectId: string,
    targetProjectId: string,
    targetCompanyId: string
): Promise<number> {
    // Fetch all items from source
    const { data: sourceMaterials } = await getMaterialCatalog(sourceProjectId, { limit: 10000 })
    const supabase = createClient()

    if (sourceMaterials.length === 0) return 0

    const materialsToInsert = sourceMaterials.map(m => ({
        project_id: targetProjectId,
        company_id: targetCompanyId,
        ident_code: m.ident_code,
        short_desc: m.short_desc,
        long_desc: m.long_desc,
        commodity_code: m.commodity_code,
        spec_code: m.spec_code,
        unit_weight: m.unit_weight,
        part_group: m.part_group,
        sap_mat_grp: m.sap_mat_grp,
        commodity_group: m.commodity_group
    }))

    const { error, count } = await supabase
        .from('material_catalog')
        .insert(materialsToInsert)

    if (error) throw new Error(`Error cloning catalog: ${error.message}`)
    return count || 0
}
