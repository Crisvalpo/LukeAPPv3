import React, { useState } from 'react'
import { Upload, Image as ImageIcon, Check, ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageEditor, { type CropSettings } from './ImageEditor'
import LogoCanvas from './LogoCanvas'
import { getProjectFilePath } from '@/lib/storage-paths'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/badge'

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
            // Fetch project and company info for descriptive path
            const { data: projectData } = await supabase
                .from('projects')
                .select('code, name, company_id, companies(id, slug)')
                .eq('id', projectId)
                .single()

            if (!projectData || !projectData.companies) {
                throw new Error('Could not load project/company data')
            }

            // Generate filename
            const timestamp = Date.now()
            const fileName = `${editingLogo}_${timestamp}.png`

            // Path: {company-slug}-{id}/{project-code}-{id}/logos/{filename}
            // @ts-ignore
            const company = { id: projectData.companies.id, slug: projectData.companies.slug }
            const project = { id: projectId, code: projectData.code, name: projectData.name }
            const storagePath = getProjectFilePath(company, project, 'logos', fileName)

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
        <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                {onBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        title="Volver a Configuración"
                        className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                )}
                <div>
                    <Heading level={2}>Logos del Proyecto</Heading>
                    <Text variant="muted">
                        Configura hasta dos logos para incluir en los documentos MIR. Usa el editor integrado para ajustar el recorte y zoom.
                    </Text>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <div className="pt-8 border-t border-white/5">
                    <Heading level={3} className="mb-2 text-lg">Vista Previa Final</Heading>
                    <Text variant="muted" className="mb-6">Así se verán los logos en los documentos PDF generados.</Text>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                        <LogoCanvas primaryLogoUrl={primaryLogo} secondaryLogoUrl={secondaryLogo} />
                    </div>
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
        <div className="flex flex-col bg-bg-surface-1 border border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-white/20 transition-all duration-300">
            <div className="p-5 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                <div>
                    <Heading level={4} className="m-0 text-base font-semibold">{title}</Heading>
                    <Text size="sm" variant="muted">{subtitle}</Text>
                </div>
                {isOptional && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
                        Opcional
                    </Badge>
                )}
            </div>

            <div className="p-5 flex-grow flex flex-col justify-center">
                {logoUrl ? (
                    <div className="flex flex-col gap-4 w-full">
                        <div className="bg-checkered p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center min-h-[160px]">
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
                                className="max-w-full h-auto max-h-[120px] object-contain transition-opacity duration-300 opacity-0"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                disabled={isUploading}
                                className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 text-white"
                            >
                                Cambiar
                            </Button>
                            <Button
                                onClick={onRemove}
                                variant="destructive"
                                disabled={isUploading}
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300 min-h-[200px]"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 group-hover:bg-brand-primary/10 transition-all duration-300">
                            <Upload size={32} className="text-white/40 group-hover:text-brand-primary" />
                        </div>
                        <p className="text-white font-medium mb-1 group-hover:text-brand-primary transition-colors">Click para subir imagen</p>
                        <p className="text-xs text-text-muted">PNG o JPG, máx. 5MB</p>
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
        </div>
    )
}
