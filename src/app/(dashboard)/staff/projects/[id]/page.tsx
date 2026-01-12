'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getProjectById, deleteProjectComplete, type Project } from '@/services/projects'
import { ArrowLeft, FileText, Trash2, LayoutDashboard, AlertTriangle } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

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

        if (!window.confirm(`⚠️ ESTÁS A PUNTO DE ELIMINAR EL PROYECTO "${project.name}"\n\n` +
            `Esta acción es IRREVERSIBLE y eliminará:\n` +
            `- Todos los usuarios vinculados.\n` +
            `- Todos los archivos en Storage (modelos, planos, etc).\n` +
            `- Todos los registros de Base de Datos.\n\n` +
            `¿Confirmas la eliminación TOTAL?`)) {
            return
        }

        setIsDeleting(true)

        // Call the complete deletion service
        const result = await deleteProjectComplete(projectId, project.company_id)

        if (result.success) {
            alert(`Proyecto eliminado exitosamente.\n\nStats:\nMiembros: ${result.stats?.members || 0}\nArchivos: Limpiados`)
            router.push('/staff/projects')
        } else {
            alert('Error eliminando proyecto: ' + (result.error || 'Error desconocido'))
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    if (!project) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Proyecto no encontrado</p></div>
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => router.push('/staff/projects')}
                        className="action-button"
                        style={{ padding: '0.5rem', width: 'auto' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="dashboard-header-content">
                        <div className="dashboard-accent-line" />
                        <h1 className="dashboard-title">
                            {project.name}
                        </h1>
                    </div>
                </div>
                <p className="dashboard-subtitle">
                    {project.code} • <span style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                </p>
            </div>

            <div className="company-form-container">
                <div style={{ padding: '1rem' }}>
                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Cliente
                            </h3>
                            <div style={{ fontSize: '1.125rem', color: 'white', fontWeight: '500' }}>
                                {project.client_name || <span style={{ color: '#475569', fontStyle: 'italic' }}>No especificado</span>}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Contrato
                            </h3>
                            <div style={{ fontSize: '1.125rem', color: 'white', fontWeight: '500', fontFamily: 'monospace' }}>
                                {project.contract_number || <span style={{ color: '#475569', fontStyle: 'italic', fontFamily: 'sans-serif' }}>No especificado</span>}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Descripción
                            </h3>
                            <div style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                {project.description || <span style={{ color: '#475569', fontStyle: 'italic' }}>Sin descripción</span>}
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                        {/* Audit Button (Future) */}
                        <button
                            className="action-button disabled"
                            style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }}
                            title="Próximamente: Entrar como Auditor"
                        >
                            <LayoutDashboard size={18} />
                            Auditar
                        </button>

                        {/* DELETE Button */}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="action-button delete"
                            style={{
                                width: 'auto',
                                padding: '0.75rem 1.5rem',
                                gap: '0.5rem',
                                marginLeft: 'auto',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5'
                            }}
                        >
                            <Trash2 size={18} />
                            {isDeleting ? 'Eliminando...' : 'Eliminar Proyecto'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
