import { StructureModel } from '@/types'
import { Trash2, Box, Eye } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Text, Heading } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/badge'

export default function StructureModelCard({
    model,
    onDelete,
    onPreview,
    readOnly
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
        <div className="flex items-center justify-between p-4 bg-bg-surface-1 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                    <Box size={20} />
                </div>
                <div>
                    <Heading level={4} className="text-sm font-medium m-0 mb-1">{model.name}</Heading>
                    <div className="flex items-center gap-3 text-sm text-text-muted">
                        {model.area && (
                            <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-xs font-normal">
                                {model.area}
                            </Badge>
                        )}
                        <Text size="xs" variant="muted">{new Date(model.created_at).toLocaleDateString()}</Text>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreview(model)}
                    title="Vista Previa"
                    className="h-8 w-8 text-text-muted hover:text-blue-400 hover:bg-blue-500/10"
                >
                    <Eye size={16} />
                </Button>

                {!readOnly && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Eliminar Modelo"
                        className="h-8 w-8 text-text-muted hover:text-red-400 hover:bg-red-500/10"
                    >
                        <Trash2 size={16} />
                    </Button>
                )}
            </div>
        </div>
    )
}
