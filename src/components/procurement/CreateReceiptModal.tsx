import { useState, useEffect } from 'react'
import { X, Save, PackageCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { MaterialRequest, MaterialRequestItem } from '@/types'

interface CreateReceiptModalProps {
    request: MaterialRequest
    onClose: () => void
    onSuccess: () => void
}

interface ReceiptItemInput extends MaterialRequestItem {
    quantity_to_receive: number
    batch_id: string
    spool_code?: string // For display
    item_code?: string // For display
    description?: string // For display
    max_receive: number
}

export default function CreateReceiptModal({ request, onClose, onSuccess }: CreateReceiptModalProps) {
    const supabase = createClient()
    const [items, setItems] = useState<ReceiptItemInput[]>([])
    const [deliveryNote, setDeliveryNote] = useState('')
    const [notes, setNotes] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadItems()
    }, [request.id])

    async function loadItems() {
        // 1. Fetch Request Items with pending quantities details
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

        // 2. Fetch descriptions for better UX
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

        // 3. Prepare items for receiving
        const preparableItems = requestItems.map((item: any) => {
            const requested = item.quantity_approved ?? item.quantity_requested
            const received = item.quantity_received || 0
            const pending = Math.max(0, requested - received)

            return {
                ...item,
                quantity_to_receive: pending, // Default to receiving everything pending
                max_receive: pending,
                batch_id: '',
                spool_code: item.spool?.spool_number,
                item_code: item.material_spec.split(';')[0],
                description: descriptionMap.get(item.material_spec)
            }
        }).filter(i => i.max_receive > 0) // Only show items that need receiving

        setItems(preparableItems)
        setIsLoading(false)
    }

    function handleItemChange(id: string, field: keyof ReceiptItemInput, value: any) {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item

            if (field === 'quantity_to_receive') {
                // Validate max quantity
                const numVal = Number(value)
                if (numVal < 0) return item
                // Allowing over-receiving? Usually no, but let's warn visually instead of hard block?
                // For now, strict cap.
                if (numVal > item.max_receive) return { ...item, [field]: item.max_receive }
                return { ...item, [field]: numVal }
            }

            return { ...item, [field]: value }
        }))
    }

    async function handleSubmit() {
        if (!deliveryNote.trim()) {
            alert('Debes ingresar el número de Guía de Despacho / Documento')
            return
        }

        const itemsToReceive = items.filter(i => i.quantity_to_receive > 0)
        if (itemsToReceive.length === 0) {
            alert('Debes recibir al menos un ítem')
            return
        }

        setIsSubmitting(true)
        try {
            // 1. Create Receipt Header
            const { data: receipt, error: receiptError } = await supabase
                .from('material_receipts')
                .insert({
                    request_id: request.id,
                    project_id: request.project_id,
                    delivery_note: deliveryNote,
                    notes: notes,
                    // received_by: handled by default or trigger if needed, but schema has column.
                    // Ideally we pass current user ID if RLS allows or let Backend handle it.
                    // For now relies on RLS user.
                })
                .select()
                .single()

            if (receiptError) throw receiptError

            // 2. Create Receipt Items
            const receiptItems = itemsToReceive.map(item => ({
                receipt_id: receipt.id,
                request_item_id: item.id,
                quantity: item.quantity_to_receive,
                batch_id: item.batch_id || null
            }))

            const { error: itemsError } = await supabase
                .from('material_receipt_items')
                .insert(receiptItems)

            if (itemsError) throw itemsError

            // Success!
            onSuccess()
            onClose()

        } catch (err: any) {
            console.error('Error creating receipt:', err)
            alert('Error al crear la recepción: ' + err.message)
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
                            <PackageCheck className="icon-success" />
                            Recepción de Materiales
                        </h2>
                        <span className="modal-subheading">
                            Solicitud: {request.request_number}
                        </span>
                    </div>
                    <button onClick={onClose} className="close-button"><X size={20} /></button>
                </div>

                <div className="modal-body p-6">
                    {/* Header Inputs */}
                    {/* Header Inputs */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="label-block">
                                N° Guía / Documento *
                            </label>
                            <input
                                type="text"
                                className="input-field w-full"
                                value={deliveryNote}
                                onChange={e => setDeliveryNote(e.target.value)}
                                placeholder="Ej: GD-123456"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="label-block">
                                Notas Adicionales
                            </label>
                            <input
                                type="text"
                                className="input-field w-full"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="table-container">
                        {isLoading ? (
                            <div className="p-8 text-center opacity-50">Cargando ítems pendientes...</div>
                        ) : items.length === 0 ? (
                            <div className="empty-items-state">
                                No hay ítems pendientes de recepción en esta solicitud.
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '35%' }}>Ítem</th>
                                        <th>Spool</th>
                                        <th className="text-right">Pendiente</th>
                                        <th className="text-right" style={{ width: '15%' }}>A Recibir</th>
                                        <th style={{ width: '20%' }}>Colada / Lote</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className={item.quantity_to_receive > 0 ? 'row-active' : 'row-dimmed'}>
                                            <td>
                                                <div className="item-code">
                                                    {item.item_code}
                                                </div>
                                                <div className="item-desc">
                                                    {item.description}
                                                </div>
                                            </td>
                                            <td className="text-accent text-sm">
                                                {item.spool_code || '-'}
                                            </td>
                                            <td className="text-right font-mono text-gray">
                                                {item.max_receive}
                                            </td>
                                            <td className="text-right">
                                                <input
                                                    type="number"
                                                    className="input-field-sm text-right font-mono w-24"
                                                    value={item.quantity_to_receive}
                                                    onChange={e => handleItemChange(item.id, 'quantity_to_receive', e.target.value)}
                                                    min={0}
                                                    max={item.max_receive}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="input-field-sm w-full font-mono text-xs"
                                                    value={item.batch_id}
                                                    onChange={e => handleItemChange(item.id, 'batch_id', e.target.value)}
                                                    placeholder="Lote/Colada"
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
                    <button onClick={onClose} className="btn-secondary">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                        className="btn-primary"
                    >
                        {isSubmitting ? 'Guardando...' : <><Save size={18} /> Confirmar Recepción</>}
                    </button>
                </div>
            </div>

            {/* Styles are embedded effectively replacing the previous block */}
            <style jsx>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 1100;
                    animation: fadeIn 0.2s ease-out;
                }
                .modal-content {
                    background: rgba(20, 20, 25, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px; overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; flex-direction: column;
                    max-height: 90vh;
                }
                .modal-header {
                    padding: 1.25rem 1.5rem; 
                    background: linear-gradient(to right, rgba(255, 255, 255, 0.03), transparent);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex; justify-content: space-between; align-items: center;
                }
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                }
                
                .form-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .input-field {
                    background: rgba(0, 0, 0, 0.3); 
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white; 
                    padding: 0.75rem 1rem; 
                    border-radius: 8px;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .input-field:focus { 
                    outline: none; 
                    border-color: #60a5fa; 
                    background: rgba(0, 0, 0, 0.5);
                    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
                }

                .input-field-sm {
                    background: rgba(0, 0, 0, 0.3); 
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white; 
                    padding: 0.5rem; 
                    border-radius: 6px;
                    transition: border-color 0.2s;
                    width: 100%;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.85rem;
                }
                .input-field-sm:focus { 
                    outline: none; 
                    border-color: #60a5fa; 
                    background: rgba(0, 0, 0, 0.5);
                }

                .table-container {
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    overflow: hidden;
                    background: rgba(255, 255, 255, 0.01);
                }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th {
                    text-align: left; padding: 1rem;
                    background: rgba(255, 255, 255, 0.03); 
                    color: #94a3b8;
                    font-size: 0.7rem; 
                    text-transform: uppercase; 
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .data-table td {
                    padding: 0.75rem 1rem; 
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                    vertical-align: middle;
                }
                .close-button {
                    background: transparent; border: none; color: #9ca3af;
                    padding: 0.5rem; cursor: pointer; border-radius: 8px;
                    transition: all 0.2s;
                }
                .close-button:hover { background: rgba(255, 255, 255, 0.1); color: white; }

                /* New Classes needed for Vanilla CSS replacement */
                .modal-heading {
                    display: flex; align-items: center; gap: 0.75rem;
                    font-size: 1.25rem; font-weight: 700; color: white; margin: 0;
                }
                .icon-success { color: #4ade80; }
                .modal-subheading { font-size: 0.875rem; opacity: 0.7; display: block; margin-top: 0.25rem; }
                
                .form-grid {
                    display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2rem;
                }
                @media (min-width: 768px) {
                    .form-grid { grid-template-columns: 1fr 1fr; }
                }

                .label-block {
                    display: block; font-size: 0.75rem; text-transform: uppercase;
                    font-weight: 700; color: #9ca3af; margin-bottom: 0.5rem; letter-spacing: 0.05em;
                }
                
                .w-full { width: 100%; }
                .w-24 { width: 6rem; }
                .text-right { text-align: right; }
                
                .row-active { background: rgba(255, 255, 255, 0.05); }
                .row-dimmed { opacity: 0.6; }
                
                .item-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.875rem; color: white; }
                .item-desc { font-size: 0.75rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px; }
                .text-gray { color: #9ca3af; }
                .text-accent { color: #818cf8; }

                .modal-footer {
                    padding: 1.25rem 1.5rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .btn-secondary {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #e2e8f0;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); /* Green for success action */
                    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
                    border: none;
                    color: white;
                    font-weight: 600;
                    padding: 0.5rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 0.5rem;
                    transition: all 0.2s;
                }
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
                    filter: brightness(1.1);
                }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); scale: 0.98; } to { opacity: 1; transform: translateY(0); scale: 1; } }
            `}</style>
        </div>
    )
}
