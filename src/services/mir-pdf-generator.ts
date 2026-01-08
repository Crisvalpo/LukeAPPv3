import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import type { MaterialRequest, MaterialRequestItem } from '@/types'

interface MIRPDFData {
    request: MaterialRequest & {
        project?: {
            name: string
            logo_primary_url?: string | null
            logo_secondary_url?: string | null
        }
        company?: {
            name: string
        }
        created_by?: {
            email: string
        }
    }
    items: (MaterialRequestItem & {
        spool_number?: string
        iso_number?: string
        iso_revision?: string
        management_tag?: string
        quantity_required?: number
        quantity_delivered_total?: number
        quantity_pending_real?: number
        input1?: string
        input2?: string
        input3?: string
        input4?: string
        catalog_item?: {
            code: string
            description?: string
        }
    })[]
}

// Constants for consistent formatting
const COLORS = {
    headerBg: [220, 220, 220] as [number, number, number],
    border: [0, 0, 0] as [number, number, number],
    text: [0, 0, 0] as [number, number, number],
}

const FONTS = {
    title: 14,
    header: 12,
    normal: 10,
    small: 8,
}

export async function generateMIRPDF(data: MIRPDFData): Promise<jsPDF> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const { request, items } = data

    // Generate QR Code
    let qrDataUrl = ''
    try {
        qrDataUrl = await QRCode.toDataURL(request.request_number || 'UNKNOWN', { margin: 1, width: 100 })
    } catch (err) {
        console.error('Error generating QR', err)
    }

    // Group items by spool for organized display
    const itemsBySpool = groupItemsBySpool(items)

    let currentPage = 1
    const totalPages = calculateTotalPages(itemsBySpool)

    // Page 1: Cover page with summary
    await addCoverPage(doc, request, itemsBySpool, currentPage, totalPages, qrDataUrl)

    // Page 2+: Detail pages (items grouped by spool)
    // Always start details on a new page (page 2)
    for (const [spoolNumber, spoolItems] of Object.entries(itemsBySpool)) {
        doc.addPage()
        currentPage++
        addDetailPage(doc, request, spoolNumber, spoolItems, currentPage, totalPages)
    }

    return doc
}

function groupItemsBySpool(items: MIRPDFData['items']): Record<string, MIRPDFData['items']> {
    const grouped: Record<string, MIRPDFData['items']> = {}

    items.forEach(item => {
        const spool = item.spool_number || 'Sin Spool'
        if (!grouped[spool]) {
            grouped[spool] = []
        }
        grouped[spool].push(item)
    })

    return grouped
}

function calculateTotalPages(itemsBySpool: Record<string, MIRPDFData['items']>): number {
    // Cover page + one page per spool
    return 1 + Object.keys(itemsBySpool).length
}

async function addCoverPage(
    doc: jsPDF,
    request: MIRPDFData['request'],
    itemsBySpool: Record<string, MIRPDFData['items']>,
    currentPage: number,
    totalPages: number,
    qrDataUrl?: string
) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Logo placeholder (top left)
    await addLogoSection(doc, request.project?.logo_primary_url, request.project?.logo_secondary_url)

    // QR Code (Top Right)
    if (qrDataUrl) {
        const qrSize = 25
        const qrX = pageWidth - qrSize - 10
        const qrY = 10
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
        // Label below QR
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text(request.request_number, qrX + (qrSize / 2), qrY + qrSize + 4, { align: 'center' })
    }

    // Title "MIR (BY LukeAPP)"
    doc.setFontSize(FONTS.title)
    doc.setFont('helvetica', 'bold')
    // Title: SOLICITUD DE MATERIALES (MIR)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SOLICITUD DE MATERIALES (MIR)', pageWidth / 2, 20, { align: 'center' })

    // Subtitle: by LukeAPP (small and grey)
    doc.setFontSize(8)
    doc.setTextColor(200, 200, 200) // Light gray
    doc.text('by LukeAPP', pageWidth / 2, 25, { align: 'center' })
    doc.setTextColor(0, 0, 0) // Reset black

    // Metadata table (Plant, Client, Project, Date, Page)
    addMetadataTable(doc, request, currentPage, totalPages)

    // MIR Details section
    addMIRDetailsSection(doc, request)

    // Summary by spool
    addSpoolSummary(doc, itemsBySpool)

    // Signature blocks
    addSignatureBlocks(doc, pageHeight)

    // Footer
    addFooter(doc, pageHeight)
}

async function addLogoSection(doc: jsPDF, primaryUrl?: string | null, secondaryUrl?: string | null) {
    const logoX = 10
    const logoY = 10
    const containerWidth = 40
    const containerHeight = 24 // 24mm total height available
    const gap = 2

    // Helper to load image
    const loadImage = async (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = url
        })
    }

    try {
        const hasPrimary = !!primaryUrl
        const hasSecondary = !!secondaryUrl

        if (hasPrimary && hasSecondary) {
            // Dual logos: split vertically
            const logoHeight = (containerHeight - gap) / 2

            // Primary (Top)
            try {
                const img1 = await loadImage(primaryUrl!)
                const ratio1 = img1.width / img1.height
                let w1 = logoHeight * ratio1
                let h1 = logoHeight

                if (w1 > containerWidth) {
                    w1 = containerWidth
                    h1 = containerWidth / ratio1
                }

                // Center horizontally
                const x1 = logoX + (containerWidth - w1) / 2
                // Center vertically in top slot
                const y1 = logoY + (logoHeight - h1) / 2

                doc.addImage(img1, 'PNG', x1, y1, w1, h1)
            } catch (e) {
                console.error('Error loading primary logo', e)
            }

            // Secondary (Bottom)
            try {
                const img2 = await loadImage(secondaryUrl!)
                const ratio2 = img2.width / img2.height
                let w2 = logoHeight * ratio2
                let h2 = logoHeight

                if (w2 > containerWidth) {
                    w2 = containerWidth
                    h2 = containerWidth / ratio2
                }

                const x2 = logoX + (containerWidth - w2) / 2
                const y2 = logoY + logoHeight + gap + (logoHeight - h2) / 2

                doc.addImage(img2, 'PNG', x2, y2, w2, h2)
            } catch (e) {
                console.error('Error loading secondary logo', e)
            }

        } else if (hasPrimary) {
            // Single logo: use full space
            try {
                const img = await loadImage(primaryUrl!)
                const ratio = img.width / img.height
                let w = containerHeight * ratio
                let h = containerHeight

                if (w > containerWidth) {
                    w = containerWidth
                    h = containerWidth / ratio
                }

                const x = logoX + (containerWidth - w) / 2
                const y = logoY + (containerHeight - h) / 2

                doc.addImage(img, 'PNG', x, y, w, h)
            } catch (e) {
                console.error('Error loading primary logo', e)
                // Fallback text
                doc.setFontSize(FONTS.small)
                doc.setTextColor(...COLORS.text)
                doc.text('Logo', logoX + containerWidth / 2, logoY + containerHeight / 2, { align: 'center' })
            }
        } else {
            // No logo placeholder
            doc.setDrawColor(...COLORS.border)
            doc.setLineWidth(0.5)
            doc.rect(logoX, logoY, containerWidth, containerHeight)
            doc.setFontSize(FONTS.small)
            doc.setTextColor(...COLORS.text)
            doc.text('Logo', logoX + containerWidth / 2, logoY + containerHeight / 2, { align: 'center' })
        }
    } catch (error) {
        console.error('Fatal error in logo section', error)
    }
}

function addMetadataTable(doc: jsPDF, request: MIRPDFData['request'], page: number, totalPages: number, customStartY?: number) {
    const startY = customStartY ?? 45

    autoTable(doc, {
        startY,
        head: [['PLANTA', 'REF CLIENTE', 'PROYECTO', 'FECHA', 'PÁGINA']],
        body: [
            [
                request.company?.name || '',
                '', // RIF Cliente
                request.project?.name || '',
                formatDate(request.requested_date),
                `${page} de ${totalPages}`
            ],
        ],
        theme: 'grid',
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: COLORS.text,
            fontSize: FONTS.small,
            halign: 'center',
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: FONTS.normal,
            halign: 'center'
        },
        margin: { left: 10, right: 10 }, // Extended margin to fit 5 cols
    })
    // Removed floating text
}

function addMIRDetailsSection(doc: jsPDF, request: MIRPDFData['request']) {
    // Remove spacing to "glue" to the previous table
    const startY = (doc as any).lastAutoTable?.finalY || 70

    autoTable(doc, {
        startY,
        head: [['N° MIR', 'Rev', 'Fecha Creación', 'Fecha Solicitud', 'Fecha ETA', 'Emitido Por', 'Tipo']],
        body: [
            [
                request.request_number || '',
                '0',
                formatDate(request.created_at),
                formatDate(request.requested_date),
                formatDate(request.eta_date),
                request.created_by?.email || '',
                request.request_type || '',
            ],
        ],
        theme: 'grid',
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.text, fontSize: FONTS.small },
        bodyStyles: { fontSize: FONTS.small },
        margin: { horizontal: 10 }  // Center table with equal side margins
    })

    // Notes section
    if (request.notes) {
        const finalY = (doc as any).lastAutoTable?.finalY || startY + 20
        doc.setFontSize(FONTS.normal)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes:', 10, finalY + 10)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(FONTS.small)
        const splitNotes = doc.splitTextToSize(request.notes, 190)
        doc.text(splitNotes, 10, finalY + 17)
    }
}

function addSpoolSummary(doc: jsPDF, itemsBySpool: Record<string, MIRPDFData['items']>) {
    const startY = (doc as any).lastAutoTable?.finalY + 25 || 120

    doc.setFontSize(FONTS.header)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen por Spool', 10, startY)

    const summaryData = Object.entries(itemsBySpool).map(([spool, items]) => {
        // Get metadata from first item to build full tag
        const firstItem = items[0]
        const isoNum = firstItem?.iso_number || 'Sin Iso'
        const revision = firstItem?.iso_revision || '?'
        const fullTag = `${isoNum} REV-${revision} / ${spool}`

        return [
            fullTag,
            items.length.toString(),
            items.reduce((sum, item) => sum + (item.quantity_requested || 0), 0).toFixed(2),
        ]
    })

    autoTable(doc, {
        startY: startY + 5,
        head: [['Spool / ISO', 'Cant. Items', 'Cant. Total']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.text, fontSize: FONTS.normal },
        bodyStyles: { fontSize: FONTS.normal },
        margin: { left: 10, right: 10 },
    })
}

function addSignatureBlocks(doc: jsPDF, pageHeight: number) {
    const blockY = pageHeight - 50
    const blockWidth = 60
    const blockHeight = 30

    // Construction Subcontractor
    doc.setDrawColor(...COLORS.border)
    doc.rect(10, blockY, blockWidth, blockHeight)
    doc.setFontSize(FONTS.small)
    doc.setFont('helvetica', 'bold')
    doc.text('Subcontratista', 15, blockY + 5)

    // Field Supervisor
    doc.rect(80, blockY, blockWidth, blockHeight)
    doc.setFont('helvetica', 'bold')
    doc.text('Supervisor Terreno', 85, blockY + 5)

    // Field Material Controller
    doc.rect(150, blockY, blockWidth, blockHeight)
    doc.setFont('helvetica', 'bold')
    doc.text('Control Materiales', 155, blockY + 5)
}


function addFooter(doc: jsPDF, pageHeight: number) {
    doc.setFontSize(8)
    doc.setTextColor(200, 200, 200) // Light gray
    doc.setFont('helvetica', 'normal')
    doc.text('Documento creado automaticamente por LukeAPP', 10, pageHeight - 10)
    doc.setTextColor(0, 0, 0) // Reset black
}

function addDetailPage(
    doc: jsPDF,
    request: MIRPDFData['request'],
    spoolNumber: string,
    items: MIRPDFData['items'],
    currentPage: number,
    totalPages: number
) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Metadata table (at top of page, no title)
    addMetadataTable(doc, request, currentPage, totalPages, 10)

    // MIR details (compact version)
    // Remove spacing to "glue" to the previous table
    const startY = (doc as any).lastAutoTable?.finalY || 70

    autoTable(doc, {
        startY,
        head: [['N° MIR', 'Rev', 'F. Creación', 'F. Solicitud', 'Tipo']],
        body: [
            [
                request.request_number || '',
                '0',
                formatDate(request.created_at),
                formatDate(request.requested_date),
                request.request_type || '',
            ],
        ],
        theme: 'grid',
        headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.text, fontSize: FONTS.small },
        bodyStyles: { fontSize: FONTS.small },
        margin: { left: 10, right: 10 },
    })

    // SpoolGen ID header
    const detailStartY = (doc as any).lastAutoTable?.finalY + 10
    doc.setFontSize(FONTS.header)
    doc.setFont('helvetica', 'bold')

    // Get metadata from first item
    const firstItem = items[0]
    const isoNum = firstItem?.iso_number || 'Sin Iso'
    const revision = firstItem?.iso_revision || '?'
    // Format: List Node: [ISO] REV-[REV] / [SPOOL]
    const headerText = `List Node: ${isoNum} REV-${revision} / ${spoolNumber}`

    doc.text(headerText, 10, detailStartY)

    // Items table
    const itemsData = items.map(item => {
        // Build labeled inputs string
        let labeledInputs = ''

        // Get inputs from the item (support both new split fields and legacy string)
        const inputsList = [
            item.input1,
            item.input2,
            item.input3,
            item.input4
        ].filter(Boolean) as string[]

        if (inputsList.length > 0) {
            const inputParts: string[] = []
            let sizeCounter = 1

            for (const input of inputsList) {
                if (input.startsWith('S-')) {
                    // This is a SCHED
                    inputParts.push(`SCHED: ${input}`)
                } else {
                    // This is a SIZE
                    inputParts.push(`SIZE${sizeCounter}: ${input}`)
                    sizeCounter++
                }
            }

            labeledInputs = inputParts.join(' - ')
        } else {
            // Fallback to legacy inputs string if exists
            const inputsString = (item as any).inputs || ''
            if (inputsString) {
                const inputArray = inputsString.split(';').map((s: string) => s.trim()).filter((s: string) => s)
                const inputParts: string[] = []
                let sizeCounter = 1
                for (const input of inputArray) {
                    if (input.startsWith('S-')) {
                        inputParts.push(`SCHED: ${input}`)
                    } else {
                        inputParts.push(`SIZE${sizeCounter}: ${input}`)
                        sizeCounter++
                    }
                }
                labeledInputs = inputParts.join(' - ')
            }
        }

        // Combine labeled inputs with description
        const baseDescription = item.catalog_item?.description || 'Sin descripción'
        const fullDescription = labeledInputs
            ? `${labeledInputs} - ${baseDescription}`
            : baseDescription

        return [
            item.catalog_item?.code || '',
            fullDescription,
            (item.quantity_required || 0).toFixed(2),
            (item.quantity_delivered_total || 0).toFixed(2),
            (item.quantity_requested || 0).toFixed(2),
            '', // Recibido - VACÍO para llenado manual por bodeguero
            (item.quantity_pending_real || 0).toFixed(2),
        ]
    })

    autoTable(doc, {
        startY: detailStartY + 5,
        head: [['Código', 'Descripción', 'Req.', 'Entreg.', 'Solic.', 'Recib.', 'Pend.']],
        body: itemsData,
        theme: 'grid',
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: COLORS.text,
            fontSize: FONTS.small - 0.5,  // Slightly smaller headers
            fontStyle: 'bold'
        },
        bodyStyles: { fontSize: FONTS.small },
        margin: { horizontal: 10 },  // Center table with equal side margins
        columnStyles: {
            0: { cellWidth: 24 },   // Código
            1: { cellWidth: 86 },   // Descripción
            2: { cellWidth: 16, halign: 'right' },  // Requerido
            3: { cellWidth: 16, halign: 'right' },  // Entregado
            4: { cellWidth: 16, halign: 'right' },  // Solicitado
            5: { cellWidth: 16, halign: 'right' },  // Recibido
            6: { cellWidth: 16, halign: 'right' },  // Pendiente
        },
    })

    // Footer
    addFooter(doc, pageHeight)
}

function formatDate(dateString?: string | null): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Main export functions
export async function downloadMIRPDF(data: MIRPDFData, filename?: string) {
    const doc = await generateMIRPDF(data)
    const fileName = filename || `MIR-${data.request.request_number}_${formatDate(new Date().toISOString())}.pdf`
    doc.save(fileName)
}

export async function printMIRPDF(data: MIRPDFData) {
    const doc = await generateMIRPDF(data)
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
}
