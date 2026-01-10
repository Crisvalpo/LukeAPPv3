'use client'

import { useState, useEffect, useCallback } from 'react'
import { StructureModel } from '@/types'
import { getStructureModelsAction, createStructureModelAction, deleteStructureModelAction, getRevisionModelsAction } from '@/actions/structure-models'
import StructureModelCard from './StructureModelCard'
import StructurePreviewModal from './StructurePreviewModal'
import { Upload, X, Loader2, Plus, FileCode } from 'lucide-react'

export default function StructureModelsManager({
    projectId
}: {
    projectId: string
}) {
    const [models, setModels] = useState<StructureModel[]>([])
    const [revisionModels, setRevisionModels] = useState<StructureModel[]>([])
    const [previewModel, setPreviewModel] = useState<StructureModel | null>(null)
    const [loading, setLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [showUploadForm, setShowUploadForm] = useState(false)

    const loadModels = useCallback(async () => {
        setLoading(true)
        // Load both Structure Models and Revision Models parallel
        const [structRes, revRes] = await Promise.all([
            getStructureModelsAction(projectId),
            getRevisionModelsAction(projectId)
        ])

        if (structRes.success && structRes.data) {
            setModels(structRes.data)
        } else {
            console.error(structRes.message)
        }

        if (revRes.success && revRes.data) {
            // map any to StructureModel
            setRevisionModels(revRes.data as StructureModel[])
        } else {
            console.error(revRes.message)
        }

        setLoading(false)
    }, [projectId])

    useEffect(() => {
        loadModels()
    }, [loadModels])

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUploading(true)

        try {
            const formData = new FormData(e.currentTarget)
            formData.append('projectId', projectId)

            // Extract spatial metadata on CLIENT-SIDE before upload
            const fileInput = e.currentTarget.querySelector('input[name="file"]') as HTMLInputElement
            const file = fileInput?.files?.[0]

            if (file) {
                try {
                    const { extractGLBMetadataFromFile } = await import('@/lib/glb-metadata-extractor')
                    const spatialMetadata = await extractGLBMetadataFromFile(file)

                    console.log('✅ Extracted spatial metadata:', spatialMetadata)

                    // Append spatial metadata as form fields
                    formData.append('position_x', spatialMetadata.position.x.toString())
                    formData.append('position_y', spatialMetadata.position.y.toString())
                    formData.append('position_z', spatialMetadata.position.z.toString())
                    formData.append('rotation_x', spatialMetadata.rotation.x.toString())
                    formData.append('rotation_y', spatialMetadata.rotation.y.toString())
                    formData.append('rotation_z', spatialMetadata.rotation.z.toString())
                    formData.append('scale_x', spatialMetadata.scale.x.toString())
                    formData.append('scale_y', spatialMetadata.scale.y.toString())
                    formData.append('scale_z', spatialMetadata.scale.z.toString())
                    formData.append('metadata', JSON.stringify({
                        boundingBox: spatialMetadata.boundingBox,
                        extractedAt: new Date().toISOString()
                    }))
                } catch (metadataError) {
                    console.warn('⚠️  Failed to extract spatial metadata:', metadataError)
                    // Continue without metadata - server will handle defaults
                }
            }

            const result = await createStructureModelAction(formData)

            if (result.success) {
                alert('Modelo estructural cargado')
                setShowUploadForm(false)
                loadModels()
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Error al cargar modelo')
        } finally {
            setIsUploading(false)
        }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* SECTION 1: STRUCTURE MODELS (CONTEXT) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#f1f5f9', marginBottom: '0.25rem' }}>Modelos Estructurales (Contexto)</h3>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                            Modelos 3D de contexto (Civil, Estructuras) cargados manualmente.
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
                            Nuevo Contexto
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
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1', margin: 0 }}>Cargar Nuevo Contexto (.glb)</h4>
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
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Nombre</label>
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
                            No hay contextos cargados.
                        </div>
                    ) : (
                        models.map(model => (
                            <StructureModelCard
                                key={model.id}
                                model={model}
                                onDelete={handleDelete}
                                onPreview={setPreviewModel}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* SECTION 2: ENGINEERING MODELS (READ ONLY) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#f1f5f9', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCode size={20} color="#3b82f6" />
                        Modelos de Ingeniería (Isométricos)
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Modelos generados automáticamente desde revisiones de ingeniería. (Solo Lectura)
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 size={24} color="#64748b" className="animate-spin" />
                        </div>
                    ) : revisionModels.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem',
                            border: '1px dashed #334155',
                            borderRadius: '0.5rem',
                            color: '#64748b',
                            fontSize: '0.875rem'
                        }}>
                            No se encontraron isométricos con modelo 3D.
                        </div>
                    ) : (
                        revisionModels.map(model => (
                            <StructureModelCard
                                key={model.id}
                                model={model}
                                onDelete={async () => Promise.resolve()} // No OP for read only
                                onPreview={setPreviewModel}
                                readOnly={true} // New prop needed
                            />
                        ))
                    )}
                </div>
            </div>

            {previewModel && (
                <StructurePreviewModal
                    url={previewModel.model_url}
                    name={previewModel.name}
                    onClose={() => setPreviewModel(null)}
                />
            )}
        </div>
    )
}
