'use client'

import { useState, useEffect } from 'react'
import { Users, Upload, Plus, Search, Trash2, UserCog, FileDown } from 'lucide-react'
import { getProjectPersonnel, deletePerson, ProjectPersonnel } from '@/services/workforce'
import BulkImportModal from '@/components/personnel/BulkImportModal'
import AddPersonnelModal from '@/components/personnel/AddPersonnelModal'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/badge'

interface PersonnelManagerProps {
    projectId: string
    isAdmin?: boolean
}

export default function PersonnelManager({ projectId, isAdmin = true }: PersonnelManagerProps) {
    const [loading, setLoading] = useState(true)
    const [personnel, setPersonnel] = useState<ProjectPersonnel[]>([])
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const loadData = async () => {
        setLoading(true)
        const data = await getProjectPersonnel(projectId)
        setPersonnel(data)
        setLoading(false)
    }

    useEffect(() => {
        if (projectId) {
            loadData()
        }
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
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <Heading level={3} className="flex items-center gap-3 mb-2 text-white">
                        <Users size={24} className="text-brand-primary" />
                        Dotación del Proyecto
                    </Heading>
                    <Text variant="muted" className="text-sm">
                        Total: <span className="font-bold text-white">{filteredPersonnel.length}</span> trabajadores activos
                    </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() => import('@/utils/excel-templates').then(m => m.downloadPersonnelTemplate())}
                        variant="outline"
                        className="gap-2"
                        title="Descargar Plantilla Excel"
                    >
                        <FileDown size={16} />
                        Plantilla
                    </Button>
                    <Button
                        onClick={() => setIsImportModalOpen(true)}
                        className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white"
                    >
                        <Upload size={16} />
                        Carga Masiva
                    </Button>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        variant="secondary"
                        className="gap-2"
                    >
                        <Plus size={16} />
                        Manual
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-bg-surface-1 border border-glass-border rounded-lg p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por RUT, nombre o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-app border border-glass-border rounded-lg pl-10 pr-4 py-2.5 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-surface-1/40 border border-glass-border rounded-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-bg-surface-2/50 text-text-dim border-b border-glass-border">
                            <tr>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider">ID</th>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider">RUT</th>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider">Nombre Completo</th>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider">Cargo</th>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider">Jornada</th>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider">Turno</th>
                                <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                            <Text variant="muted">Cargando personal...</Text>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPersonnel.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center">
                                                <Users size={32} className="text-text-dim" />
                                            </div>
                                            <div>
                                                <Heading level={4} className="text-white mb-1">No se encontraron registros</Heading>
                                                <Text variant="muted" className="text-sm">
                                                    {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Utiliza el botón "Carga Masiva" para importar datos.'}
                                                </Text>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPersonnel.map((person) => (
                                    <tr key={person.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{person.internal_id || '-'}</td>
                                        <td className="px-6 py-4 font-mono text-brand-primary font-bold">{person.rut}</td>
                                        <td className="px-6 py-4 font-medium text-text-main">
                                            {person.first_name} {person.last_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="default" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                                                {person.role_tag}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-text-muted">{person.schedule_name || '-'}</td>
                                        <td className="px-6 py-4">
                                            {person.shift_type && (
                                                <Badge
                                                    variant="outline"
                                                    className={person.shift_type === 'NOCHE'
                                                        ? 'bg-indigo-900/50 text-indigo-300 border-indigo-800'
                                                        : 'bg-amber-900/30 text-amber-300 border-amber-800'
                                                    }
                                                >
                                                    {person.shift_type}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded hover:bg-brand-primary/10 hover:text-brand-primary transition-colors border border-transparent hover:border-brand-primary/20"
                                                >
                                                    <UserCog size={16} />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(person.id, `${person.first_name} ${person.last_name}`)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 size={16} />
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

            {/* Modals */}
            {isImportModalOpen && (
                <BulkImportModal
                    projectId={projectId}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => {
                        loadData()
                    }}
                />
            )}
            {isAddModalOpen && (
                <AddPersonnelModal
                    projectId={projectId}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        loadData()
                    }}
                />
            )}
        </div>
    )
}
