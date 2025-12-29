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
    commodity_code?: string
    spec_code?: string
    unit_weight?: number
    part_group?: string
    sap_mat_grp?: string
    commodity_group?: string
}

/**
 * Get all materials for a project
 */
export async function getMaterialCatalog(projectId: string): Promise<MaterialCatalogItem[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('material_catalog')
        .select('*')
        .eq('project_id', projectId)
        .order('ident_code')

    if (error) throw new Error(`Error fetching catalog: ${error.message}`)
    return data || []
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
 * Parse material catalog from Excel array
 */
export function parseMaterialCatalogFromArray(rows: any[]): CreateMaterialParams[] {
    const materials: CreateMaterialParams[] = []

    rows.forEach((row, index) => {
        // Skip header row
        if (index === 0) return

        // Map Excel columns to our fields
        const ident = row['Ident'] || row['Ident code']
        const shortDesc = row['Short Desc']

        // Require ident and description
        if (!ident || !shortDesc) {
            console.warn(`Row ${index + 1}: Missing ident or description, skipping`)
            return
        }

        materials.push({
            ident_code: String(ident).trim(),
            short_desc: String(shortDesc).trim(),
            long_desc: row['Long Desc'] || undefined,
            commodity_code: row['Commodity Code'] || undefined,
            spec_code: row['Spec Code'] || undefined,
            unit_weight: row['Unit Weight'] ? parseFloat(row['Unit Weight']) : undefined,
            part_group: row['Part Group'] || undefined,
            sap_mat_grp: row['Sap Mat Grp'] || undefined,
            commodity_group: row['Commodity Group'] || undefined
        })
    })

    return materials
}

/**
 * Bulk upload materials from Excel
 */
export async function bulkUploadMaterials(
    projectId: string,
    companyId: string,
    items: CreateMaterialParams[]
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    const supabase = createClient()

    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    for (const item of items) {
        try {
            // Check if exists
            const existing = await getMaterialByIdent(projectId, item.ident_code)

            if (existing) {
                skipped++
                continue
            }

            await createMaterial(projectId, companyId, item)
            inserted++
        } catch (error: any) {
            errors.push(`${item.ident_code}: ${error.message}`)
        }
    }

    return { inserted, skipped, errors }
}

/**
 * Export catalog to Excel
 */
export async function exportCatalogToExcel(projectId: string): Promise<void> {
    const materials = await getMaterialCatalog(projectId)

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
    const sourceMaterials = await getMaterialCatalog(sourceProjectId)
    const supabase = createClient()

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
