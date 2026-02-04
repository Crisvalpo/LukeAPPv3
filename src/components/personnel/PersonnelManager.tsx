'use client'

import { useState, useEffect } from 'react'
import { Users, Upload, Plus, Search, Trash2, UserCog, FileDown } from 'lucide-react'
import { getProjectPersonnel, deletePerson, ProjectPersonnel } from '@/services/workforce'
import BulkImportModal from '@/components/personnel/BulkImportModal'
import AddPersonnelModal from '@/components/personnel/AddPersonnelModal'
import '@/styles/views/personnel.css' // Import Vanilla CSS

interface PersonnelManagerProps {
    projectId: string
    isAdmin?: boolean // To conditionally show actions if needed
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
        <div className="personnel-manager">
            {/* Header / Actions */}
            <div className="personnel-header">
                <div>
                    <h3 className="personnel-title">
                        <Users size={24} style={{ color: 'var(--primary)' }} />
                        Dotación del Proyecto
                    </h3>
                    <p className="personnel-subtitle">
                        Total: <span className="personnel-count">{filteredPersonnel.length}</span> trabajadores activos
                    </p>
                </div>
                <div className="personnel-actions">
                    <button
                        onClick={() => import('@/utils/excel-templates').then(m => m.downloadPersonnelTemplate())}
                        className="btn-secondary"
                        title="Descargar Plantilla Excel"
                    >
                        <FileDown size={16} />
                        Plantilla
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-primary"
                    >
                        <Upload size={16} />
                        Carga Masiva
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-secondary"
                    >
                        <Plus size={16} />
                        Manual
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="personnel-filters">
                <div className="search-container">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por RUT, nombre o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="personnel-table-container">
                <div className="personnel-table-wrapper">
                    <table className="personnel-table">
                        <thead>
                            <tr>
                                <th className="col-id text-xs w-20">ID</th>
                                <th className="col-rut">RUT</th>
                                <th>Nombre Completo</th>
                                <th>Cargo</th>
                                <th>Jornada</th>
                                <th>Turno</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="empty-state">
                                        <div className="text-secondary">Cargando personal...</div>
                                    </td>
                                </tr>
                            ) : filteredPersonnel.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-state">
                                        <div className="empty-icon-container">
                                            <Users size={24} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <p className="empty-title">
                                            No se encontraron registros.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPersonnel.map((person) => (
                                    <tr key={person.id} className="personnel-row">
                                        <td className="font-mono text-xs text-slate-500">{person.internal_id || '-'}</td>
                                        <td className="col-rut">{person.rut}</td>
                                        <td className="col-name">
                                            {person.first_name} {person.last_name}
                                        </td>
                                        <td>
                                            <span className="role-badge">
                                                {person.role_tag}
                                            </span>
                                        </td>
                                        <td>{person.schedule_name || '-'}</td>
                                        <td>
                                            {person.shift_type && (
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${person.shift_type === 'NOCHE'
                                                    ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800'
                                                    : 'bg-amber-900/30 text-amber-300 border border-amber-800'
                                                    }`}>
                                                    {person.shift_type}
                                                </span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            <div className="action-buttons">
                                                <button className="btn-icon">
                                                    <UserCog size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person.id, `${person.first_name} ${person.last_name}`)}
                                                    className="btn-icon danger"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
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
