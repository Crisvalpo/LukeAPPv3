// =====================================================
// Module Definitions - LukeAPP
// Description: Core application modules (apps) definition
// Author: LukeAPP Development Team
// Date: 2025-12-26
// =====================================================

export const MODULES = {
    // ==========================================
    // Executive Dashboard
    // ==========================================
    DASHBOARD: {
        id: 'dashboard',
        name: 'Dashboard Ejecutivo',
        description: 'Vista de KPIs y métricas del proyecto para gerencia',
        icon: '📊',
        category: 'management',
        routes: {
            home: '/executive/dashboard',
            kpis: '/executive/kpis',
            reports: '/executive/reports'
        },
        resources: ['projects', 'reports', 'kpis']
    },

    // ==========================================
    // Engineering Module (Oficina Técnica)
    // ==========================================
    ENGINEERING: {
        id: 'engineering',
        name: 'Ingeniería',
        description: 'Gestión de datos técnicos, isométricos y spools',
        icon: '📐',
        category: 'technical',
        routes: {
            home: '/engineering/dashboard',
            lines: '/engineering/lines',
            isometrics: '/engineering/isometrics',
            spools: '/engineering/spools',
            revisions: '/engineering/revisions'
        },
        resources: ['lines', 'isometrics', 'spools', 'revisions', 'documents']
    },

    // ==========================================
    // Field Operations Module (Terreno)
    // ==========================================
    FIELD: {
        id: 'field',
        name: 'Terreno',
        description: 'Fabricación, montaje y avance de spools',
        icon: '🏗️',
        category: 'operations',
        routes: {
            home: '/field/dashboard',
            fabrication: '/field/fabrication',
            installation: '/field/installation',
            progress: '/field/progress',
            reports: '/field/reports'
        },
        resources: ['spools', 'joints', 'progress_reports', 'fabrication_reports']
    },

    // ==========================================
    // Quality Assurance Module (Calidad)
    // ==========================================
    QUALITY: {
        id: 'quality',
        name: 'Calidad',
        description: 'Inspección, liberación y test packs',
        icon: '✅',
        category: 'operations',
        routes: {
            home: '/quality/dashboard',
            inspections: '/quality/inspections',
            testPacks: '/quality/test-packs',
            ndt: '/quality/ndt',
            approvals: '/quality/approvals'
        },
        resources: ['joints', 'inspections', 'test_packs', 'ndt_reports']
    },

    // ==========================================
    // Warehouse/Logistics Module
    // ==========================================
    WAREHOUSE: {
        id: 'warehouse',
        name: 'Logística',
        description: 'Control de materiales, inventario y despachos',
        icon: '📦',
        category: 'operations',
        routes: {
            home: '/warehouse/dashboard',
            inventory: '/warehouse/inventory',
            receiving: '/warehouse/receiving',
            dispatch: '/warehouse/dispatch',
            tracking: '/warehouse/tracking'
        },
        resources: ['materials', 'inventory', 'material_requests', 'vendor_tracking']
    }
} as const;

// ==========================================
// Module IDs (for type safety)
// ==========================================

export type ModuleId = keyof typeof MODULES;

export const MODULE_IDS: ModuleId[] = [
    'DASHBOARD',
    'ENGINEERING',
    'FIELD',
    'QUALITY',
    'WAREHOUSE'
];

// ==========================================
// Module Categories
// ==========================================

export const MODULE_CATEGORIES = {
    MANAGEMENT: 'management',
    TECHNICAL: 'technical',
    OPERATIONS: 'operations'
} as const;

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get module by ID
 */
export function getModuleById(id: string) {
    return Object.values(MODULES).find(m => m.id === id);
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: string) {
    return Object.values(MODULES).filter(m => m.category === category);
}

/**
 * Get default route for module
 */
export function getModuleHomeRoute(moduleId: string): string {
    const module = getModuleById(moduleId);
    return module?.routes.home || '/lobby';
}
