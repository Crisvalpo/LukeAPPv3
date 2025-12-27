/**
 * Excel Template Generator
 * 
 * Generates downloadable Excel templates with correct headers.
 */

import * as XLSX from 'xlsx';
import { EXCEL_COLUMNS } from './excel-parser';

export type TemplateType = 'isometrics' | 'spools' | 'welds';

/**
 * Generate and download Excel template
 */
export function downloadTemplate(type: TemplateType) {
    const headers = EXCEL_COLUMNS[type];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths
    const wscols = headers.map(h => ({ wch: h.length + 5 }));
    ws['!cols'] = wscols;

    // Add example row based on type
    const exampleRow = getExampleRow(type);
    XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: 1 });

    // Append to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Generate filename
    const fileName = `plantilla_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
}

/**
 * Get example row for template
 */
function getExampleRow(type: TemplateType): any[] {
    switch (type) {
        case 'isometrics':
            return ['ISO-001', 'LINE-A-01', 'A', '1', 'AREA-1'];

        case 'spools':
            return ['SP-001', 'ISO-001', 'LINE-A-01', 'A', '150.50', '4"'];

        case 'welds':
            return [
                'W-001',      // WELD NUMBER
                'SP-001',     // SPOOL NUMBER
                'BW',         // TYPE WELD
                '4',          // NPS
                '40',         // SCH
                '0.237',      // THICKNESS
                'A106B',      // PIPING CLASS
                'CS',         // MATERIAL
                'FIELD',      // DESTINATION
                '1'           // SHEET
            ];

        default:
            return [];
    }
}
