import { StructureModel } from '@/types'
import { Trash2, Box, Eye } from 'lucide-react'
import { useState } from 'react'

export default function StructureModelCard({
    model,
    onDelete,
    onPreview,
    readOnly = false
}: {
    model: StructureModel
    onDelete: (id: string, url: string) => Promise<void>
    onPreview: (model: StructureModel) => void
    readOnly?: boolean
}) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this structure model?')) {
            setIsDeleting(true)
            await onDelete(model.id, model.model_url)
            setIsDeleting(false)
        }
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            transition: 'border-color 0.2s'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    padding: '0.5rem',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Box size={20} color="#818cf8" />
                </div>
                <div>
                    <h4 style={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        margin: 0,
                        marginBottom: '0.25rem'
                    }}>{model.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                        {model.area && (
                            <span style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#334155',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem'
                            }}>
                                {model.area}
                            </span>
                        )}
                        <span>{new Date(model.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => onPreview(model)}
                    title="Vista Previa"
                    style={{
                        padding: '0.5rem',
                        color: '#94a3b8',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#60a5fa'
                        e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8'
                        e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                >
                    <Eye size={16} />
                </button>

                {!readOnly && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Eliminar Modelo"
                        style={{
                            padding: '0.5rem',
                            color: '#94a3b8',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#f87171'
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94a3b8'
                            e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    )
}
