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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-bg-surface-1 border border-glass-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-glass-border/30 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            {requestType === 'CLIENT_MIR' ? 'Nueva Solicitud de Material (MIR)' : 'Nueva Orden de Compra'}
                        </h2>
                        <p className="text-text-dim text-sm">
                            {requestType === 'CLIENT_MIR' ? 'Solicita materiales suministrados por el cliente.' : 'Genera una orden de compra interna.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-text-dim hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Request Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-dim">Tipo de Solicitud</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRequestType(MaterialRequestTypeEnum.CLIENT_MIR)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${requestType === 'CLIENT_MIR'
                                        ? 'bg-brand-primary/20 border-brand-primary text-white shadow-lg shadow-brand-primary/10'
                                        : 'bg-white/5 border-glass-border/30 text-text-dim hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <span className="text-2xl">👷</span>
                                <span className="font-semibold">Material del Cliente (MIR)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRequestType(MaterialRequestTypeEnum.CONTRACTOR_PO)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${requestType === 'CONTRACTOR_PO'
                                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                                        : 'bg-white/5 border-glass-border/30 text-text-dim hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <span className="text-2xl">🏭</span>
                                <span className="font-semibold">Compra Contractor (PO)</span>
                            </button>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-text-dim">Ítems de Material</label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all flex items-center gap-1.5"
                            >
                                + Agregar Ítem
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-[1fr,100px,auto] gap-3 items-start animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            placeholder="Especificación (ej: ELBOW 90 4IN SCH40)"
                                            value={item.material_spec}
                                            onChange={(e) => updateItem(index, 'material_spec', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-black/30 border border-glass-border/50 rounded-lg text-white focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 outline-none transition-all placeholder:text-text-dim/50 text-sm font-mono"
                                            required
                                            autoFocus={items.length > 1 && index === items.length - 1} // Focus new item
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            type="number"
                                            placeholder="Cant."
                                            value={item.quantity_requested}
                                            onChange={(e) => updateItem(index, 'quantity_requested', parseFloat(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-black/30 border border-glass-border/50 rounded-lg text-white focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 outline-none transition-all placeholder:text-text-dim/50 text-sm text-center font-mono"
                                            min="0.01"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all h-[42px] width-[42px] flex items-center justify-center"
                                        title="Eliminar ítem"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}

                            {items.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-glass-border/30 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center gap-2">
                                    <span className="text-2xl opacity-50">📋</span>
                                    <p className="text-text-dim text-sm">No hay ítems agregados.<br />Haz clic en "Agregar Ítem" para comenzar.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-dim">Notas (Opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observaciones, instrucciones especiales o referencias adicionales..."
                            className="w-full px-4 py-3 bg-black/30 border border-glass-border/50 rounded-lg text-white focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 outline-none transition-all placeholder:text-text-dim/50 min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-glass-border/30 bg-black/20 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-glass-border/50 text-text-dim font-semibold hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || items.length === 0}
                        className="flex-1 py-3 px-4 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creando...
                            </>
                        ) : (
                            'Crear Solicitud'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
