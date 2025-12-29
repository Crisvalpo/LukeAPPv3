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

/**
 * Generate and download announcement template (USER's format)
 */
export function downloadAnnouncementTemplate() {
    const headers = ['N°ISOMÉTRICO', 'N° LÍNEA', 'REV. ISO', 'TIPO LÍNEA', 'ÁREA', 'SUB-ÁREA', 'ARCHIVO', 'REV. ARCHIVO', 'TML', 'FECHA'];

    const exampleData = [
        ['3900AE-O-390-1107-2', '390-1107-2', '0', 'LB', 'AREA-390', 'SUB-01', 'DWG-001', 'A', 'TML-1', '2024-01-15'],
        ['3900AE-O-390-1107-2', '390-1107-2', '1', 'LB', 'AREA-390', 'SUB-01', 'DWG-001', 'B', 'TML-1', '2024-02-20'],
        ['3900AE-O-390-1108-3', '390-1108-3', '0', 'SB', 'AREA-390', 'SUB-02', 'DWG-002', 'A', 'TML-2', '2024-01-20']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths
    const wscols = headers.map(h => ({ wch: Math.max(h.length + 3, 15) }));
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, 'Anuncio Revisiones');
    XLSX.writeFile(wb, `Plantilla_Anuncio_Revisiones.xlsx`);
}

/**
 * Generate and download Spools template
 */
export function downloadSpoolsTemplate() {
    const headers = ['SPOOL NUMBER', 'ISO NUMBER', 'LINE NUMBER', 'WEIGHT', 'DIAMETER', 'SCH', 'SYSTEM', 'MATERIAL'];

    const exampleData = [
        ['01-01', 'ISO-001', 'L-1001', 45.5, 4, '40', 'PROCESS', 'A106-B'],
        ['01-02', 'ISO-001', 'L-1001', 32.0, 4, '40', 'PROCESS', 'A106-B']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Spools');
    XLSX.writeFile(wb, `Plantilla_Spools_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Generate and download Welds template (PIPING-REF structure)
 */
export function downloadWeldsTemplate() {
    const headers = [
        'ISO NUMBER', 'REV', 'LINE NUMBER', 'SPOOL NUMBER', 'SHEET',
        'WELD NUMBER', 'DESTINATION', 'TYPE WELD', 'NPS', 'SCH',
        'THICKNESS', 'PIPING CLASS', 'MATERIAL'
    ];

    const exampleData = [
        ['ISO-001', 'A', 'L-1001', 'SP-01', '1', 'W-001', 'FIELD', 'BW', '4', '40', '0.237', 'A106B', 'CS'],
        ['ISO-001', 'A', 'L-1001', 'SP-01', '1', 'W-002', 'FIELD', 'BW', '4', '40', '0.237', 'A106B', 'CS'],
        ['ISO-001', 'A', 'L-1001', 'SP-02', '1', 'W-003', 'SHOP', 'BW', '6', '40', '0.280', 'A106B', 'CS']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Welds');
    XLSX.writeFile(wb, `Plantilla_Welds_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Generate and download MTO template
 */
export function downloadMTOTemplate() {
    const headers = [
        'LINE NUMBER', 'AREA', 'SHEET', 'SPOOL NUMBER', 'SPOOL-ID',
        'PIPING CLASS', 'REV', 'QTY', 'QTY UNIT', 'ITEM CODE', 'FAB'
    ];

    const exampleData = [
        ['BBD-380-0403-1', '3800AE', '1', 'SP01', '3800AE-BBD-380-0403-1-SP01', 'F24', '4', 2.8, 'M', 'I63242705', 'F'],
        ['BBD-380-0403-1', '3800AE', '1', 'SP01', '3800AE-BBD-380-0403-1-SP01', 'F24', '4', 1, 'PCS', 'I63243611', 'F'],
        ['BBD-380-0403-1', '3800AE', '1', 'SP02', '3800AE-BBD-380-0403-1-SP02', 'F24', '4', 4.8, 'M', 'I63242705', 'F'],
        ['BBD-380-0403-1', '3800AE', '1', 'SP02', '3800AE-BBD-380-0403-1-SP02', 'F24', '4', 2, 'PCS', 'I63242229', 'F'],
        ['BBD-380-0403-1', '3800AE', '1', 'SPXX', '3800AE-BBD-380-0403-1-SPXX', 'F24', '4', 0.1, 'M', 'I63242745', 'G'],
        ['BBD-380-0403-1', '3800AE', '1', 'SPXX', '3800AE-BBD-380-0403-1-SPXX', 'F24', '4', 1, 'PCS', 'I64908134', 'G']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, 'MTO');
    XLSX.writeFile(wb, `Plantilla_MTO_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Generate and download Joints template
 */
export function downloadJointsTemplate() {
    const headers = [
        'ISO NUMBER', 'REV', 'LINE NUMBER', 'SHEET', 'FLANGED JOINT NUMBER',
        'PIPING CLASS', 'MATERIAL', 'RATING', 'NPS', 'BOLT SIZE'
    ];

    const exampleData = [
        ['3800AE-BBD-380-0403-1', '0', 'BBD-380-0403-1', '1', 'J-01', 'F24', 'CS', '150#', '4', '5/8" x 90mm'],
        ['3800AE-BBD-380-0403-1', '0', 'BBD-380-0403-1', '1', 'J-02', 'F24', 'CS', '150#', '4', '5/8" x 90mm'],
        ['3800AE-BBD-380-0403-1', '0', 'BBD-380-0403-1', '2', 'J-03', 'F24', 'CS', '300#', '6', '3/4" x 110mm']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Joints');
    XLSX.writeFile(wb, `Plantilla_Juntas_${new Date().toISOString().split('T')[0]}.xlsx`);
}


