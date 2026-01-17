/**
 * Create MIR Modal
 * Modal for creating Material Issue Requests with automatic material aggregation
 */

'use client'

import { useState } from 'react'
import { createMaterialRequest } from '@/services/material-requests'
import { MaterialRequestTypeEnum } from '@/types'

interface Props {
    projectId: string
    companyId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    // Optional: pre-fill with specific spools/isometrics
    preSelectedSpools?: { id: string; spool_number: string; materials: any[] }[]
}

export default function CreateMIRModal({
    projectId,
    companyId,
    isOpen,
    onClose,
    onSuccess,
    preSelectedSpools = []
}: Props) {
    const [requestType, setRequestType] = useState<MaterialRequestTypeEnum>(MaterialRequestTypeEnum.CLIENT_MIR)
    const [notes, setNotes] = useState('')
    const [items, setItems] = useState<{
        material_spec: string
        quantity_requested: number
        spool_id?: string
    }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Auto-aggregate materials from pre-selected spools
    useState(() => {
        if (preSelectedSpools.length > 0) {
            const aggregated: Record<string, { quantity: number; spoolIds: string[] }> = {}

            preSelectedSpools.forEach(spool => {
                spool.materials?.forEach((material: any) => {
                    if (!aggregated[material.spec]) {
                        aggregated[material.spec] = { quantity: 0, spoolIds: [] }
                    }
                    aggregated[material.spec].quantity += material.quantity || 1
                    aggregated[material.spec].spoolIds.push(spool.id)
                })
            })

            const aggregatedItems = Object.entries(aggregated).map(([spec, data]) => ({
                material_spec: spec,
                quantity_requested: data.quantity,
                spool_id: data.spoolIds[0] // Associate with first spool for reference
            }))

            setItems(aggregatedItems)
        }
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            if (items.length === 0) {
                throw new Error('Debes agregar al menos un ítem')
            }

            await createMaterialRequest(
                {
                    project_id: projectId,
                    request_type: requestType,
                    notes,
                    items
                },
                companyId
            )

            onSuccess()
            onClose()
        } catch (err) {
            console.error('Error creating MIR:', err)
            setError(err instanceof Error ? err.message : 'Error al crear la solicitud')
        } finally {
            setLoading(false)
        }
    }

    function addItem() {
        setItems([...items, { material_spec: '', quantity_requested: 1 }])
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index))
    }

    function updateItem(index: number, field: 'material_spec' | 'quantity_requested', value: string | number) {
        const updated = [...items]
        updated[index] = { ...updated[index], [field]: value }
        setItems(updated)
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{requestType === 'CLIENT_MIR' ? 'Nueva Solicitud de Material (MIR)' : 'Nueva Orden de Compra'}</h2>
                    <button onClick={onClose} className="modal-close">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Request Type */}
                    <div className="form-group">
                        <label>Tipo de Solicitud</label>
                        <select
                            value={requestType}
                            onChange={(e) => setRequestType(e.target.value as MaterialRequestTypeEnum)}
                            className="form-select"
                        >
                            <option value="CLIENT_MIR">Material del Cliente (MIR)</option>
                            <option value="CONTRACTOR_PO">Compra Contractor (PO)</option>
                        </select>
                        <small>MIR = Material suministrado por el cliente | PO = Material a comprar</small>
                    </div>

                    {/* Items */}
                    <div className="form-group">
                        <div className="items-header">
                            <label>Items de Material</label>
                            <button type="button" onClick={addItem} className="btn-add">
                                + Agregar Ítem
                            </button>
                        </div>

                        <div className="items-list">
                            {items.map((item, index) => (
                                <div key={index} className="item-row">
                                    <input
                                        type="text"
                                        placeholder="Especificación (ej: ELBOW 90 4IN SCH40)"
                                        value={item.material_spec}
                                        onChange={(e) => updateItem(index, 'material_spec', e.target.value)}
                                        className="item-spec"
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Cant."
                                        value={item.quantity_requested}
                                        onChange={(e) => updateItem(index, 'quantity_requested', parseFloat(e.target.value))}
                                        className="item-quantity"
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="btn-remove"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <p className="empty-items">
                                    No hay ítems. Haz clic en "Agregar Ítem" para comenzar.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label>Notas (Opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observaciones, instrucciones especiales..."
                            className="form-textarea"
                            rows={3}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    {/* Actions */}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="btn-submit">
                            {loading ? 'Creando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 1rem;
                    }

                    .modal-content {
                        background: #1a202c;
                        border-radius: 12px;
                        max-width: 700px;
                        width: 100%;
                        max-height: 90vh;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        flex-shrink: 0;
                    }

                    .modal-header h2 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        color: #f7fafc;
                        margin: 0;
                    }

                    .modal-close {
                        background: none;
                        border: none;
                        color: #cbd5e0;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        line-height: 1;
                    }

                    .modal-close:hover {
                        color: #e53e3e;
                    }

                    .modal-body {
                        padding: 1.5rem;
                        overflow-y: auto;
                        flex: 1;
                    }

                    .form-group {
                        margin-bottom: 1.5rem;
                    }

                    .form-group label {
                        display: block;
                        font-weight: 500;
                        color: #e2e8f0;
                        margin-bottom: 0.5rem;
                    }

                    .form-group small {
                        display: block;
                        color: #a0aec0;
                        font-size: 0.85rem;
                        margin-top: 0.25rem;
                    }

                    .form-select,
                    .form-textarea {
                        width: 100%;
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        padding: 0.75rem;
                        color: #f7fafc;
                        font-size: 1rem;
                    }

                    .form-select:focus,
                    .form-textarea:focus {
                        outline: none;
                        border-color: #63b3ed;
                    }

                    .items-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    }

                    .btn-add {
                        background: #48bb78;
                        color: white;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        cursor: pointer;
                        font-weight: 500;
                    }

                    .btn-add:hover {
                        background: #38a169;
                    }

                    .items-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .item-row {
                        display: grid;
                        grid-template-columns: 1fr auto auto;
                        gap: 0.5rem;
                        align-items: center;
                    }

                    .item-spec,
                    .item-quantity {
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 6px;
                        padding: 0.75rem;
                        color: #f7fafc;
                        font-size: 0.95rem;
                    }

                    .item-quantity {
                        width: 100px;
                    }

                    .btn-remove {
                        background: none;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        opacity: 0.6;
                    }

                    .btn-remove:hover {
                        opacity: 1;
                    }

                    .empty-items {
                        text-align: center;
                        color: #718096;
                        padding: 2rem;
                        font-style: italic;
                    }

                    .error-message {
                        background: rgba(245, 101, 101, 0.1);
                        border: 1px solid #fc8181;
                        border-radius: 6px;
                        padding: 0.75rem;
                        color: #fc8181;
                        margin-bottom: 1rem;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                        padding-top: 1rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .btn-cancel,
                    .btn-submit {
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        font-weight: 500;
                        cursor: pointer;
                        border: none;
                        font-size: 1rem;
                    }

                    .btn-cancel {
                        background: rgba(255, 255, 255, 0.1);
                        color: #e2e8f0;
                    }

                    .btn-cancel:hover {
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .btn-submit {
                        background: #4299e1;
                        color: white;
                    }

                    .btn-submit:hover:not(:disabled) {
                        background: #3182ce;
                    }

                    .btn-submit:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </div>
    )
}
