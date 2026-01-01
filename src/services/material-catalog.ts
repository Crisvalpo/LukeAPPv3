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
    custom_fields?: Record<string, any>
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
        specCode?: string
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

    // Spec code filter
    if (params?.specCode) {
        query = query.eq('spec_code', params.specCode)
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
/**
 * Get raw data for client-side intelligent filtering
 */
export async function getCatalogRawFilterData(projectId: string): Promise<Pick<MaterialCatalogItem, 'part_group' | 'custom_fields' | 'spec_code'>[]> {
    const supabase = createClient()

    // Fetch only necessary columns for filtering
    const { data, error } = await supabase
        .from('material_catalog')
        .select('part_group, custom_fields, spec_code')
        .eq('project_id', projectId)

    if (error) throw new Error(`Error fetching filter data: ${error.message}`)

    // Cast to correct type since Supabase returns any[]
    return (data || []) as unknown as Pick<MaterialCatalogItem, 'part_group' | 'custom_fields' | 'spec_code'>[]
}

/**
 * Get distinct values for filter dropdowns (Deprecated related to UI, but kept for static initial load if needed)
 */
export async function getCatalogFilterOptions(projectId: string): Promise<{
    partGroups: string[]
    input1: string[]
    input2: string[]
    input3: string[]
    input4: string[]
}> {
    const data = await getCatalogRawFilterData(projectId)

    const partGroups = new Set<string>()
    const input1 = new Set<string>()
    const input2 = new Set<string>()
    const input3 = new Set<string>()
    const input4 = new Set<string>()

    data.forEach(item => {
        if (item.part_group) partGroups.add(item.part_group)
        // Access safely as it might be unknown/any from DB
        const custom: any = item.custom_fields || {}
        if (custom['Input 1']) input1.add(custom['Input 1'])
        if (custom['Input 2']) input2.add(custom['Input 2'])
        if (custom['Input 3']) input3.add(custom['Input 3'])
        if (custom['Input 4']) input4.add(custom['Input 4'])
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
export async function exportCatalogToExcel(projectId: string): Promise<void> {
    let allMaterials: MaterialCatalogItem[] = []
    let page = 1
    const BATCH_SIZE = 1000
    let hasMore = true

    // Fetch all items in batches
    while (hasMore) {
        const { data } = await getMaterialCatalog(projectId, {
            page,
            limit: BATCH_SIZE
        })

        if (data && data.length > 0) {
            allMaterials = [...allMaterials, ...data]
            if (data.length < BATCH_SIZE) {
                hasMore = false
            } else {
                page++
            }
        } else {
            hasMore = false
        }
    }

    const exportData = allMaterials.map(m => {
        // Extract inputs from custom_fields
        const custom = (m as any).custom_fields || {}

        return {
            'Ident': m.ident_code,
            'Ident code': custom.alt_ident_code || '',
            'Unit Weight': m.unit_weight || '',
            'Input 1': custom['Input 1'] || '',
            'Input 2': custom['Input 2'] || '',
            'Input 3': custom['Input 3'] || '',
            'Input 4': custom['Input 4'] || '',
            'Commodity Code': m.commodity_code || '',
            'Spec Code': m.spec_code || '',
            'Short Desc': m.short_desc,
            'Short Code': (m as any).short_code || '', // Assuming it might exist in DB even if not in type
            'Sap Mat Grp': m.sap_mat_grp || '',
            'Commodity Group': m.commodity_group || '',
            'Part Group': m.part_group || ''
        }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Material Catalog')
    XLSX.writeFile(wb, `material_catalog_${projectId}.xlsx`)
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
