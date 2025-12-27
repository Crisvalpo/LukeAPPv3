/**
 * Excel Parser Utility
 * 
 * Parses Excel files and normalizes data according to PIPING column formats.
 * Handles validation and transformation for import.
 */

import * as XLSX from 'xlsx';

// =====================================================
// COLUMN DEFINITIONS (FROM PIPING)
// =====================================================

export const EXCEL_COLUMNS = {
    isometrics: ['ISO NUMBER', 'LINE NUMBER', 'REV', 'SHEET', 'AREA'],
    spools: ['SPOOL NUMBER', 'ISO NUMBER', 'LINE NUMBER', 'REV', 'WEIGHT', 'DIAMETER'],
    welds: [
        'WELD NUMBER', 'SPOOL NUMBER', 'TYPE WELD', 'NPS', 'SCH',
        'THICKNESS', 'PIPING CLASS', 'MATERIAL', 'DESTINATION', 'SHEET'
    ]
};

// Required fields per entity
export const REQUIRED_FIELDS = {
    isometrics: ['ISO NUMBER', 'REV'],
    spools: ['SPOOL NUMBER'],
    welds: ['WELD NUMBER', 'TYPE WELD']
};

// =====================================================
// TYPES
// =====================================================

export interface ParsedData {
    data: any[];
    errors: Array<{ row: number; field: string; message: string }>;
}

export interface ValidationResult {
    valid: boolean;
    errors: Array<{ row: number; field: string; message: string }>;
}

// =====================================================
// EXCEL PARSING
// =====================================================

/**
 * Parse Excel file and return JSON data
 */
export async function parseExcelFile(file: File): Promise<any[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Use first sheet
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    return data;
}

/**
 * Validate Excel columns match expected format
 */
export function validateColumns(
    data: any[],
    entityType: 'isometrics' | 'spools' | 'welds'
): ValidationResult {
    const errors: Array<{ row: number; field: string; message: string }> = [];

    if (data.length === 0) {
        return { valid: false, errors: [{ row: 0, field: 'file', message: 'El archivo está vacío' }] };
    }

    const expectedColumns = EXCEL_COLUMNS[entityType];
    const requiredFields = REQUIRED_FIELDS[entityType];
    const firstRow = data[0];
    const actualColumns = Object.keys(firstRow);

    // Check if at least required columns are present
    const missingRequired = requiredFields.filter(col => !actualColumns.includes(col));

    if (missingRequired.length > 0) {
        errors.push({
            row: 0,
            field: 'columns',
            message: `Columnas requeridas faltantes: ${missingRequired.join(', ')}`
        });
        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
}

/**
 * Validate row data
 */
function validateRow(
    row: any,
    rowIndex: number,
    entityType: 'isometrics' | 'spools' | 'welds'
): Array<{ row: number; field: string; message: string }> {
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const requiredFields = REQUIRED_FIELDS[entityType];

    // Check required fields
    requiredFields.forEach(field => {
        const value = row[field];
        if (value === undefined || value === null || String(value).trim() === '') {
            errors.push({
                row: rowIndex + 1,
                field,
                message: `Campo obligatorio vacío`
            });
        }
    });

    // Type-specific validations
    if (entityType === 'welds') {
        // Validate NPS if present (should be numeric or fraction)
        const nps = row['NPS'];
        if (nps && !isValidNPS(nps)) {
            errors.push({
                row: rowIndex + 1,
                field: 'NPS',
                message: 'Formato de NPS inválido'
            });
        }

        // Validate WEIGHT if present
        const weight = row['WEIGHT'];
        if (weight && isNaN(parseFloat(weight))) {
            errors.push({
                row: rowIndex + 1,
                field: 'WEIGHT',
                message: 'WEIGHT debe ser un número'
            });
        }
    }

    if (entityType === 'spools') {
        // Validate WEIGHT if present
        const weight = row['WEIGHT'];
        if (weight && isNaN(parseFloat(weight))) {
            errors.push({
                row: rowIndex + 1,
                field: 'WEIGHT',
                message: 'WEIGHT debe ser un número'
            });
        }
    }

    return errors;
}

function isValidNPS(value: any): boolean {
    // Allow numeric (2, 4, 6) or fractions (1/2, 3/4, 1-1/2)
    const str = String(value).trim();
    if (/^[\d\.\/\-\s]+$/.test(str)) return true;
    return false;
}

/**
 * Validate entire dataset
 */
export function validateData(
    data: any[],
    entityType: 'isometrics' | 'spools' | 'welds'
): ValidationResult {
    let allErrors: Array<{ row: number; field: string; message: string }> = [];

    // First validate columns
    const columnValidation = validateColumns(data, entityType);
    if (!columnValidation.valid) {
        return columnValidation;
    }

    // Then validate each row
    data.forEach((row, index) => {
        const rowErrors = validateRow(row, index, entityType);
        allErrors = allErrors.concat(rowErrors);
    });

    return {
        valid: allErrors.length === 0,
        errors: allErrors
    };
}

// =====================================================
// NORMALIZATION (Excel → DB format)
// =====================================================

/**
 * Normalize Isometrics data
 */
export function normalizeIsometrics(rawData: any[], projectId: string): any[] {
    return rawData.map(row => ({
        project_id: projectId,
        iso_number: row['ISO NUMBER'],
        line_number: row['LINE NUMBER'] || null,
        rev_id: row['REV'] || 'A',
        sheet: row['SHEET'] || null,
        area: row['AREA'] || null
    }));
}

/**
 * Normalize Spools data
 */
export function normalizeSpools(rawData: any[], projectId: string): any[] {
    return rawData.map(row => ({
        project_id: projectId,
        spool_number: row['SPOOL NUMBER'],
        iso_number: row['ISO NUMBER'] || null,
        line_number: row['LINE NUMBER'] || null,
        revision: row['REV'] || null,
        weight: row['WEIGHT'] ? parseFloat(row['WEIGHT']) : null,
        diameter: row['DIAMETER'] || null
    }));
}

/**
 * Normalize Welds data
 */
export function normalizeWelds(rawData: any[], projectId: string): any[] {
    return rawData.map(row => ({
        project_id: projectId,
        weld_number: row['WELD NUMBER'],
        spool_number: row['SPOOL NUMBER'] || null,
        type_weld: row['TYPE WELD'],
        nps: row['NPS'] || null,
        sch: row['SCH'] || null,
        thickness: row['THICKNESS'] ? parseFloat(row['THICKNESS']) : null,
        piping_class: row['PIPING CLASS'] || null,
        material: row['MATERIAL'] || null,
        destination: row['DESTINATION'] || null,
        sheet: row['SHEET'] || null
    }));
}
