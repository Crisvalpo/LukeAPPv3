import { useState, useRef } from 'react'
import { Upload, X, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface ProjectLogoUploadProps {
    projectId: string
    currentLogoUrl?: string | null
    onUploadSuccess: (logoUrl: string) => void
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const RECOMMENDED_WIDTH = 200
const RECOMMENDED_HEIGHT = 120

export default function ProjectLogoUpload({
    projectId,
    currentLogoUrl,
    onUploadSuccess,
}: ProjectLogoUploadProps) {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isUploading, setIsUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentLogoUrl || null)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    function validateFile(file: File): string | null {
        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Solo se permiten archivos PNG o JPG'
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return 'El archivo no debe superar 2MB'
        }

        return null
    }

    async function validateImageDimensions(file: File): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new window.Image()
            img.onload = () => {
                resolve({ width: img.width, height: img.height })
            }
            img.onerror = reject
            img.src = URL.createObjectURL(file)
        })
    }

    async function handleFileSelect(file: File) {
        setError(null)

        // Validate file
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        // Validate dimensions
        try {
            const { width, height } = await validateImageDimensions(file)

            // Warn if dimensions are too large (not blocking)
            if (width > RECOMMENDED_WIDTH * 2 || height > RECOMMENDED_HEIGHT * 2) {
                console.warn(`Image dimensions (${width}x${height}) are larger than recommended (${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT})`)
            }
        } catch (err) {
            setError('No se pudo leer la imagen')
            return
        }

        // Show preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload to Supabase Storage
        await uploadFile(file)
    }

    async function uploadFile(file: File) {
        setIsUploading(true)
        setError(null)

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${projectId}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Delete old logo if exists
            if (currentLogoUrl) {
                const oldPath = currentLogoUrl.split('/').pop()
                if (oldPath) {
                    await supabase.storage.from('project-logos').remove([oldPath])
                }
            }

            // Upload new logo
            const { data, error: uploadError } = await supabase.storage
                .from('project-logos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-logos')
                .getPublicUrl(filePath)

            // Update project with new logo URL
            const { error: updateError } = await supabase
                .from('projects')
                .update({ logo_url: publicUrl })
                .eq('id', projectId)

            if (updateError) throw updateError

            onUploadSuccess(publicUrl)
        } catch (err: any) {
            console.error('Upload error:', err)
            setError(err.message || 'Error al subir el logo')
            setPreview(currentLogoUrl || null)
        } finally {
            setIsUploading(false)
        }
    }

    async function handleRemoveLogo() {
        if (!confirm('¿Estás seguro de eliminar el logo del proyecto?')) return

        setIsUploading(true)
        setError(null)

        try {
            // Delete from storage
            if (currentLogoUrl) {
                const path = currentLogoUrl.split('/').pop()
                if (path) {
                    await supabase.storage.from('project-logos').remove([path])
                }
            }

            // Update project
            const { error } = await supabase
                .from('projects')
                .update({ logo_url: null })
                .eq('id', projectId)

            if (error) throw error

            setPreview(null)
            onUploadSuccess('')
        } catch (err: any) {
            console.error('Remove error:', err)
            setError(err.message || 'Error al eliminar el logo')
        } finally {
            setIsUploading(false)
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(true)
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(false)
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    return (
        <div className="logo-upload-container">
            <label className="logo-upload-label">
                Logo del Proyecto
                <span className="text-xs opacity-60 ml-2">
                    (Recomendado: {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px, máx. 2MB, PNG/JPG)
                </span>
            </label>

            {/* Upload Area */}
            <div
                className={`upload-area ${isDragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {preview ? (
                    <div className="preview-container">
                        <div className="preview-image">
                            <Image
                                src={preview}
                                alt="Logo preview"
                                width={RECOMMENDED_WIDTH}
                                height={RECOMMENDED_HEIGHT}
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        {!isUploading && (
                            <button
                                className="remove-button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveLogo()
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="upload-placeholder">
                        <Upload size={32} className="upload-icon" />
                        <p className="upload-text">
                            {isDragging ? 'Suelta el archivo aquí' : 'Click o arrastra para subir logo'}
                        </p>
                        <p className="upload-hint">PNG o JPG, máximo 2MB</p>
                    </div>
                )}

                {isUploading && (
                    <div className="upload-overlay">
                        <div className="spinner" />
                        <p>Subiendo...</p>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                }}
                style={{ display: 'none' }}
            />

            {/* Error message */}
            {error && (
                <div className="error-message">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <style jsx>{`
        .logo-upload-container {
          margin-bottom: 2rem;
        }

        .logo-upload-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e5e7eb;
          margin-bottom: 0.75rem;
        }

        .upload-area {
          position: relative;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-area:hover {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.05);
        }

        .upload-area.dragging {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .upload-area.has-preview {
          padding: 1rem;
        }

        .preview-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .preview-image {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .remove-button {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-button:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .upload-placeholder {
          text-align: center;
        }

        .upload-icon {
          margin: 0 auto 1rem;
          opacity: 0.5;
        }

        .upload-text {
          margin: 0 0 0.5rem;
          font-size: 0.9rem;
          color: #d1d5db;
        }

        .upload-hint {
          margin: 0;
          font-size: 0.75rem;
          opacity: 0.5;
        }

        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    )
}
