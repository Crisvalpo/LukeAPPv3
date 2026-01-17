'use client'

import { useState } from 'react'
import { createMaterialRequest } from '@/services/material-requests'
import { MaterialRequestTypeEnum } from '@/types'

interface RequestItem {
    material_spec: string
    quantity: string
    spool_id?: string
    isometric_id?: string
    max_quantity?: number // Added for validation
}

interface CreateRequestModalProps {
    projectId: string
    companyId: string
    onClose: () => void
    onSuccess: () => void
    initialItems?: RequestItem[]
}

export default function CreateRequestModal({
    projectId,
    companyId,
    onClose,
    onSuccess,
    initialItems
}: CreateRequestModalProps) {
    const [requestType, setRequestType] = useState<MaterialRequestTypeEnum>(MaterialRequestTypeEnum.CLIENT_MIR)
    const [notes, setNotes] = useState('')
    // Initialize with provided items or empty default
    const [items, setItems] = useState<RequestItem[]>(
        initialItems && initialItems.length > 0
            ? initialItems
            : [{ material_spec: '', quantity: '' }]
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    function addItem() {
        setItems([...items, { material_spec: '', quantity: '' }])
    }

    function updateItem(index: number, field: 'material_spec' | 'quantity', value: string) {
        const newItems = [...items]
        const currentItem = newItems[index]

        // Max Quantity Validation Logic
        if (field === 'quantity' && currentItem.max_quantity !== undefined) {
            const val = Number(value)
            if (val > currentItem.max_quantity) {
                // Option: Clamp or just allow typing but show error later? 
                // Let's allow typing but clamp if it exceeds implicit strictness, 
                // or just relying on the max attribute for UI and validation on submit.
            }
        }

        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    function removeItem(index: number) {
        if (items.length === 1) return
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        // Validation
        const validItems = items.filter(i => i.material_spec.trim() && Number(i.quantity) > 0)

        if (validItems.length === 0) {
            setError('Debe incluir al menos un ítem válido')
            setIsSubmitting(false)
            return
        }

        // Check max quantities
        const exceedsMax = validItems.some(i => i.max_quantity !== undefined && Number(i.quantity) > i.max_quantity)
        if (exceedsMax) {
            setError('Algunos ítems exceden la cantidad pendiente máxima.')
            setIsSubmitting(false)
            return
        }

        try {
            await createMaterialRequest({
                project_id: projectId,
                request_type: requestType,
                notes,
                items: validItems.map(i => ({
                    material_spec: i.material_spec,
                    quantity_requested: Number(i.quantity),
                    spool_id: i.spool_id, // Pass through traceability
                    isometric_id: i.isometric_id // Pass through traceability
                }))
            }, companyId)

            onSuccess()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error al crear la solicitud')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Nueva Solicitud de Material</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label>Tipo de Solicitud</label>
                            <div className="type-selector">
                                <button
                                    type="button"
                                    className={`type-btn ${requestType === MaterialRequestTypeEnum.CLIENT_MIR ? 'active' : ''}`}
                                    onClick={() => setRequestType(MaterialRequestTypeEnum.CLIENT_MIR)}
                                >
                                    🏢 MIR Cliente
                                    <small>Material suministrado por cliente</small>
                                </button>
                                <button
                                    type="button"
                                    className={`type-btn ${requestType === MaterialRequestTypeEnum.CONTRACTOR_PO ? 'active' : ''}`}
                                    onClick={() => setRequestType(MaterialRequestTypeEnum.CONTRACTOR_PO)}
                                >
                                    🏗️ Orden de Compra
                                    <small>Material comprado por nosotros</small>
                                </button>
                            </div>
                        </div>

                        <div className="items-section">
                            <label>Items Requeridos</label>
                            <div className="items-list">
                                {items.map((item, idx) => (
                                    <div key={idx} className="item-row">
                                        <div className="item-spec-group">
                                            <input
                                                type="text"
                                                placeholder="Descripción del Material (Spec)"
                                                value={item.material_spec}
                                                onChange={e => updateItem(idx, 'material_spec', e.target.value)}
                                                className="input-spec"
                                                required
                                            />
                                            {item.spool_id && (
                                                <small className="traceability-tag">
                                                    🔗 Vinculado a Spool (Auto)
                                                </small>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <input
                                                type="number"
                                                placeholder="Cant"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                className={`input-qty ${item.max_quantity !== undefined && Number(item.quantity) > item.max_quantity ? 'input-error' : ''}`}
                                                min="0.01"
                                                max={item.max_quantity}
                                                step="0.01"
                                                required
                                            />
                                            {item.max_quantity !== undefined && (
                                                <small className="text-xs text-dim">
                                                    Max: {item.max_quantity}
                                                </small>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeItem(idx)}
                                            disabled={items.length === 1}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="btn-add-item" onClick={addItem}>
                                + Agregar Item
                            </button>
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Notas / Observaciones</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Detalles de entrega, lugar, contacto..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }
                .modal-content {
                    background: #1e293b;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.75rem;
                    width: 100%;
                    max-width: 800px;
                    display: flex;
                    flex-direction: column;
                    max-height: 90vh;
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h2 { margin: 0; font-size: 1.25rem; color: white; }
                .btn-close {
                    background: none; border: none; color: white;
                    font-size: 1.5rem; cursor: pointer;
                }
                .modal-body { padding: 1.5rem; overflow-y: auto; }
                .modal-footer {
                    padding: 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                
                .type-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }
                .type-btn {
                    padding: 1rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.5rem;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }
                .type-btn.active {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: #3b82f6;
                    color: #60a5fa;
                }
                .type-btn small { font-size: 0.75rem; opacity: 0.7; }

                .item-row {
                    display: grid;
                    grid-template-columns: 1fr 100px 40px;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .item-spec-group {
                    display: flex;
                    flex-direction: column;
                }
                .traceability-tag {
                    color: #4ade80;
                    font-size: 0.7rem;
                    margin-top: 2px;
                }
                .input-spec, .input-qty, textarea {
                    padding: 0.5rem;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px;
                    color: white;
                    width: 100%;
                }
                .btn-remove {
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    border-radius: 4px;
                    cursor: pointer;
                    height: 38px;
                }
                .btn-remove:disabled { opacity: 0.3; cursor: not-allowed; }
                .btn-add-item {
                    width: 100%;
                    padding: 0.5rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px dashed rgba(255,255,255,0.2);
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 0.5rem;
                }
                
                .btn-primary {
                    background: #3b82f6; color: white;
                    border: none; padding: 0.5rem 1rem;
                    border-radius: 0.5rem; cursor: pointer;
                }
                .btn-secondary {
                    background: transparent; color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem; cursor: pointer;
                }
                .error-message {
                    background: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                label { display: block; margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.875rem; }
            `}</style>
        </div>
    )
}
