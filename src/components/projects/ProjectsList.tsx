'use client'

import { FolderKanban, Plus, Eye, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import '@/styles/dashboard.css'
import '@/styles/companies.css'
// Reutilizamos estilos existentes para consistencia inmediata

interface Project {
    id: string
    name: string
    code: string
    description?: string | null
    status: string
    created_at: string
    members_count?: number
}

interface ProjectsListProps {
    projects: Project[]
    onCreate?: () => void
    context: 'founder' | 'staff'
}

export default function ProjectsList({ projects, onCreate, context }: ProjectsListProps) {
    const router = useRouter()

    const statusLabels: Record<string, string> = {
        planning: 'Planificación',
        active: 'Activo',
        on_hold: 'En Pausa',
        completed: 'Completado',
        cancelled: 'Cancelado'
    }

    const handleView = (projectId: string) => {
        // Staff and Founder might have different detail routes?
        // Assuming consistecy: /inputRole/projects/id
        router.push(`/${context}/projects/${projectId}`)
    }

    if (projects.length === 0) {
        return (
            <div className="companies-empty">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <FolderKanban size={64} color="#60a5fa" style={{ margin: '0 auto 1.5rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>
                        No hay proyectos
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '2rem' }}>
                        {context === 'founder'
                            ? 'Comienza creando tu primer proyecto para gestionar operaciones'
                            : 'Esta empresa aún no tiene proyectos registrados'}
                    </p>
                    {onCreate && (
                        <button
                            onClick={onCreate}
                            className="form-button"
                            style={{ width: 'auto' }}
                        >
                            🚀 Crear Primer Proyecto
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="companies-list-container">
            {onCreate && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCreate}
                        className="form-button"
                    >
                        <Plus size={20} />
                        Crear Nuevo Proyecto
                    </button>
                </div>
            )}

            <div className="companies-table-wrapper">
                <table className="companies-table">
                    <thead>
                        <tr>
                            <th>Proyecto</th>
                            <th>Código</th>
                            <th>Estado</th>
                            <th>Miembros</th>
                            <th>Creado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project.id}>
                                <td>
                                    <div>
                                        <div className="company-name">{project.name}</div>
                                        {project.description && (
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                {project.description.length > 50
                                                    ? project.description.substring(0, 50) + '...'
                                                    : project.description}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                        {project.code}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${project.status === 'active' ? 'active' : 'pending'}`}>
                                        <span className={`status-badge-dot ${project.status === 'active' ? 'active' : 'pending'}`} />
                                        {statusLabels[project.status] || project.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={16} color="#94a3b8" />
                                        <span>{project.members_count || 0}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="company-date">
                                        {new Date(project.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleView(project.id)}
                                        className="action-button"
                                        title="Ver detalles"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
