'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'
import { Building2, ChevronRight } from 'lucide-react'
import '@/styles/dashboard.css'

interface Company {
    id: string
    name: string
    code: string
}

interface ProjectWithStats extends Project {
    members_count: number
}

export default function StaffProjectsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
    const [projects, setProjects] = useState<ProjectWithStats[]>([])

    useEffect(() => {
        loadCompanies()
    }, [])

    useEffect(() => {
        if (selectedCompany) {
            loadCompanyProjects(selectedCompany.id)
        }
    }, [selectedCompany])

    async function loadCompanies() {
        const supabase = createClient()
        const { data } = await supabase
            .from('companies')
            .select('id, name, slug')
            .order('name')

        if (data) {
            setCompanies(data.map(c => ({ id: c.id, name: c.name, code: c.slug })))
        }
        setIsLoading(false)
    }

    async function loadCompanyProjects(companyId: string) {
        const supabase = createClient()
        // Get projects
        const projectsData = await getProjectsByCompany(companyId)

        // Get members stats (optional but nice)
        const projectsWithStats = await Promise.all(
            projectsData.map(async (project) => {
                const { count } = await supabase
                    .from('members')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', project.id)
                return { ...project, members_count: count || 0 }
            })
        )
        setProjects(projectsWithStats)
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Proyectos Globales</h1>
                </div>
                <p className="dashboard-subtitle">Auditoría y revisión de proyectos por empresa.</p>
            </div>

            {/* COMPANY SELECTOR */}
            {!selectedCompany ? (
                <div className="company-form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <Building2 size={48} color="#60a5fa" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                            Selecciona una Empresa
                        </h2>
                        <p style={{ color: '#94a3b8' }}>
                            Elige la empresa para ver sus proyectos activos e históricos.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {companies.map(company => (
                            <button
                                key={company.id}
                                onClick={() => setSelectedCompany(company)}
                                className="action-button"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    padding: '1.5rem',
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    height: 'auto',
                                    gap: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', color: 'white', fontSize: '1.1rem' }}>{company.name}</span>
                                    <ChevronRight size={16} color="#64748b" />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                    {company.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* CONTEXT BAR */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.5rem',
                        background: 'rgba(5b, 33, 182, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '0.75rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="company-logo-box" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
                                <Building2 size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 'bold' }}>Empresa Seleccionada</div>
                                <div style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>{selectedCompany.name}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedCompany(null)}
                            className="action-button"
                        >
                            Cambiar Empresa
                        </button>
                    </div>

                    {/* REUSABLE PROJECTS LIST (View System) */}
                    <ListView
                        schema={ProjectSchema}
                        data={projects}
                        onAction={(action: string, item: Project) => {
                            if (action === 'view') router.push(`/staff/projects/${item.id}`)
                        }}
                    />
                </>
            )}
        </div>
    )
}
