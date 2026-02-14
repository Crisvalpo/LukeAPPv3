'use client'

import { useState, useEffect, use } from 'react'
import { Users, Upload, Plus, Search, Trash2, UserCog, ArrowLeft } from 'lucide-react'
import { getProjectPersonnel, deletePerson, ProjectPersonnel } from '@/services/workforce'
import BulkImportModal from '@/components/personnel/BulkImportModal'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function PersonnelPage(props: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const params = use(props.params)
    const projectId = params.id

    const [loading, setLoading] = useState(true)
    const [personnel, setPersonnel] = useState<ProjectPersonnel[]>([])
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const loadData = async () => {
        setLoading(true)
        const data = await getProjectPersonnel(projectId)
        setPersonnel(data)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [projectId])

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
            const success = await deletePerson(id)
            if (success) loadData()
        }
    }

    const filteredPersonnel = personnel.filter(p =>
        p.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role_tag.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in text-text-main">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push(`/staff/projects/${projectId}`)}
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 rounded-full hover:bg-white/5 border border-white/5"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                            <Heading level={1} className="tracking-tight text-white mb-0">Personal de Obra</Heading>
                        </div>
                    </div>
                    <Text size="base" className="text-text-dim font-medium ml-18">
                        Gestión centralizada de trabajadores y control de acceso al proyecto.
                    </Text>
                </div>
                <div className="flex flex-wrap gap-3 ml-14 lg:ml-0">
                    <Button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Carga Masiva
                    </Button>
                    <Button variant="secondary" className="font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Ingreso
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-bg-surface-1 border border-glass-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por RUT, nombre o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-app border border-glass-border rounded-lg pl-10 pr-4 py-2 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="font-bold text-white bg-white/5 px-2 py-1 rounded">{filteredPersonnel.length}</span> trabajadores activos
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-surface-1/40 border border-glass-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-bg-surface-2/50 text-text-dim border-b border-glass-border text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4">RUT</th>
                                <th className="px-6 py-4">Nombre Completo</th>
                                <th className="px-6 py-4">Cargo</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-2"></div>
                                        <span className="text-text-muted">Cargando personal...</span>
                                    </td>
                                </tr>
                            ) : filteredPersonnel.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="w-8 h-8 text-text-dim" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">No hay trabajadores</h3>
                                        <Text className="text-text-muted max-w-sm mx-auto">
                                            No se encontraron registros activos en este proyecto. Utiliza el botón "Carga Masiva" para importar datos.
                                        </Text>
                                    </td>
                                </tr>
                            ) : (
                                filteredPersonnel.map((person) => (
                                    <tr key={person.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-brand-primary font-bold">{person.rut}</td>
                                        <td className="px-6 py-4 font-bold text-text-main">
                                            {person.first_name} {person.last_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded text-[11px] font-bold">
                                                {person.role_tag}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-transparent hover:border-brand-primary/20"
                                                >
                                                    <UserCog className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(person.id, `${person.first_name} ${person.last_name}`)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isImportModalOpen && (
                <BulkImportModal
                    projectId={projectId}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => {
                        loadData()
                        // Keep modal open or ask user? Default behavior closes via modal logic in 'Finalizar' 
                        // But here we refresh background data
                    }}
                />
            )}
        </div>
    )
}
