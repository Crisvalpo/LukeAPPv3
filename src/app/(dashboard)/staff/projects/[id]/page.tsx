'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getProjectById, type Project } from '@/services/projects'
import { ArrowLeft, FileText, Trash2, LayoutDashboard } from 'lucide-react'
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

                    {/* Access Action (Go to Dashboard) */}
                    {/* Staff might want to enter the project AS if they were an admin to audit it deeply */}
                    <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                        <button
                            className="action-button disabled" // Placeholder for future feature
                            style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }}
                            title="Próximamente: Entrar como Auditor"
                        >
                            <LayoutDashboard size={18} />
                            Auditar Proyecto (Próximamente)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
