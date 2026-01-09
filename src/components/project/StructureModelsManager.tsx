'use client'

import { useState, useEffect, useCallback } from 'react'
import { StructureModel } from '@/types'
import { getStructureModelsAction, createStructureModelAction, deleteStructureModelAction } from '@/actions/structure-models'
import StructureModelCard from './StructureModelCard'
import { Upload, X, Loader2, Plus } from 'lucide-react'

export default function StructureModelsManager({
    projectId
}: {
    projectId: string
}) {
    const [models, setModels] = useState<StructureModel[]>([])
    const [loading, setLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [showUploadForm, setShowUploadForm] = useState(false)

    const loadModels = useCallback(async () => {
        setLoading(true)
        const result = await getStructureModelsAction(projectId)
        if (result.success && result.data) {
            setModels(result.data)
        } else {
            console.error(result.message)
        }
        setLoading(false)
    }, [projectId])

    useEffect(() => {
        loadModels()
    }, [loadModels])

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUploading(true)

        const formData = new FormData(e.currentTarget)
        formData.append('projectId', projectId)

        const result = await createStructureModelAction(formData)

        if (result.success) {
            alert('Modelo estructural cargado')
            setShowUploadForm(false)
            loadModels()
        } else {
            alert(result.message)
        }
        setIsUploading(false)
    }

    const handleDelete = async (id: string, url: string) => {
        const result = await deleteStructureModelAction(id, url)
        if (result.success) {
            alert('Modelo eliminado')
            loadModels() // Refresh list
        } else {
            alert(result.message)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#f1f5f9', marginBottom: '0.25rem' }}>Modelos Estructurales (BIM)</h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Gestiona modelos 3D de contexto (Estructuras, Civil, Equipos) para visualización.
                    </p>
                </div>
                {!showUploadForm && (
                    <button
                        onClick={() => setShowUploadForm(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                    >
                        <Plus size={16} />
                        Nuevo Modelo
                    </button>
                )}
            </div>

            {showUploadForm && (
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1', margin: 0 }}>Cargar Nuevo Modelo (.glb)</h4>
                            <button
                                type="button"
                                onClick={() => setShowUploadForm(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Nombre del Modelo</label>
                                <input
                                    name="name"
                                    required
                                    placeholder="Ej: Nave Principal"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '0.25rem',
                                        padding: '0.5rem 0.75rem',
                                        fontSize: '0.875rem',
                                        color: '#e2e8f0',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Área / Sector</label>
                                <input
                                    name="area"
                                    placeholder="Ej: Area 100"
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '0.25rem',
                                        padding: '0.5rem 0.75rem',
                                        fontSize: '0.875rem',
                                        color: '#e2e8f0',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Archivo GLB</label>
                            <input
                                type="file"
                                name="file"
                                accept=".glb"
                                required
                                style={{
                                    width: '100%',
                                    fontSize: '0.875rem',
                                    color: '#94a3b8'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowUploadForm(false)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: 'transparent',
                                    color: '#94a3b8',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isUploading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    opacity: isUploading ? 0.7 : 1
                                }}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Cargar Modelo
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <Loader2 size={24} color="#64748b" className="animate-spin" />
                    </div>
                ) : models.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        border: '1px dashed #334155',
                        borderRadius: '0.5rem',
                        color: '#64748b',
                        fontSize: '0.875rem'
                    }}>
                        No hay modelos estructurales cargados.
                    </div>
                ) : (
                    models.map(model => (
                        <StructureModelCard
                            key={model.id}
                            model={model}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
