'use client'

/**
 * Engineering Hub - Unified Engineering Management
 * 
 * Tabs:
 * - Revisiones (Phase 2 - Active)
 * - Isométricos (Future)
 * - Carga de Datos (Future)
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RevisionsTab from '@/components/engineering/RevisionsTab'
import RevisionAnnouncementTab from '@/components/engineering/RevisionAnnouncementTab'
import DataLoadingTab from '@/components/engineering/DataLoadingTab'
import '@/styles/dashboard.css'
import '@/styles/engineering.css'
import '@/styles/announcement.css'

type TabType = 'revisiones' | 'announcement' | 'details' | 'carga'

export default function EngineeringHub() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<TabType>('revisiones')
    const [projects, setProjects] = useState<Array<{ id: string; name: string; code: string; company_id: string }>>([])
    const [selectedProject, setSelectedProject] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [userRole, setUserRole] = useState<'founder' | 'admin' | null>(null)

    useEffect(() => {
        loadProjects()

        // Check for tab in URL params
        const tab = searchParams.get('tab') as TabType
        if (tab && ['revisiones', 'announcement', 'details', 'carga'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    async function loadProjects() {
        try {
            const supabase = createClient()

            // Get user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            // Check role (founder or admin)
            const { data: memberData } = await supabase
                .from('members')
                .select('company_id, project_id, role_id')
                .eq('user_id', user.id)
                .in('role_id', ['founder', 'admin'])
                .limit(1)
                .single()

            if (!memberData) {
                router.push('/')
                return
            }

            setUserRole(memberData.role_id as 'founder' | 'admin')

            // If Founder: get all company projects
            if (memberData.role_id === 'founder') {
                const { data: companyProjects } = await supabase
                    .from('projects')
                    .select('id, name, code, company_id')
                    .eq('company_id', memberData.company_id)
                    .order('name')

                if (companyProjects && companyProjects.length > 0) {
                    setProjects(companyProjects)
                    setSelectedProject(companyProjects[0].id)
                }
            }
            // If Admin: get only their assigned project
            else if (memberData.role_id === 'admin' && memberData.project_id) {
                const { data: project } = await supabase
                    .from('projects')
                    .select('id, name, code, company_id')
                    .eq('id', memberData.project_id)
                    .single()

                if (project) {
                    setProjects([project])
                    setSelectedProject(project.id)
                }
            }

        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    function changeTab(tab: TabType) {
        setActiveTab(tab)
        // Update URL without reload
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', tab)
        router.push(`/founder/engineering?${params.toString()}`, { scroll: false })
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Ingeniería</h1>
                </div>
                <div className="empty-state-container">
                    <div className="empty-state-icon">📐</div>
                    <h2 className="empty-state-title">No hay proyectos</h2>
                    <p className="empty-state-description">
                        Necesitas tener al menos un proyecto para acceder a Ingeniería.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Ingeniería</h1>
                </div>
                <p className="dashboard-subtitle">
                    Gestión de datos de ingeniería, revisiones e isométricos
                </p>
            </div>

            {/* Project Selector (Founders only) */}
            {userRole === 'founder' && projects.length > 1 && (
                <div className="engineering-project-selector">
                    <label>Proyecto:</label>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="project-dropdown"
                    >
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.code} - {project.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="engineering-tabs">
                <button
                    className={`tab-button ${activeTab === 'revisiones' ? 'active' : ''}`}
                    onClick={() => changeTab('revisiones')}
                >
                    📋 Revisiones
                </button>
                <button
                    className={`tab-button ${activeTab === 'announcement' ? 'active' : ''}`}
                    onClick={() => changeTab('announcement')}
                >
                    📢 1. Anuncio
                </button>
                <button
                    className={`tab-button ${activeTab === 'details' ? 'active' : ''} disabled`}
                    disabled
                    title="Próximamente"
                >
                    🔧 2. Detalles
                    <span className="badge-soon">Próximamente</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'carga' ? 'active' : ''}`}
                    onClick={() => changeTab('carga')}
                >
                    📤 Carga de Datos (Antiguo)
                </button>
            </div>

            {/* Tab Content */}
            <div className="engineering-content">
                {activeTab === 'revisiones' && (
                    <RevisionsTab projectId={selectedProject} />
                )}

                {activeTab === 'announcement' && selectedProject && userRole && (
                    <RevisionAnnouncementTab
                        projectId={selectedProject}
                        companyId={projects.find(p => p.id === selectedProject)?.company_id || ''}
                        onSuccess={() => {
                            // Refresh revisions tab or show success message
                            console.log('Announcement upload successful!')
                        }}
                    />
                )}

                {activeTab === 'details' && (
                    <div className="empty-state-container">
                        <div className="empty-state-icon">🔧</div>
                        <h2 className="empty-state-title">Carga de Detalles</h2>
                        <p className="empty-state-description">
                            Próximamente: Upload de spools, soldaduras, MTO y juntas empernadas.
                        </p>
                    </div>
                )}

                {activeTab === 'carga' && (
                    <DataLoadingTab projectId={selectedProject} />
                )}
            </div>
        </div>
    )
}
