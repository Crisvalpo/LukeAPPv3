import { useState, useEffect, Fragment } from 'react'
import { X, Check, XCircle, Trash2, Send, PackageCheck, FileDown, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MaterialRequest, MaterialRequestItem } from '@/types'
import CreateReceiptModal from './CreateReceiptModal'
import { downloadMIRPDF, printMIRPDF } from '@/services/mir-pdf-generator'

interface MaterialRequestDetailsModalProps {
    request: MaterialRequest
    onClose: () => void
    onUpdate: () => void
}

// ... imports remain the same

interface RequestItemWithDetails extends MaterialRequestItem {
    description: string
    // input fields separated
    input1?: string
    input2?: string
    input3?: string
    input4?: string

    spool?: {
        spool_number: string
        revision_id?: string
    }
    isometric?: {
        iso_number: string
        revision: string
    }
    // MTO Tracking Fields
    management_tag?: string
    quantity_required?: number          // Del MTO de revisión actual (REQ.)
    quantity_delivered_total?: number   // Histórico acumulado
    quantity_pending_real?: number      // Diferencia
}

interface GroupedItems {
    spool_number: string
    iso_number: string
    revision: string
    items: RequestItemWithDetails[]
}

export default function MaterialRequestDetailsModal({ request, onClose, onUpdate }: MaterialRequestDetailsModalProps) {
    const supabase = createClient()
    const [groupedItems, setGroupedItems] = useState<GroupedItems[]>([])
    const [originalItems, setOriginalItems] = useState<RequestItemWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

    useEffect(() => {
        loadItems()
    }, [request.id])

    async function loadItems() {
        setIsLoading(true)
        // 1. Fetch Request Items
        const { data: requestItems, error: itemsError } = await supabase
            .from('material_request_items')
            .select(`
                *,
                spool:spools(spool_number, revision_id),
                isometric:isometrics(iso_number, revision)
            `)
            .eq('request_id', request.id)

        if (itemsError) {
            console.error('Error loading items:', itemsError.message)
            setIsLoading(false)
            return
        }

        const rawItems = (requestItems as any[]) || []

        // 2. Fetch Descriptions and Inputs from Catalog
        const itemCodes = Array.from(new Set(rawItems
            .map(i => i.material_spec)
            .filter(code => code && typeof code === 'string')
            .map(code => code.trim())
        ))

        let catalogMap = new Map<string, { desc: string, inputs: { i1: string, i2: string, i3: string, i4: string } }>()

        if (itemCodes.length > 0) {
            const { data: catalogData } = await supabase
                .from('material_catalog')
                .select('ident_code, short_desc, custom_fields')
                .in('ident_code', itemCodes)

            if (catalogData) {
                catalogData.forEach(cat => {
                    const fields = cat.custom_fields as Record<string, any> || {}
                    // Store inputs separately
                    catalogMap.set(cat.ident_code.trim(), {
                        desc: cat.short_desc,
                        inputs: {
                            i1: String(fields['Input 1'] || ''),
                            i2: String(fields['Input 2'] || ''),
                            i3: String(fields['Input 3'] || ''),
                            i4: String(fields['Input 4'] || '')
                        }
                    })
                })
            }
        }

        // 3. Merge Data
        const itemsWithDetails: RequestItemWithDetails[] = rawItems.map(item => {
            const lookupCode = item.material_spec?.trim() || ''
            const catInfo = catalogMap.get(lookupCode)

            return {
                ...item,
                description: catInfo?.desc || 'Sin descripción',
                input1: catInfo?.inputs.i1,
                input2: catInfo?.inputs.i2,
                input3: catInfo?.inputs.i3,
                input4: catInfo?.inputs.i4
            }
        })

        // 4. Fetch Management Tags from Spools
        const spoolIds = Array.from(new Set(rawItems.map(i => i.spool_id).filter(Boolean)))
        const spoolTagMap = new Map<string, string>()

        if (spoolIds.length > 0) {
            const { data: spoolsData } = await supabase
                .from('spools')
                .select('id, management_tag')
                .in('id', spoolIds)

            spoolsData?.forEach(s => {
                if (s.management_tag) {
                    spoolTagMap.set(s.id, s.management_tag)
                }
            })
        }

        // 5. Fetch MTO data for current revision (quantity_required)
        const mtoMap = new Map<string, number>()

        if (spoolIds.length > 0) {
            const { data: mtoData } = await supabase
                .from('spools_mto')
                .select('item_code, qty, spool_id')
                .in('spool_id', spoolIds)

            mtoData?.forEach(mto => {
                if (mto.spool_id) {
                    const key = `${mto.spool_id}_${mto.item_code.trim()}`
                    mtoMap.set(key, mto.qty)
                }
            })
        }

        // 6. Fetch Historical Deliveries (Total Received)
        const histMap = new Map<string, number>()
        if (spoolIds.length > 0) {
            const { data: histData } = await supabase
                .from('material_request_items')
                .select('spool_id, material_spec, quantity_received')
                .in('spool_id', spoolIds)

            histData?.forEach(hist => {
                if (hist.spool_id && hist.quantity_received) {
                    const key = `${hist.spool_id}_${hist.material_spec.trim()}`
                    const current = histMap.get(key) || 0
                    histMap.set(key, current + hist.quantity_received)
                }
            })
        }

        const itemsWithMTO = itemsWithDetails.map(item => {
            const tag = item.spool_id ? spoolTagMap.get(item.spool_id) : undefined
            const materialSpec = item.material_spec?.trim() || ''
            const key = item.spool_id ? `${item.spool_id}_${materialSpec}` : ''

            const quantity_required = key ? (mtoMap.get(key) || 0) : 0
            const quantity_delivered_total = key ? (histMap.get(key) || 0) : 0

            return {
                ...item,
                management_tag: tag,
                quantity_required,
                quantity_delivered_total
            }
        })

        setOriginalItems(itemsWithMTO)

        // 8. Group by Iso+Rev+Spool
        const groups: Record<string, GroupedItems> = {}

        itemsWithMTO.forEach(item => {
            const spoolNum = item.spool?.spool_number || 'Sin Spool'
            const isoNum = item.isometric?.iso_number || 'Sin Iso'
            const rev = item.isometric?.revision || ''
            const key = `${isoNum}|${rev}|${spoolNum}`

            if (!groups[key]) {
                groups[key] = {
                    spool_number: spoolNum,
                    iso_number: isoNum,
                    revision: rev,
                    items: []
                }
            }
            groups[key].items.push(item)
        })

        const sortedGroups = Object.values(groups).sort((a, b) => {
            if (a.iso_number !== b.iso_number) return a.iso_number.localeCompare(b.iso_number)
            if (a.revision !== b.revision) return a.revision.localeCompare(b.revision)
            return a.spool_number.localeCompare(b.spool_number)
        })

        setGroupedItems(sortedGroups)
        setIsLoading(false)
    }

    // ... handleStatusChange, handleDelete, getPDFData, handleDownloadPDF, handlePrintPDF remain same ...

    async function handleStatusChange(newStatus: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DRAFT') {
        if (!confirm('¿Estás seguro de cambiar el estado de esta solicitud?')) return
        setIsUpdating(true)
        const { error } = await supabase.from('material_requests').update({ status: newStatus }).eq('id', request.id)
        if (error) { alert('Error al actualizar estado'); console.error(error) }
        else { onUpdate(); onClose() }
        setIsUpdating(false)
    }

    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return
        setIsUpdating(true)
        const { error } = await supabase.from('material_requests').delete().eq('id', request.id)
        if (error) { alert('Error al eliminar solicitud'); console.error(error) }
        else { onUpdate(); onClose() }
        setIsUpdating(false)
    }

    async function getPDFData() {
        const { data: projectData } = await supabase.from('projects').select('name, logo_primary_url, logo_secondary_url').eq('id', request.project_id).single()
        const { data: companyData } = await supabase.from('companies').select('name').eq('id', request.company_id).single()
        return {
            request: {
                ...request,
                project: projectData ? { name: projectData.name, logo_primary_url: projectData.logo_primary_url, logo_secondary_url: projectData.logo_secondary_url } : { name: 'Sin Proyecto' },
                company: companyData || { name: 'Sin Compañía' },
            },
            items: originalItems.map(item => ({
                ...item,
                spool_number: item.spool?.spool_number,
                iso_number: item.isometric?.iso_number,
                iso_revision: item.isometric?.revision,
                catalog_item: { code: item.material_spec, description: item.description },
            })),
        }
    }

    async function handleDownloadPDF() {
        setIsGeneratingPDF(true)
        try { const pdfData = await getPDFData(); await downloadMIRPDF(pdfData as any) }
        catch (error) { console.error('Error PDF:', error); alert('Error al generar PDF') }
        finally { setIsGeneratingPDF(false) }
    }

    async function handlePrintPDF() {
        setIsGeneratingPDF(true)
        try { const pdfData = await getPDFData(); await printMIRPDF(pdfData as any) }
        catch (error) { console.error('Error Printing:', error); alert('Error al imprimir PDF') }
        finally { setIsGeneratingPDF(false) }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '1100px', width: '95%' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {request.request_number}
                            <span className={`status-badge status-${request.status.toLowerCase()}`}>
                                {request.status}
                            </span>
                        </h2>
                        <span className="text-sm opacity-70">
                            {new Date(request.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button onClick={handleDownloadPDF} className="icon-button" title="Descargar PDF" disabled={isGeneratingPDF || isLoading}>
                            <FileDown size={18} />
                        </button>
                        <button onClick={handlePrintPDF} className="icon-button" title="Imprimir PDF" disabled={isGeneratingPDF || isLoading}>
                            <Printer size={18} />
                        </button>
                        <button onClick={onClose} className="close-button"><X size={20} /></button>
                    </div>
                </div>

                {/* Items Table */}
                <div className="modal-body">
                    {isLoading ? (
                        <div className="p-8 text-center opacity-50">Cargando ítems...</div>
                    ) : (
                        <div className="table-container">
                            {groupedItems.map(group => (
                                <div key={`group-${group.iso_number}-${group.spool_number}`} className="spool-group">
                                    <div className="spool-header">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-blue-200">{group.iso_number}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-400">REV-{group.revision}</span>
                                            <span className="text-gray-600">/</span>
                                            <span className="font-bold text-white">{group.spool_number}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{group.items.length} items</span>
                                    </div>

                                    <div className="items-grid-header">
                                        <div className="col-code">ITEM CODE</div>
                                        <div className="col-desc">DESCRIPCIÓN</div>
                                        <div className="col-inputs">
                                            <div className="inputs-label">INPUTS</div>
                                            <div className="inputs-nums">
                                                <span>1</span><span>2</span><span>3</span><span>4</span>
                                            </div>
                                        </div>
                                        <div className="col-stats">REQ.</div>
                                        <div className="col-stats">TOT. ENT.</div>
                                        <div className="col-stats">SOL.</div>
                                        <div className="col-stats">REC.</div>
                                    </div>

                                    <div className="items-list">
                                        {group.items.map(item => (
                                            <div key={item.id} className="item-row">
                                                <div className="col-code font-mono text-accent text-sm">
                                                    {item.material_spec}
                                                </div>
                                                <div className="col-desc text-xs text-gray-300" title={item.description}>
                                                    {item.description}
                                                </div>
                                                <div className="col-inputs-vals font-mono text-xs">
                                                    <span>{item.input1 || '-'}</span>
                                                    <span>{item.input2 || '-'}</span>
                                                    <span>{item.input3 || '-'}</span>
                                                    <span>{item.input4 || '-'}</span>
                                                </div>
                                                <div className="col-stats font-mono text-gray-400">
                                                    {item.quantity_required ? item.quantity_required : '-'}
                                                </div>
                                                <div className="col-stats font-mono text-blue-400">
                                                    {item.quantity_delivered_total || '-'}
                                                </div>
                                                <div className="col-stats font-mono text-yellow-400 font-bold">
                                                    {item.quantity_requested}
                                                </div>
                                                <div className={`col-stats font-mono font-bold ${item.quantity_received && item.quantity_received >= item.quantity_requested ? 'text-green-400' : 'text-gray-500'}`}>
                                                    {item.quantity_received || 0}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                    <div>
                        {request.status === 'DRAFT' && (
                            <button className="action-button action-danger" onClick={handleDelete} disabled={isUpdating}>
                                <Trash2 size={16} /> Eliminar
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {request.status === 'DRAFT' && (
                            <button className="action-button action-primary" onClick={() => handleStatusChange('SUBMITTED')} disabled={isUpdating}>
                                <Send size={16} /> Enviar Solicitud
                            </button>
                        )}
                        {request.status === 'SUBMITTED' && (
                            <>
                                <button className="action-button action-danger" onClick={() => handleStatusChange('REJECTED')} disabled={isUpdating}>
                                    <XCircle size={16} /> Rechazar
                                </button>
                                <button className="action-button action-success" onClick={() => handleStatusChange('APPROVED')} disabled={isUpdating}>
                                    <Check size={16} /> Aprobar
                                </button>
                            </>
                        )}
                        {(request.status === 'APPROVED' || request.status === 'PARTIAL') && (
                            <>
                                <div className={`status-indicator ${request.status === 'APPROVED' ? 'status-text-approved' : 'status-text-warning'}`}>
                                    {request.status === 'APPROVED' ? <Check size={18} /> : <PackageCheck size={18} />}
                                    {request.status === 'APPROVED' ? 'Aprobado' : 'Parcial'}
                                </div>
                                <button className="action-button action-primary" onClick={() => setShowReceiptModal(true)} disabled={isUpdating}>
                                    <PackageCheck size={18} /> Recepcionar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showReceiptModal && (
                <CreateReceiptModal
                    request={request}
                    onClose={() => setShowReceiptModal(false)}
                    onSuccess={() => { onUpdate(); loadItems() }}
                />
            )}

            <style jsx>{`
                /* Modal Basics */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { background: #131416; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); }
                .modal-header { padding: 1.5rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: flex-start; }
                .modal-body { flex: 1; overflow-y: auto; padding: 1.5rem; background: #0f1012; }
                .modal-footer { padding: 1rem 1.5rem; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); display: flex; }

                /* Spool Group Styles */
                .spool-group { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; }
                .spool-header { padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; items-align: center; }

                /* Grid Layout */
                .items-grid-header { display: grid; grid-template-columns: 140px 1fr 200px 60px 60px 60px 60px; gap: 1rem; padding: 0.5rem 1rem; background: rgba(0,0,0,0.2); font-size: 0.7rem; color: #6b7280; font-weight: 600; letter-spacing: 0.05em; align-items: end; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .item-row { display: grid; grid-template-columns: 140px 1fr 200px 60px 60px 60px 60px; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.02); align-items: center; transition: background 0.1s; }
                .item-row:hover { background: rgba(255,255,255,0.02); }
                .item-row:last-child { border-bottom: none; }

                /* Columns */
                .col-inputs { display: flex; flex-direction: column; }
                .inputs-label { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px; margin-bottom: 2px; text-align: center; }
                .inputs-nums { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; text-align: center; }
                .col-inputs-vals { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; text-align: center; color: #9ca3af; }
                .col-stats { text-align: right; }
                .text-accent { color: #818cf8; }

                /* Buttons & Tags */
                .status-badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px; border: 1px solid transparent; margin-left: 0.5rem; }
                .status-draft { background: rgba(63,63,70,0.3); color: #d4d4d8; border-color: rgba(255,255,255,0.1); }
                .status-submitted { background: rgba(59,130,246,0.15); color: #93c5fd; border-color: rgba(59,130,246,0.3); }
                .status-approved { background: rgba(16,185,129,0.15); color: #6ee7b7; border-color: rgba(16,185,129,0.3); }
                .icon-button { padding: 0.5rem; border-radius: 6px; color: #9ca3af; background: transparent; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; display: flex; }
                .icon-button:hover { background: rgba(255,255,255,0.05); color: white; }
                .close-button { padding: 0.5rem; color: #9ca3af; background: transparent; border: none; cursor: pointer; }
                .close-button:hover { color: white; }
                .action-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.85rem; border: none; cursor: pointer; transition: background 0.2s; }
                .action-primary { background: #3b82f6; color: white; }
                .action-primary:hover { background: #2563eb; }
                .action-danger { background: rgba(239,68,68,0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
                .action-danger:hover { background: rgba(239,68,68,0.2); }
                .action-success { background: #10b981; color: white; }
                .action-success:hover { background: #059669; }
                .status-indicator { display: flex; align-items: center; gap: 0.5rem; margin-right: 1rem; font-weight: 600; }
                .status-text-approved { color: #4ade80; }
                .status-text-warning { color: #fbbf24; }
            `}</style>
        </div>
    )
}
