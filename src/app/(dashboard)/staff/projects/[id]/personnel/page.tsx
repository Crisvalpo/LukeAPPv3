'use client'

import { useState, useEffect, use } from 'react'
import { Users, Upload, Plus, Search, Trash2, UserCog } from 'lucide-react'
import { getProjectPersonnel, deletePerson, ProjectPersonnel } from '@/services/workforce'
import BulkImportModal from '@/components/personnel/BulkImportModal'

export default function PersonnelPage(props: { params: Promise<{ id: string }> }) {
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
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        Gestión de Personal
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Administra la dotación de trabajadores del proyecto.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                    >
                        <Upload className="w-4 h-4" />
                        Carga Masiva
                    </button>
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-700">
                        <Plus className="w-4 h-4" />
                        Nuevo Ingreso
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por RUT, nombre o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="font-bold text-slate-200">{filteredPersonnel.length}</span> trabajadores activos
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">RUT</th>
                            <th className="px-6 py-4">Nombre Completo</th>
                            <th className="px-6 py-4">Cargo</th>
                            <th className="px-6 py-4">Jornada</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <span className="text-slate-500">Cargando personal...</span>
                                </td>
                            </tr>
                        ) : filteredPersonnel.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-300 mb-1">No hay trabajadores</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        No se encontraron registros activos en este proyecto. Utiliza el botón "Carga Masiva" para importar datos.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filteredPersonnel.map((person) => (
                                <tr key={person.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-blue-400 font-medium">{person.rut}</td>
                                    <td className="px-6 py-4 font-medium text-slate-200">
                                        {person.first_name} {person.last_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700 font-medium">
                                            {person.role_tag}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{person.schedule_name || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors">
                                                <UserCog className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(person.id, `${person.first_name} ${person.last_name}`)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
