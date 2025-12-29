'use client'

/**
 * Engineering Hub - Unified Engineering Management
 * 
 * Tabs:
 * - Revisiones (Phase 2 - Active)
 * - Anuncio (Phase 2.7 - Upload announcements)
 * - Detalles (Phase 2.8 - Upload details)
 * - Fabricabilidad (Phase 2.10 - Material Control)
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RevisionsTab from '@/components/engineering/RevisionsTab'
import RevisionAnnouncementTab from '@/components/engineering/RevisionAnnouncementTab'
import EngineeringDetailsTab from '@/components/engineering/EngineeringDetailsTab'
import FabricabilityDashboard from '@/components/engineering/FabricabilityDashboard'
import '@/styles/dashboard.css'
import '@/styles/engineering.css'
import '@/styles/announcement.css'
import '@/styles/engineering-details.css'

type TabType = 'revisiones' | 'announcement' | 'details' | 'fabricability'

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
        if (tab && ['revisiones', 'announcement', 'details', 'fabricability'].includes(tab)) {
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
                    <h1 className="dashboard-title">Ingenier

                        ía</h1>
                </div>
                <p className="dashboard-subtitle">
                    Gestión de datos de ingeniería, revisiones e isométricos
                </p>
            </div>

            {/* Project Selector (Founders only) */}
            {userRole === 'founder' && projects.length > 0 && (
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
                    className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => changeTab('details')}
                >
                    🔧 2. Detalles
                </button>
                <button
                    className={`tab-button ${activeTab === 'fabricability' ? 'active' : ''}`}
                    onClick={() => changeTab('fabricability')}
                >
                    🟢 3. Fabricabilidad
                </button>
            </div>

            {/* Tab Content */}
            <div className="engineering-content">
                {!selectedProject ? (
                    <div className="no-project-message">
                        <div className="message-icon">📁</div>
                        <h3>Selecciona un Proyecto</h3>
                        <p>Para acceder al Engineering Hub, primero debes seleccionar un proyecto del menú superior.</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'revisiones' && (
                            <RevisionsTab projectId={selectedProject} />
                        )}

                        {activeTab === 'announcement' && userRole && (
                            <RevisionAnnouncementTab
                                projectId={selectedProject}
                                companyId={projects.find(p => p.id === selectedProject)?.company_id || ''}
                                onSuccess={() => {
                                    console.log('Announcement upload successful!')
                                }}
                            />
                        )}

                        {activeTab === 'details' && (
                            <EngineeringDetailsTab
                                projectId={selectedProject}
                                companyId={projects.find(p => p.id === selectedProject)?.company_id || ''}
                            />
                        )}

                        {activeTab === 'fabricability' && (
                            <FabricabilityDashboard projectId={selectedProject} />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
