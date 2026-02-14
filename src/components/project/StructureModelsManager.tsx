'use client'

import { useState, useEffect, useCallback } from 'react'
import { StructureModel } from '@/types'
import { getStructureModelsAction, createStructureModelAction, deleteStructureModelAction, getRevisionModelsAction } from '@/actions/structure-models'
import StructureModelCard from './StructureModelCard'
import StructurePreviewModal from './StructurePreviewModal'
import { Upload, X, Loader2, Plus, FileCode, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/Typography'

export default function StructureModelsManager({
    projectId,
    onBack
}: {
    projectId: string
    onBack?: () => void
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
        <div className="flex flex-col gap-8">
            {/* Header */}
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
                    <Heading level={2} className="m-0 text-2xl font-bold text-white leading-tight">Modelos Estructurales (Contexto)</Heading>
                    <Text variant="muted" className="m-0 text-sm mt-1">
                        Modelos 3D de contexto (Civil, Estructuras) cargados manualmente.
                    </Text>
                </div>
            </div>

            {/* SECTION 1: STRUCTURE MODELS (CONTEXT) */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1"></div>
                    {!showUploadForm && (
                        <Button
                            onClick={() => setShowUploadForm(true)}
                            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white"
                        >
                            <Plus size={16} />
                            Nuevo Contexto
                        </Button>
                    )}
                </div>

                {showUploadForm && (
                    <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg animate-in fade-in slide-in-from-top-4">
                        <form onSubmit={handleUpload} className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <Heading level={4} className="text-sm font-medium text-slate-300 m-0">Cargar Nuevo Contexto (.glb)</Heading>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowUploadForm(false)}
                                    className="h-6 w-6 text-text-muted hover:text-white"
                                >
                                    <X size={16} />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted font-medium">Nombre</label>
                                    <div className="relative">
                                        <input
                                            name="name"
                                            required
                                            placeholder="Ej: Nave Principal"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-primary/50 placeholder:text-slate-600 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted font-medium">Área / Sector</label>
                                    <div className="relative">
                                        <input
                                            name="area"
                                            placeholder="Ej: Area 100"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-primary/50 placeholder:text-slate-600 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-text-muted font-medium">Archivo GLB</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        name="file"
                                        accept=".glb"
                                        required
                                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-brand-primary hover:file:bg-slate-700 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowUploadForm(false)}
                                    className="text-text-muted hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isUploading}
                                    className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white min-w-[140px]"
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
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 size={24} className="text-slate-500 animate-spin" />
                        </div>
                    ) : models.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm bg-slate-900/30">
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
            <div className="flex flex-col gap-6 pt-8 border-t border-white/10">
                <div>
                    <Heading level={3} className="text-lg font-medium text-slate-100 mb-1 flex items-center gap-2">
                        <FileCode size={20} className="text-blue-500" />
                        Modelos de Ingeniería (Isométricos)
                    </Heading>
                    <Text variant="muted" className="text-sm">
                        Modelos generados automáticamente desde revisiones de ingeniería. (Solo Lectura)
                    </Text>
                </div>

                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 size={24} className="text-slate-500 animate-spin" />
                        </div>
                    ) : revisionModels.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm bg-slate-900/30">
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
