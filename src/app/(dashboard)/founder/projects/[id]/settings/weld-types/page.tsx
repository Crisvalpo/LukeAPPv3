'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getProjectWeldTypesAction, updateWeldTypeAction, createWeldTypeAction, deleteWeldTypeAction } from '@/actions/weld-types'
import type { WeldTypeConfig } from '@/types'

interface WeldTypeFormData {
    type_code: string
    type_name_es: string
    type_name_en: string
    requires_welder: boolean
    icon: string
    color: string
}

export default function WeldTypesSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string

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

    async function handleToggleRequiresWelder(typeId: string, currentValue: boolean) {
        const result = await updateWeldTypeAction(typeId, {
            requiresWelder: !currentValue
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
            <div className="page-container">
                <div className="loading-spinner">Cargando tipos de unión...</div>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <button onClick={() => router.back()} className="btn-back">
                        ← Volver
                    </button>
                    <h1>Tipos de Unión</h1>
                    <p className="subtitle">
                        Configura qué tipos requieren soldador y cuáles no
                    </p>
                </div>
            </div>

            <div className="content-wrapper">
                <div className="info-banner">
                    <span>ℹ️</span>
                    <div>
                        <strong>Tipos Soldados:</strong> BW (Butt Weld), SW (Socket Weld) → Requieren soldador
                        <br />
                        <strong>Tipos No Soldados:</strong> TW (Rosca), FL (Brida), GR (Victaulic) → No requieren soldador
                    </div>
                </div>

                <div className="weld-types-grid">
                    {weldTypes.map(type => (
                        <div key={type.id} className="weld-type-card glass-panel">
                            <div className="type-header">
                                <div className="type-icon" style={{ fontSize: '2rem' }}>
                                    {type.icon}
                                </div>
                                <div className="type-info">
                                    <div className="type-code" style={{
                                        backgroundColor: type.color,
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        display: 'inline-block',
                                        marginBottom: '8px'
                                    }}>
                                        {type.type_code}
                                    </div>
                                    <h3>{type.type_name_es}</h3>
                                    {type.type_name_en && (
                                        <p className="type-name-en">{type.type_name_en}</p>
                                    )}
                                </div>
                            </div>

                            <div className="type-actions">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={type.requires_welder}
                                        onChange={() => handleToggleRequiresWelder(type.id, type.requires_welder)}
                                        className="toggle-checkbox"
                                    />
                                    <span className="toggle-text">
                                        {type.requires_welder ? '✅ Requiere Soldador' : '❌ No Requiere Soldador'}
                                    </span>
                                </label>

                                <button
                                    onClick={() => handleEdit(type)}
                                    className="btn-secondary"
                                    style={{ marginTop: '12px' }}
                                >
                                    ✏️ Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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

            <style jsx>{`
                .page-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-size: 2rem;
                    margin: 1rem 0 0.5rem 0;
                    color: var(--primary-color);
                }

                .subtitle {
                    color: var(--text-muted);
                    font-size: 0.95rem;
                }

                .btn-back {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-color);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-back:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.2);
                }

                .info-banner {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 2rem;
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                }

                .info-banner span {
                    font-size: 1.5rem;
                }

                .info-banner strong {
                    color: var(--primary-color);
                }

                .weld-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .weld-type-card {
                    padding: 1.5rem;
                    border-radius: 16px;
                    transition: transform 0.2s;
                }

                .weld-type-card:hover {
                    transform: translateY(-4px);
                }

                .type-header {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                    margin-bottom: 1.5rem;
                }

                .type-icon {
                    flex-shrink: 0;
                }

                .type-info {
                    flex: 1;
                }

                .type-info h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    color: var(--text-color);
                }

                .type-name-en {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin: 0.25rem 0 0 0;
                }

                .type-actions {
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding-top: 1rem;
                }

                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    user-select: none;
                }

                .toggle-checkbox {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                .toggle-text {
                    font-size: 0.95rem;
                    color: var(--text-color);
                }

                .btn-secondary {
                    width: 100%;
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: var(--text-color);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }

                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.3);
                }

                .loading-spinner {
                    text-align: center;
                    padding: 4rem;
                    color: var(--text-muted);
                }
            `}</style>
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

    const commonIcons = ['🔥', '🔩', '🔗', '⚙️', '🔧', '❓']
    const commonColors = ['#ef4444', '#f97316', '#8b5cf6', '#3b82f6', '#10b981', '#6b7280']

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
                <h2>Editar Tipo de Unión</h2>
                <p className="modal-subtitle">Código: <strong>{weldType.type_code}</strong></p>

                <div className="form-group">
                    <label>Nombre (Español)</label>
                    <input
                        type="text"
                        value={formData.type_name_es}
                        onChange={(e) => setFormData({ ...formData, type_name_es: e.target.value })}
                        placeholder="Soldadura a Tope"
                    />
                </div>

                <div className="form-group">
                    <label>Nombre (Inglés)</label>
                    <input
                        type="text"
                        value={formData.type_name_en}
                        onChange={(e) => setFormData({ ...formData, type_name_en: e.target.value })}
                        placeholder="Butt Weld"
                    />
                </div>

                <div className="form-group">
                    <label>Icono</label>
                    <div className="icon-picker">
                        {commonIcons.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, icon })}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Color</label>
                    <div className="color-picker">
                        {commonColors.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setFormData({ ...formData, color })}
                            />
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.requires_welder}
                            onChange={(e) => setFormData({ ...formData, requires_welder: e.target.checked })}
                        />
                        <span>Requiere Soldador</span>
                    </label>
                </div>

                <div className="modal-actions">
                    <button onClick={onCancel} className="btn-cancel" disabled={saving}>
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="btn-save"
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }

                    .modal-content {
                        width: 90%;
                        max-width: 500px;
                        padding: 2rem;
                        border-radius: 16px;
                        max-height: 90vh;
                        overflow-y: auto;
                    }

                    .modal-content h2 {
                        margin: 0 0 0.5rem 0;
                        color: var(--primary-color);
                    }

                    .modal-subtitle {
                        color: var(--text-muted);
                        margin: 0 0 1.5rem 0;
                    }

                    .form-group {
                        margin-bottom: 1.5rem;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        color: var(--text-color);
                        font-weight: 500;
                    }

                    .form-group input[type="text"] {
                        width: 100%;
                        padding: 0.75rem;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 8px;
                        color: var(--text-color);
                        font-size: 0.95rem;
                    }

                    .icon-picker, .color-picker {
                        display: flex;
                        gap: 0.5rem;
                        flex-wrap: wrap;
                    }

                    .icon-option {
                        width: 50px;
                        height: 50px;
                        font-size: 1.5rem;
                        background: rgba(255,255,255,0.05);
                        border: 2px solid rgba(255,255,255,0.2);
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .icon-option:hover {
                        background: rgba(255,255,255,0.1);
                    }

                    .icon-option.selected {
                        border-color: var(--primary-color);
                        background: rgba(59, 130, 246, 0.2);
                    }

                    .color-option {
                        width: 50px;
                        height: 50px;
                        border: 2px solid rgba(255,255,255,0.2);
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .color-option:hover {
                        transform: scale(1.1);
                    }

                    .color-option.selected {
                        border-color: white;
                        border-width: 3px;
                    }

                    .checkbox-label {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        cursor: pointer;
                    }

                    .checkbox-label input {
                        width: 20px;
                        height: 20px;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 1rem;
                        margin-top: 2rem;
                    }

                    .btn-cancel, .btn-save {
                        flex: 1;
                        padding: 0.75rem;
                        border-radius: 8px;
                        font-size: 0.95rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .btn-cancel {
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.2);
                        color: var(--text-color);
                    }

                    .btn-cancel:hover:not(:disabled) {
                        background: rgba(255,255,255,0.05);
                    }

                    .btn-save {
                        background: var(--primary-color);
                        border: none;
                        color: white;
                        font-weight: 500;
                    }

                    .btn-save:hover:not(:disabled) {
                        opacity: 0.9;
                    }

                    .btn-cancel:disabled, .btn-save:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </div>
    )
}
