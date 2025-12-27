
// Add these normalization functions at the end of excel-parser.ts

/**
 * Normalize Material Take-Off (MTO) data
 */
export function normalizeMTO(rawData: any[], projectId: string): any[] {
    return rawData.map(row => ({
        project_id: projectId,
        item_code: row['ITEM CODE'],
        qty: row['QTY'] ? parseFloat(row['QTY']) : 0,
        qty_unit: row['QTY UNIT'] || null,
        piping_class: row['PIPING CLASS'] || null,
        fab: row['FAB'] || null,
        sheet: row['SHEET'] || null,
        line_number: row['LINE NUMBER'] || null,
        area: row['AREA'] || null,
        spool_full_id: row['SPOOL-ID'] || null,
        spool_number: row['SPOOL NUMBER'] || null,
        revision: row['REV'] || null
    }));
}

/**
 * Normalize Flanged Joints (Bolted Joints) data
 */
export function normalizeFlangedJoints(rawData: any[], projectId: string): any[] {
    return rawData.map(row => ({
        project_id: projectId,
        flanged_joint_number: row['FLANGED JOINT NUMBER'],
        piping_class: row['PIPING CLASS'] || null,
        material: row['MATERIAL'] || null,
        rating: row['RATING'] || null,
        nps: row['NPS'] || null,
        bolt_size: row['BOLT SIZE'] || null,
        sheet: row['SHEET'] || null,
        line_number: row['LINE NUMBER'] || null,
        iso_number: row['ISO NUMBER'] || null,
        revision: row['REV'] || null
    }));
}
