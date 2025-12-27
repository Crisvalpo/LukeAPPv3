/**
 * Data Import Service
 * 
 * Handles Excel file import for isometrics, spools, and welds.
 * Uses transactions for data integrity.
 */

import { createClient } from '@/lib/supabase/client';
import {
    parseExcelFile,
    validateData,
    normalizeIsometrics,
    normalizeSpools,
    normalizeWelds
} from '@/lib/utils/excel-parser';

// =====================================================
// TYPES
// =====================================================

export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<{
        row: number;
        field?: string;
        message: string;
    }>;
    message: string;
}

export type EntityType = 'isometrics' | 'spools' | 'welds';

// =====================================================
// TABLE NAMES
// =====================================================

const TABLE_NAMES: Record<EntityType, string> = {
    isometrics: 'isometrics',
    spools: 'spools',
    welds: 'welds'
};

// =====================================================
// IMPORT FUNCTIONS
// =====================================================

/**
 * Generic import function
 */
async function importData(
    file: File,
    projectId: string,
    entityType: EntityType
): Promise<ImportResult> {
    try {
        // 1. Parse Excel
        const rawData = await parseExcelFile(file);

        if (rawData.length === 0) {
            return {
                success: false,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, message: 'El archivo está vacío' }],
                message: 'Error: Archivo vacío'
            };
        }

        // 2. Validate data
        const validation = validateData(rawData, entityType);

        if (!validation.valid) {
            return {
                success: false,
                imported: 0,
                skipped: 0,
                errors: validation.errors,
                message: `Errores de validación: ${validation.errors.length} encontrados`
            };
        }

        // 3. Normalize data
        let normalizedData: any[];

        switch (entityType) {
            case 'isometrics':
                normalizedData = normalizeIsometrics(rawData, projectId);
                break;
            case 'spools':
                normalizedData = normalizeSpools(rawData, projectId);
                break;
            case 'welds':
                normalizedData = normalizeWelds(rawData, projectId);
                break;
            default:
                throw new Error(`Tipo de entidad desconocido: ${entityType}`);
        }

        // 4. Insert into database (with duplicate detection)
        const supabase = createClient();
        const tableName = TABLE_NAMES[entityType];

        let imported = 0;
        let skipped = 0;
        const errors: Array<{ row: number; message: string }> = [];

        for (let i = 0; i < normalizedData.length; i++) {
            const row = normalizedData[i];

            const { error } = await supabase
                .from(tableName)
                .insert(row);

            if (error) {
                // Check if duplicate
                if (error.code === '23505') { // Unique violation
                    skipped++;
                    errors.push({
                        row: i + 1,
                        message: 'Registro duplicado (ya existe)'
                    });
                } else {
                    errors.push({
                        row: i + 1,
                        message: error.message
                    });
                }
            } else {
                imported++;
            }
        }

        // 5. Return result
        const totalProcessed = imported + skipped + errors.length;

        return {
            success: imported > 0,
            imported,
            skipped,
            errors,
            message: `Importados: ${imported}, Omitidos: ${skipped}, Errores: ${errors.length}`
        };

    } catch (error: any) {
        console.error('Import error:', error);
        return {
            success: false,
            imported: 0,
            skipped: 0,
            errors: [{ row: 0, message: error.message || 'Error desconocido' }],
            message: 'Error al procesar el archivo'
        };
    }
}

/**
 * Import Isometrics from Excel
 */
export async function importIsometrics(
    file: File,
    projectId: string
): Promise<ImportResult> {
    return importData(file, projectId, 'isometrics');
}

/**
 * Import Spools from Excel
 */
export async function importSpools(
    file: File,
    projectId: string
): Promise<ImportResult> {
    return importData(file, projectId, 'spools');
}

/**
 * Import Welds from Excel
 */
export async function importWelds(
    file: File,
    projectId: string
): Promise<ImportResult> {
    return importData(file, projectId, 'welds');
}

/**
 * Link spools to isometrics after import
 * (Matches by iso_number)
 */
export async function linkSpoolsToIsometrics(projectId: string): Promise<number> {
    const supabase = createClient();

    // Get all spools without isometric_id
    const { data: spools } = await supabase
        .from('spools')
        .select('id, iso_number')
        .eq('project_id', projectId)
        .is('isometric_id', null);

    if (!spools || spools.length === 0) return 0;

    let linked = 0;

    for (const spool of spools) {
        if (!spool.iso_number) continue;

        // Find matching isometric
        const { data: iso } = await supabase
            .from('isometrics')
            .select('id')
            .eq('project_id', projectId)
            .eq('iso_number', spool.iso_number)
            .single();

        if (iso) {
            // Update spool with isometric_id
            const { error } = await supabase
                .from('spools')
                .update({ isometric_id: iso.id })
                .eq('id', spool.id);

            if (!error) linked++;
        }
    }

    return linked;
}

/**
 * Link welds to spools after import
 * (Matches by spool_number)
 */
export async function linkWeldsToSpools(projectId: string): Promise<number> {
    const supabase = createClient();

    // Get all welds without spool_id
    const { data: welds } = await supabase
        .from('welds')
        .select('id, spool_number')
        .eq('project_id', projectId)
        .is('spool_id', null);

    if (!welds || welds.length === 0) return 0;

    let linked = 0;

    for (const weld of welds) {
        if (!weld.spool_number) continue;

        // Find matching spool
        const { data: spool } = await supabase
            .from('spools')
            .select('id')
            .eq('project_id', projectId)
            .eq('spool_number', weld.spool_number)
            .single();

        if (spool) {
            // Update weld with spool_id
            const { error } = await supabase
                .from('welds')
                .update({ spool_id: spool.id })
                .eq('id', weld.id);

            if (!error) linked++;
        }
    }

    return linked;
}
