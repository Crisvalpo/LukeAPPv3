'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProjectWeldTypesAction, updateWeldTypeAction } from '@/actions/weld-types'
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
            <div className="loading-container">
                <div className="loading-spinner">Cargando tipos de unión...</div>
            </div>
        )
    }

    return (
        <div className="weld-types-container">
            {onBack && (
                <button onClick={onBack} className="back-button">
                    ← Volver
                </button>
            )}

            <div className="section-header">
                <h2>Tipos de Unión</h2>
            </div>

            <div className="info-banner">
                <span className="info-icon">ℹ️</span>
                <div>
                    <strong>Regla General:</strong> Todos los tipos requieren soldador por defecto
                    <br />
                    <strong>Excepciones:</strong> Desmarca "Requiere Soldador" para tipos no soldados (roscados, bridados, etc.)
                </div>
            </div>

            <div className="weld-types-grid">
                {weldTypes.map(type => (
                    <div key={type.type_code} className="weld-type-card glass-panel">
                        <div className="type-header">
                            <div className="type-icon">{type.icon}</div>
                            <div className="type-info">
                                <div className="type-badge" style={{ backgroundColor: type.color }}>
                                    {type.type_code}
                                </div>
                            </div>
                        </div>

                        <div className="type-actions">
                            <label className="toggle-container">
                                <input
                                    type="checkbox"
                                    checked={type.requires_welder}
                                    onChange={() => handleToggleRequiresWelder(type)}
                                />
                                <span className="toggle-label">
                                    {type.requires_welder ? '✅ Requiere Soldador' : '❌ No Requiere Soldador'}
                                </span>
                            </label>

                            <button onClick={() => handleEdit(type)} className="edit-button">
                                ✏️ Editar
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

            <style jsx>{`
                .weld-types-container {
                    padding: 0;
                }

                .back-button {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-color);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-bottom: 1.5rem;
                    transition: all 0.2s;
                }

                .back-button:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.2);
                }

                .section-header {
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    font-size: 1.5rem;
                    margin: 0 0 0.5rem 0;
                    color: var(--text-color);
                }

                .section-subtitle {
                    color: var(--text-muted);
                    margin: 0;
                }

                .info-banner {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1.5rem;
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                }

                .info-icon {
                    font-size: 1.25rem;
                }

                .info-banner strong {
                    color: var(--primary-color);
                }

                .weld-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.25rem;
                }

                .weld-type-card {
                    padding: 1.25rem;
                    border-radius: 12px;
                    transition: transform 0.2s;
                }

                .weld-type-card:hover {
                    transform: translateY(-2px);
                }

                .type-header {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                }

                .type-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                }

                .type-info {
                    flex: 1;
                }

                .type-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: white;
                    margin-bottom: 0.5rem;
                }

                .type-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: var(--text-color);
                }

                .type-name-en {
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    margin: 0.25rem 0 0 0;
                }

                .type-actions {
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding-top: 1rem;
                }

                .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                    cursor: pointer;
                    margin-bottom: 0.75rem;
                }

                .toggle-container input {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }

                .toggle-label {
                    font-size: 0.9rem;
                    color: var(--text-color);
                }

                .edit-button {
                    width: 100%;
                    padding: 0.65rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: var(--text-color);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                }

                .edit-button:hover {
                    background: rgba(255,255,255,0.1);
                }

                .loading-container {
                    padding: 4rem;
                    text-align: center;
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
    const [mounted, setMounted] = useState(false)
    const [formData, setFormData] = useState({
        type_name_es: weldType.type_name_es,
        type_name_en: weldType.type_name_en || '',
        requires_welder: weldType.requires_welder,
        icon: weldType.icon,
        color: weldType.color
    })

    const commonIcons = ['🔥', '🔩', '🔗', '⚙️', '🔧', '❓']
    const commonColors = ['#ef4444', '#f97316', '#8b5cf6', '#3b82f6', '#10b981', '#6b7280']

    useEffect(() => {
        setMounted(true)
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    if (!mounted) return null

    return createPortal(
        <div
            className="modal-overlay"
            onClick={onCancel}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                margin: 0,
                padding: 0
            }}
        >
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
                <h2>Editar Tipo de Unión</h2>
                <p className="modal-subtitle">Código: <strong>{weldType.type_code}</strong></p>

                <div className="form-group">
                    <label>Nombre (Español)</label>
                    <input
                        type="text"
                        value={formData.type_name_es}
                        onChange={(e) => setFormData({ ...formData, type_name_es: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label>Nombre (Inglés)</label>
                    <input
                        type="text"
                        value={formData.type_name_en}
                        onChange={(e) => setFormData({ ...formData, type_name_en: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Icono</label>
                    <div className="icon-grid">
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
                    <div className="color-grid">
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
                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={formData.requires_welder}
                            onChange={(e) => setFormData({ ...formData, requires_welder: e.target.checked })}
                        />
                        <span>Requiere Soldador</span>
                    </label>
                </div>

                <div className="modal-actions">
                    <button onClick={onCancel} className="cancel-btn" disabled={saving}>
                        Cancelar
                    </button>
                    <button onClick={() => onSave(formData)} className="save-btn" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                <style jsx>{`
                    /* .modal-overlay styles moved to inline to ensure positioning */

                    .modal-content {
                        width: 90%;
                        max-width: 480px;
                        padding: 2rem;
                        background: #1f2937; /* Fallback */
                        background: rgba(31, 41, 55, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                        animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    @keyframes modalPop {
                        0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }

                    .modal-content h2 {
                        margin: 0 0 0.5rem 0;
                        color: white; /* Stronger contrast */
                        font-size: 1.5rem;
                    }

                    .modal-subtitle {
                        color: #9ca3af;
                        margin: 0 0 1.5rem 0;
                        font-size: 0.95rem;
                        padding-bottom: 1rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    /* ... existing form styles ... */
                    .form-group {
                        margin-bottom: 1.25rem;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        color: #d1d5db;
                        font-weight: 500;
                        font-size: 0.9rem;
                    }

                    .form-group input[type="text"] {
                        width: 100%;
                        padding: 0.75rem;
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        color: white;
                        font-size: 0.95rem;
                        transition: border-color 0.2s;
                    }
                    
                    .form-group input[type="text"]:focus {
                        border-color: var(--primary-color);
                        outline: none;
                    }

                    .icon-grid, .color-grid {
                        display: flex;
                        gap: 0.75rem;
                        flex-wrap: wrap;
                    }

                    .icon-option {
                        width: 48px;
                        height: 48px;
                        font-size: 1.5rem;
                        background: rgba(255,255,255,0.05);
                        border: 2px solid rgba(255,255,255,0.1);
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .icon-option:hover {
                        background: rgba(255,255,255,0.1);
                        transform: translateY(-2px);
                    }

                    .icon-option.selected {
                        border-color: var(--primary-color);
                        background: rgba(59, 130, 246, 0.2);
                        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
                    }

                    .color-option {
                        width: 48px;
                        height: 48px;
                        border: 2px solid rgba(255,255,255,0.1);
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .color-option:hover {
                        transform: scale(1.1);
                    }

                    .color-option.selected {
                        border-color: white;
                        transform: scale(1.1);
                        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
                    }

                    .checkbox-row {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        cursor: pointer;
                        background: rgba(255, 255, 255, 0.05);
                        padding: 0.75rem;
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        transition: background 0.2s;
                    }
                    
                    .checkbox-row:hover {
                        background: rgba(255, 255, 255, 0.08);
                    }

                    .checkbox-row input {
                        width: 20px;
                        height: 20px;
                        margin: 0;
                    }
                    
                    .checkbox-row span {
                       color: white;
                       font-weight: 500;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 1rem;
                        margin-top: 2rem;
                    }

                    .cancel-btn, .save-btn {
                        flex: 1;
                        padding: 0.85rem;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .cancel-btn {
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.2);
                        color: #e5e7eb;
                    }

                    .cancel-btn:hover:not(:disabled) {
                        background: rgba(255,255,255,0.05);
                        border-color: white;
                        color: white;
                    }

                    .save-btn {
                        background: var(--primary-color);
                        border: none;
                        color: white;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
                    }

                    .save-btn:hover:not(:disabled) {
                        filter: brightness(1.1);
                        transform: translateY(-1px);
                    }

                    .cancel-btn:disabled, .save-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                        transform: none;
                    }
                `}</style>
            </div>
        </div>,
        document.body
    )
}
