import React, { useState } from 'react'
import { Upload, Image as ImageIcon, Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageEditor, { type CropSettings } from './ImageEditor'
import LogoCanvas from './LogoCanvas'

interface ProjectLogosManagerProps {
    projectId: string
    companyId: string
    primaryLogoUrl?: string | null
    secondaryLogoUrl?: string | null
    onUpdate: () => void
    onBack?: () => void
}

type LogoType = 'primary' | 'secondary'

export default function ProjectLogosManager({
    projectId,
    companyId,
    primaryLogoUrl: initialPrimary,
    secondaryLogoUrl: initialSecondary,
    onUpdate,
    onBack,
}: ProjectLogosManagerProps) {
    const supabase = createClient()

    const [primaryLogo, setPrimaryLogo] = useState<string | null>(initialPrimary || null)
    const [secondaryLogo, setSecondaryLogo] = useState<string | null>(initialSecondary || null)
    const [editingLogo, setEditingLogo] = useState<LogoType | null>(null)

    // Effect to sync state when props change (e.g. after parent reload)
    React.useEffect(() => {
        setPrimaryLogo(initialPrimary || null)
        setSecondaryLogo(initialSecondary || null)
    }, [initialPrimary, initialSecondary])
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    async function handleFileSelect(file: File, logoType: LogoType) {
        // Validate file
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            alert('Solo se permiten archivos PNG o JPG')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo no debe superar 5MB')
            return
        }

        // Create temp URL for editor
        const tempUrl = URL.createObjectURL(file)
        setTempImageUrl(tempUrl)
        setEditingLogo(logoType)
    }

    async function handleSaveCroppedImage(croppedBlob: Blob, cropSettings: CropSettings) {
        if (!editingLogo) return

        setIsUploading(true)
        try {
            // Generate filename
            const timestamp = Date.now()
            const fileName = `${editingLogo}_${timestamp}.png`

            // Path: {company_id}/{project_id}/logos/{filename}
            const storagePath = `${companyId}/${projectId}/logos/${fileName}`

            // Delete old logo if exists
            const oldUrl = editingLogo === 'primary' ? primaryLogo : secondaryLogo
            if (oldUrl) {
                try {
                    // Try delete from new bucket first
                    if (oldUrl.includes('/project-files/')) {
                        const pathParts = oldUrl.split('/project-files/')
                        if (pathParts.length > 1) {
                            await supabase.storage.from('project-files').remove([decodeURIComponent(pathParts[1])])
                        }
                    }
                } catch (e) {
                    console.warn('Error deleting old logo', e)
                }
            }

            // Upload new cropped image
            const { data, error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(storagePath, croppedBlob, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(storagePath)

            // Update project in database
            const updateData = editingLogo === 'primary'
                ? { logo_primary_url: publicUrl, logo_primary_crop: cropSettings }
                : { logo_secondary_url: publicUrl, logo_secondary_crop: cropSettings }

            const { error: updateError } = await supabase
                .from('projects')
                .update(updateData)
                .eq('id', projectId)

            if (updateError) throw updateError

            // Update local state
            if (editingLogo === 'primary') {
                setPrimaryLogo(publicUrl)
            } else {
                setSecondaryLogo(publicUrl)
            }

            // Cleanup
            if (tempImageUrl) {
                URL.revokeObjectURL(tempImageUrl)
            }
            setTempImageUrl(null)
            setEditingLogo(null)

            onUpdate()
        } catch (error: any) {
            console.error('Error saving logo:', error)
            alert('Error al guardar el logo: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    function handleCancelEdit() {
        if (tempImageUrl) {
            URL.revokeObjectURL(tempImageUrl)
        }
        setTempImageUrl(null)
        setEditingLogo(null)
    }

    async function handleRemoveLogo(logoType: LogoType) {
        if (!confirm('¿Estás seguro de eliminar este logo?')) return

        setIsUploading(true)
        try {
            const logoUrl = logoType === 'primary' ? primaryLogo : secondaryLogo

            // Delete from storage
            if (logoUrl) {
                try {
                    // Try delete from new bucket first
                    if (logoUrl.includes('/project-files/')) {
                        const pathParts = logoUrl.split('/project-files/')
                        if (pathParts.length > 1) {
                            await supabase.storage.from('project-files').remove([decodeURIComponent(pathParts[1])])
                        }
                    }
                } catch (e) {
                    console.warn('Error deleting logo', e)
                }
            }

            // Update database
            const updateData = logoType === 'primary'
                ? { logo_primary_url: null, logo_primary_crop: null }
                : { logo_secondary_url: null, logo_secondary_crop: null }

            const { error } = await supabase
                .from('projects')
                .update(updateData)
                .eq('id', projectId)

            if (error) throw error

            // Update local state
            if (logoType === 'primary') {
                setPrimaryLogo(null)
            } else {
                setSecondaryLogo(null)
            }

            onUpdate()
        } catch (error: any) {
            console.error('Error removing logo:', error)
            alert('Error al eliminar el logo')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="logos-manager">
            {/* Header */}
            <div className="manager-header">
                <div className="header-left">
                    {onBack && (
                        <button onClick={onBack} className="btn-back" title="Volver a Configuración">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2>Logos del Proyecto</h2>
                        <p className="description">
                            Configura hasta dos logos para incluir en los documentos MIR. Usa el editor integrado para ajustar el recorte y zoom.
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="logos-grid">
                {/* Primary Logo Card */}
                <LogoCard
                    title="Logo Principal"
                    subtitle="Empresa o Proyecto"
                    logoUrl={primaryLogo}
                    onFileSelect={(file) => handleFileSelect(file, 'primary')}
                    onRemove={() => handleRemoveLogo('primary')}
                    isUploading={isUploading}
                />

                {/* Secondary Logo Card */}
                <LogoCard
                    title="Logo Secundario"
                    subtitle="Cliente (Opcional)"
                    logoUrl={secondaryLogo}
                    onFileSelect={(file) => handleFileSelect(file, 'secondary')}
                    onRemove={() => handleRemoveLogo('secondary')}
                    isUploading={isUploading}
                    isOptional
                />
            </div>

            {/* Canvas Preview */}
            {(primaryLogo || secondaryLogo) && (
                <div className="preview-section">
                    <h3>Preview Final</h3>
                    <p className="preview-desc">Así se verán los logos en los documentos PDF</p>
                    <LogoCanvas primaryLogoUrl={primaryLogo} secondaryLogoUrl={secondaryLogo} />
                </div>
            )}

            {/* Image Editor Modal */}
            {tempImageUrl && editingLogo && (
                <ImageEditor
                    imageUrl={tempImageUrl}
                    title={editingLogo === 'primary' ? 'Editar Logo Principal' : 'Editar Logo Secundario'}
                    onSave={handleSaveCroppedImage}
                    onCancel={handleCancelEdit}
                />
            )}

            <style jsx>{`
        .logos-manager {
          max-width: 800px;
        }

        h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .description {
          color: #94a3b8;
          margin: 0 0 2rem;
          line-height: 1.6;
        }

        .logos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .preview-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preview-section h3 {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .preview-desc {
          color: #94a3b8;
          margin: 0 0 1.5rem;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    )
}

// Logo Card Component
interface LogoCardProps {
    title: string
    subtitle: string
    logoUrl?: string | null
    onFileSelect: (file: File) => void
    onRemove: () => void
    isUploading: boolean
    isOptional?: boolean
}

function LogoCard({ title, subtitle, logoUrl, onFileSelect, onRemove, isUploading, isOptional }: LogoCardProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    return (
        <div className="logo-card">
            <div className="card-header">
                <div>
                    <h3>{title}</h3>
                    <p>{subtitle}</p>
                </div>
                {isOptional && <span className="optional-badge">Opcional</span>}
            </div>

            <div className="card-body">
                {logoUrl ? (
                    <div className="logo-preview">
                        <img
                            key={logoUrl}
                            src={logoUrl}
                            alt={title}
                            onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.opacity = '1';
                            }}
                            onError={(e) => {
                                console.error('Error loading logo image:', logoUrl);
                                const target = e.target as HTMLImageElement;
                                target.style.opacity = '0.5';
                                target.style.border = '1px solid red';
                            }}
                            style={{ opacity: 0, transition: 'opacity 0.3s' }}
                        />
                        <div className="logo-actions">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="action-btn"
                                disabled={isUploading}
                            >
                                Cambiar
                            </button>
                            <button
                                onClick={onRemove}
                                className="action-btn remove"
                                disabled={isUploading}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={32} className="upload-icon" />
                        <p className="upload-text">Click para subir</p>
                        <p className="upload-hint">PNG o JPG, máx. 5MB</p>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFileSelect(file)
                }}
                style={{ display: 'none' }}
            />

            <style jsx>{`
        .logos-manager {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .manager-header {
          margin-bottom: 0.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-back {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .btn-back:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(-2px);
          border-color: rgba(255,255,255,0.2);
        }

        h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .description {
          color: #94a3b8;
          font-size: 0.9rem;
          margin: 0;
        }

        .logos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .logo-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card-header h3 {
          color: white;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
        }

        .card-header p {
          color: #94a3b8;
          font-size: 0.875rem;
          margin: 0;
        }

        .optional-badge {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-body {
          padding: 1.25rem;
        }

        .upload-area {
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-area:hover {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.05);
        }

        .upload-icon {
          margin: 0 auto 1rem;
          opacity: 0.5;
          color: #cbd5e1;
        }

        .upload-text {
          margin: 0 0 0.5rem;
          color: #cbd5e1;
          font-weight: 500;
        }

        .upload-hint {
          margin: 0;
          color: #64748b;
          font-size: 0.75rem;
        }

        .logo-preview {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .logo-preview img {
          width: 100%;
          height: 150px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 1rem;
        }

        .logo-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.625rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .action-btn.remove:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    )
}
