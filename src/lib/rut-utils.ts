/**
 * Utility functions for Chilean RUT validation and formatting
 */

export function cleanRut(rut: string): string {
    return typeof rut === 'string' ? rut.replace(/[^0-9kK]/g, '') : '';
}

export function validateRut(rut: string): boolean {
    if (!rut) return false;

    const value = cleanRut(rut);
    if (value.length < 2) return false;

    const body = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();

    // Validate body is number
    if (!/^\d+$/.test(body)) return false;

    // Calculate DV
    let suma = 0;
    let multiplo = 2;

    for (let i = 1; i <= body.length; i++) {
        const index = multiplo * parseInt(value.charAt(value.length - 1 - i));
        suma = suma + index;
        if (multiplo < 7) {
            multiplo = multiplo + 1;
        } else {
            multiplo = 2;
        }
    }

    const dvEsperado = 11 - (suma % 11);
    let dvCalculado = '';

    if (dvEsperado === 11) {
        dvCalculado = '0';
    } else if (dvEsperado === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvEsperado.toString();
    }

    return dvCalculado === dv;
}

export function formatRut(rut: string): string {
    const value = cleanRut(rut);
    if (value.length < 2) return rut;

    const body = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();

    // Format body with dots
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

export function parseChileanIdQR(urlOrText: string): string | null {
    try {
        // Try parsing as URL
        if (urlOrText.includes('RUN=')) {
            const url = new URL(urlOrText);
            const run = url.searchParams.get('RUN');
            return run ? formatRut(run) : null;
        }
        // If not URL, try direct RUT
        if (validateRut(urlOrText)) {
            return formatRut(urlOrText);
        }
        return null;
    } catch (e) {
        return null; // Not a valid URL
    }
}
