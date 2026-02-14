'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getProjectById, deleteProjectComplete, type Project } from '@/services/projects'
import { ArrowLeft, FileText, Trash2, LayoutDashboard, AlertTriangle, Building2 } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'

interface ProjectDetails extends Project {
    contract_number?: string
    client_name?: string
}

export default function StaffProjectDetailPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [project, setProject] = useState<ProjectDetails | null>(null)

    useEffect(() => {
        loadProject()
    }, [projectId])

    async function loadProject() {
        if (!projectId) return
        const data = await getProjectById(projectId)
        if (data) setProject(data)
        setIsLoading(false)
    }

    async function handleDelete() {
        if (!project) return

        const confirm1 = confirm(`⚠️ ESTÁS A PUNTO DE ELIMINAR EL PROYECTO "${project.name}"\n\n` +
            `Esta acción es IRREVERSIBLE y eliminará:\n` +
            `- Todos los usuarios vinculados.\n` +
            `- Todos los archivos en Storage (modelos, planos, etc).\n` +
            `- Todos los registros de Base de Datos.\n\n` +
            `¿Confirmas la eliminación TOTAL?`)

        if (!confirm1) return

        const typedName = prompt(`Para confirmar, escribe el nombre exacto del proyecto:\n"${project.name}"`)
        if (typedName !== project.name) {
            alert('El nombre no coincide. Eliminación cancelada.')
            return
        }

        setIsDeleting(true)

        // Call the complete deletion service
        const result = await deleteProjectComplete(projectId, project.company_id)

        if (result.success) {
            alert(`✅ Proyecto eliminado exitosamente.\n\nStats:\nMiembros: ${result.stats?.members || 0}\nArchivos: Limpiados`)
            router.push('/staff/projects')
        } else {
            alert('Error eliminando proyecto: ' + (result.error || 'Error desconocido'))
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Proyecto no encontrado</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in text-text-main">
            {/* Header */}
            <div className="space-y-2 relative group">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push('/staff/projects')}
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 rounded-full hover:bg-white/5 border border-white/5"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                            <Heading level={1} className="tracking-tight text-white">
                                {project.name}
                            </Heading>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-18">
                    <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                        {project.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${project.status === 'active'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {project.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="bg-bg-surface-1 border border-glass-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <Building2 size={12} className="text-brand-primary" /> Cliente
                            </h3>
                            <div className="text-lg text-white font-medium">
                                {project.client_name || <span className="text-text-dim/40 italic font-normal">No especificado</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <FileText size={12} className="text-brand-primary" /> Contrato
                            </h3>
                            <div className="text-lg text-white font-mono">
                                {project.contract_number || <span className="text-text-dim/40 italic font-normal font-sans">No especificado</span>}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-2">
                                <LayoutDashboard size={12} className="text-brand-primary" /> Descripción
                            </h3>
                            <div className="text-sm text-text-muted leading-relaxed">
                                {project.description || <span className="text-text-dim/40 italic">Sin descripción</span>}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-glass-border">
                        {/* Audit Button (Future) */}
                        <Button
                            variant="secondary"
                            className="bg-white/5 hover:bg-white/10 border-white/10 text-text-dim cursor-not-allowed opacity-50 shrink-0"
                            disabled
                        >
                            <LayoutDashboard size={18} className="mr-2" />
                            Auditar Proyecto
                        </Button>

                        <div className="flex-1" />

                        {/* DELETE Button */}
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            variant="destructive"
                            className="bg-red-500/10 hover:bg-red-500 border-red-500/20 text-red-500 hover:text-white font-bold transition-all shadow-lg hover:shadow-red-500/20"
                        >
                            <Trash2 size={18} className="mr-2" />
                            {isDeleting ? 'Eliminando...' : 'Eliminar Proyecto Definitivamente'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
