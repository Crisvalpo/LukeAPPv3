export interface ProjectMaterialItem {
    id: string
    project_id: string
    company_id: string
    master_id: string
    dimension_id: string
    total_quantity_used: number
    last_used_at: string
    custom_fields?: Record<string, any>
    notes?: string
    master_catalog: {
        id: string
        commodity_code: string
        category: string
        component_type: string
        design_standard?: string
        default_coating?: string
        is_verified: boolean
    }
    master_dimensions: {
        nps: string
        nps_decimal: number
        schedule_rating: string
        outside_diameter_mm: number
        wall_thickness_mm: number
        center_to_end_mm?: number
        weight_kg_unit: number
    }
}

export interface ProjectMaterialStats {
    total_materials: number
    total_quantity: number
    categories: {
        name: string
        count: number
        total_quantity: number
    }[]
}

export interface SpoolCandidate {
    id: string
    project_id: string
    company_id: string
    isometric_number: string
    suggested_spool_number: string
    items: any[]
    total_weight_kg: number
    total_length_mm: number
    weld_count: number
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    created_at: string
}
