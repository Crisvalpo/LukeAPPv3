import { useState, useEffect } from 'react'
import { X, Save, PackageCheck, Send, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MaterialRequest, MaterialRequestItem } from '@/types'

interface CreateIssueModalProps {
    request: MaterialRequest
    onClose: () => void
    onSuccess: () => void
}

interface IssueItemInput extends MaterialRequestItem {
    quantity_to_issue: number
    spool_code?: string
    item_code?: string
    description?: string
    max_issue: number
    stock_available: number // From inventory
}

export default function CreateIssueModal({ request, onClose, onSuccess }: CreateIssueModalProps) {
    const supabase = createClient()
    const [items, setItems] = useState<IssueItemInput[]>([])
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadItems()
    }, [request.id])

    async function loadItems() {
        setIsLoading(true)
        // 1. Fetch Request Items
        const { data: requestItems, error } = await supabase
            .from('material_request_items')
            .select(`
                *,
                spool:spools(spool_number)
            `)
            .eq('request_id', request.id)

        if (error) {
            console.error('Error fetching items:', error)
            return
        }

        // 2. Fetch Inventory Stats for these items
        // This is complex if we don't have direct link. 
        // We'll rely on material_spec matching master_catalog.ident_code -> inventory_receptions.master_id
        // For now, let's just fetch items and default stock to 0 or check if we can get it via RPC?
        // Let's try to fetch descriptionMap first.

        const itemCodes = Array.from(new Set(requestItems.map(i => i.material_spec)))
        let descriptionMap = new Map<string, string>()

        if (itemCodes.length > 0) {
            const { data: catalogData } = await supabase
                .from('material_catalog')
                .select('ident_code, short_desc')
                .in('ident_code', itemCodes)

            if (catalogData) {
                catalogData.forEach(cat => descriptionMap.set(cat.ident_code, cat.short_desc))
            }
        }

        // 3. Prepare items
        const preparableItems = requestItems.map((item: any) => {
            const requested = item.quantity_approved ?? item.quantity_requested
            const received = item.quantity_received || 0 // Here 'received' means 'Issued to Field'
            const pending = Math.max(0, requested - received)

            return {
                ...item,
                quantity_to_issue: pending,
                max_issue: pending,
                stock_available: 9999, // Hack: We assume stock is available for UI demo, or we need to fetch it.
                // Ideally fetching from fn_get_material_shortages or similar.
                spool_code: item.spool?.spool_number,
                item_code: item.material_spec.split(';')[0],
                description: descriptionMap.get(item.material_spec)
            }
        }).filter(i => i.max_issue > 0)

        setItems(preparableItems)
        setIsLoading(false)
    }

    function handleItemChange(id: string, field: keyof IssueItemInput, value: any) {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            if (field === 'quantity_to_issue') {
                const numVal = Number(value)
                if (numVal < 0) return item
                if (numVal > item.max_issue) return { ...item, [field]: item.max_issue }
                return { ...item, [field]: numVal }
            }
            return { ...item, [field]: value }
        }))
    }

    async function handleSubmit() {
        const itemsToIssue = items.filter(i => i.quantity_to_issue > 0)
        if (itemsToIssue.length === 0) {
            alert('Debes despachar al menos un ítem')
            return
        }

        if (!confirm(`¿Confirmas el despacho de ${itemsToIssue.length} ítems? Esto descontará del inventario.`)) return

        setIsSubmitting(true)
        try {
            // Loop and call RPC for each item (Sequence matters for FIFO?)
            // We can do Promise.all but serial is safer for inventory locks?
            // Actually Postgres handles concurrency but let's do serial loop for error handling.

            for (const item of itemsToIssue) {
                const { error } = await supabase.rpc('fn_issue_material', {
                    p_request_item_id: item.id,
                    p_quantity: item.quantity_to_issue,
                    p_user_id: (await supabase.auth.getUser()).data.user?.id
                })
                if (error) throw error
            }

            // Success
            onSuccess()
            onClose()

        } catch (err: any) {
            console.error('Error issuing material:', err)
            alert('Error al despachar: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '1000px', width: '95%' }}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-heading">
                            <Send className="icon-blue" />
                            Despacho de Materiales
                        </h2>
                        <span className="modal-subheading">
                            Solicitud: {request.request_number}
                        </span>
                    </div>
                    <button onClick={onClose} className="close-button"><X size={20} /></button>
                </div>

                <div className="modal-body p-6">
                    <div className="form-group mb-6">
                        <label className="label-block">Notas de Despacho / Entrega</label>
                        <input
                            type="text"
                            className="input-field w-full"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ej: Entregado a Juan Pérez en Bodega Central..."
                            autoFocus
                        />
                    </div>

                    <div className="table-container">
                        {isLoading ? (
                            <div className="p-8 text-center opacity-50">Cargando ítems pendientes...</div>
                        ) : items.length === 0 ? (
                            <div className="empty-items-state">No hay ítems pendientes de despacho.</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Ítem</th>
                                        <th>Spool</th>
                                        <th className="text-right">Pendiente</th>
                                        <th className="text-right" style={{ width: '15%' }}>A Despachar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className={item.quantity_to_issue > 0 ? 'row-active' : 'row-dimmed'}>
                                            <td>
                                                <div className="item-code">{item.item_code}</div>
                                                <div className="item-desc">{item.description}</div>
                                            </td>
                                            <td className="text-accent text-sm">{item.spool_code || '-'}</td>
                                            <td className="text-right font-mono text-gray">
                                                {item.max_issue}
                                            </td>
                                            <td className="text-right">
                                                <input
                                                    type="number"
                                                    className="input-field-sm text-right font-mono w-24"
                                                    value={item.quantity_to_issue}
                                                    onChange={e => handleItemChange(item.id, 'quantity_to_issue', e.target.value)}
                                                    min={0}
                                                    max={item.max_issue}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                        className="btn-primary"
                    >
                        {isSubmitting ? 'Procesando...' : <><Send size={18} /> Confirmar Despacho</>}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1200; }
                .modal-content { background: #131416; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
                .modal-header { padding: 1.5rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .modal-body { flex: 1; overflow-y: auto; padding: 1.5rem; background: #0f1012; }
                .modal-heading { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 700; color: white; margin: 0; }
                .modal-subheading { font-size: 0.875rem; opacity: 0.7; display: block; margin-top: 0.25rem; }
                .icon-blue { color: #60a5fa; }
                
                .form-group label { display: block; font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .input-field { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; }
                .input-field:focus { outline: none; border-color: #60a5fa; background: rgba(0,0,0,0.5); }
                .input-field-sm { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem; border-radius: 6px; width: 100%; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }
                
                .table-container { border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; background: rgba(255,255,255,0.01); }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th { text-align: left; padding: 1rem; background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; }
                .data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
                
                .item-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.875rem; color: white; }
                .item-desc { font-size: 0.75rem; color: #9ca3af; }
                .text-gray { color: #9ca3af; }
                .text-accent { color: #818cf8; }
                .row-active { background: rgba(255,255,255,0.05); }
                .row-dimmed { opacity: 0.6; }
                
                .modal-footer { padding: 1.25rem 1.5rem; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 1rem; }
                .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
                .btn-secondary:hover { background: rgba(255,255,255,0.05); }
                .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: white; font-weight: 600; padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
                .btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    )
}
