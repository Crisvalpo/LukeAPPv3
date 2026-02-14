'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProjectWeldTypesAction, updateWeldTypeAction } from '@/actions/weld-types'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WeldTypeConfig } from '@/types'

interface WeldTypesManagerProps {
    projectId: string
    onBack?: () => void
}

interface WeldTypeFormData {
    type_name_es: string
    type_name_en: string
    requires_welder: boolean
    icon: string
    color: string
}

export default function WeldTypesManager({ projectId, onBack }: WeldTypesManagerProps) {
    const [weldTypes, setWeldTypes] = useState<WeldTypeConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [editingType, setEditingType] = useState<WeldTypeConfig | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadWeldTypes()
    }, [projectId])

    async function loadWeldTypes() {
        setLoading(true)
        const result = await getProjectWeldTypesAction(projectId)
        if (result.success) {
            setWeldTypes(result.data || [])
        }
        setLoading(false)
    }

    async function handleToggleRequiresWelder(type: WeldTypeConfig) {
        const newValue = !type.requires_welder

        const result = await updateWeldTypeAction(type.id, {
            projectId: type.project_id,
            companyId: type.company_id,
            typeCode: type.type_code,
            requiresWelder: newValue
        })

        if (result.success) {
            await loadWeldTypes()
        }
    }

    async function handleEdit(type: WeldTypeConfig) {
        setEditingType(type)
        setShowModal(true)
    }

    async function handleSave(formData: Partial<WeldTypeFormData>) {
        setSaving(true)

        if (editingType) {
            const result = await updateWeldTypeAction(editingType.id, {
                typeNameEs: formData.type_name_es,
                typeNameEn: formData.type_name_en,
                requiresWelder: formData.requires_welder,
                icon: formData.icon,
                color: formData.color
            })

            if (result.success) {
                setShowModal(false)
                setEditingType(null)
                await loadWeldTypes()
            }
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                <p className="text-text-dim">Cargando tipos de unión...</p>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            title="Volver a Configuración"
                            className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10 text-white"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Tipos de Unión</h2>
                        <p className="text-text-dim text-sm">Configura qué uniones requieren soldador y sus colores.</p>
                    </div>
                </div>
            </div>

            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 flex items-start gap-4">
                <div className="text-2xl">ℹ️</div>
                <div className="text-sm text-brand-primary/90">
                    <strong>Regla General:</strong> Todos los tipos requieren soldador por defecto.
                    <br />
                    <strong>Excepciones:</strong> Desmarca "Requiere Soldador" para tipos no soldados (roscados, bridados, etc.).
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weldTypes.map(type => (
                    <div key={type.type_code} className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-5 hover:border-brand-primary/30 transition-all hover:shadow-lg hover:shadow-brand-primary/5 group relative">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="text-4xl filter drop-shadow-lg">{type.icon}</div>
                            <div className="flex-1 min-w-0">
                                <div
                                    className="inline-block px-2.5 py-1 rounded-md text-sm font-bold text-white shadow-sm mb-1"
                                    style={{ backgroundColor: type.color }}
                                >
                                    {type.type_code}
                                </div>
                                <h3 className="text-white font-medium truncate" title={type.type_name_es}>{type.type_name_es}</h3>
                                {type.type_name_en && (
                                    <p className="text-text-dim text-xs truncate" title={type.type_name_en}>{type.type_name_en}</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-glass-border/30 flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${type.requires_welder ? 'bg-brand-primary' : 'bg-white/10'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${type.requires_welder ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={type.requires_welder}
                                    onChange={() => handleToggleRequiresWelder(type)}
                                />
                                <span className="text-sm font-medium text-text-dim group-hover/toggle:text-white transition-colors">
                                    {type.requires_welder ? 'Requiere Soldador' : 'No Requiere Soldador'}
                                </span>
                            </label>

                            <button
                                onClick={() => handleEdit(type)}
                                className="w-full py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                            >
                                ✏️ Editar Configuración
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && editingType && (
                <WeldTypeEditModal
                    weldType={editingType}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowModal(false)
                        setEditingType(null)
                    }}
                    saving={saving}
                />
            )}
        </div>
    )
}


interface ModalProps {
    weldType: WeldTypeConfig
    onSave: (data: Partial<WeldTypeFormData>) => void
    onCancel: () => void
    saving: boolean
}


function WeldTypeEditModal({ weldType, onSave, onCancel, saving }: ModalProps) {
    const [formData, setFormData] = useState({
        type_name_es: weldType.type_name_es,
        type_name_en: weldType.type_name_en || '',
        requires_welder: weldType.requires_welder,
        icon: weldType.icon,
        color: weldType.color
    })

    const commonIcons = ['🔥', '🔩', '🔗', '⚙️', '🔧', '❓', '⚡', '📐', '🛡️']
    const commonColors = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#10b981', '#6b7280', '#ec4899', '#06b6d4']

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

            <div className="relative w-full max-w-md bg-bg-surface-1 border border-glass-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <h2 className="text-xl font-bold text-white mb-1">Editar Tipo de Unión</h2>
                    <p className="text-text-dim text-sm pb-4 border-b border-glass-border/30 mb-6">
                        Código: <strong className="text-white px-2 py-0.5 bg-white/10 rounded">{weldType.type_code}</strong>
                    </p>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-dim">Nombre (Español)</label>
                            <input
                                type="text"
                                value={formData.type_name_es}
                                onChange={(e) => setFormData({ ...formData, type_name_es: e.target.value })}
                                autoFocus
                                className="w-full px-4 py-2 bg-black/30 border border-glass-border/50 rounded-lg text-white focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-dim">Nombre (Inglés)</label>
                            <input
                                type="text"
                                value={formData.type_name_en}
                                onChange={(e) => setFormData({ ...formData, type_name_en: e.target.value })}
                                className="w-full px-4 py-2 bg-black/30 border border-glass-border/50 rounded-lg text-white focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-dim">Icono</label>
                            <div className="flex flex-wrap gap-3">
                                {commonIcons.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border transition-all ${formData.icon === icon
                                            ? 'bg-brand-primary/20 border-brand-primary shadow-lg shadow-brand-primary/10 scale-110'
                                            : 'bg-white/5 border-glass-border/30 hover:bg-white/10 hover:border-white/20'}`}
                                        onClick={() => setFormData({ ...formData, icon })}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-dim">Color</label>
                            <div className="flex flex-wrap gap-3">
                                {commonColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-10 h-10 rounded-xl border-2 transition-all ${formData.color === color
                                            ? 'border-white scale-110 shadow-lg'
                                            : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-glass-border/30">
                            <label className="flex items-center gap-3 cursor-pointer group/toggle p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.requires_welder ? 'bg-brand-primary' : 'bg-white/10'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${formData.requires_welder ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.requires_welder}
                                    onChange={(e) => setFormData({ ...formData, requires_welder: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-white">Requiere Soldador</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-glass-border/30 bg-black/20 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-glass-border/50 text-text-dim font-semibold hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
