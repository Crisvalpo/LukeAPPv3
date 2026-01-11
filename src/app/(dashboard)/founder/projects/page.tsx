'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'
import DeleteProjectModal from '@/components/modals/DeleteProjectModal'
import '@/styles/dashboard.css'

import { SubscriptionTierType } from '@/types'
import { XCircle, ArrowUpCircle } from 'lucide-react'

interface ProjectWithStats extends Project {
    members_count: number
    current_week: string | null
}

export default function ProjectsListPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [projects, setProjects] = useState<ProjectWithStats[]>([])
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTierType>('starter')

    const [customProjectsLimit, setCustomProjectsLimit] = useState<number | null>(null)

    const [maxProjectsLimit, setMaxProjectsLimit] = useState<number>(1) // Default fallback

    // Modals
    const [deleteModal, setDeleteModal] = useState<{
        projectId: string
        projectCode: string
        projectName: string
    } | null>(null)

    const [limitModalOpen, setLimitModalOpen] = useState(false)

    useEffect(() => {
        loadProjects()
    }, [])

    async function loadProjects() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        const { data: memberData } = await supabase
            .from('members')
            .select('company_id, company:companies(subscription_tier, custom_projects_limit)')
            .eq('user_id', user.id)
            .eq('role_id', 'founder')
            .single()

        if (!memberData) { router.push('/'); return }

        setCompanyId(memberData.company_id)

        // Set Subscription Tier & Custom Limits
        const tier = (memberData.company as any)?.subscription_tier || 'starter'
        const customLimit = (memberData.company as any)?.custom_projects_limit
        setSubscriptionTier(tier)
        setCustomProjectsLimit(customLimit)

        // Fetch Plan Limit dynamically
        const { data: planData } = await supabase
            .from('subscription_plans')
            .select('max_projects')
            .eq('id', tier)
            .single()

        if (planData) {
            setMaxProjectsLimit(planData.max_projects)
        }

        const projectsData = await getProjectsByCompany(memberData.company_id)

        const projectsWithStats = await Promise.all(
            projectsData.map(async (project) => {
                // Get members count
                const { count } = await supabase
                    .from('members')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', project.id)

                // Get current week if project has start_date configured
                let currentWeek: string | null = null

                const { data: projectData } = await supabase
                    .from('projects')
                    .select('start_date')
                    .eq('id', project.id)
                    .single()

                if (projectData?.start_date) {
                    const { data: weekData } = await supabase
                        .rpc('calculate_project_week', {
                            p_project_id: project.id,
                            p_date: new Date().toISOString().split('T')[0]
                        })

                    currentWeek = weekData ? `Semana ${weekData}` : null
                }

                return {
                    ...project,
                    members_count: count || 0,
                    current_week: currentWeek
                }
            })
        )

        setProjects(projectsWithStats)
        setIsLoading(false)
    }

    function handleCreateClick() {
        // PRIORITY: Custom Override > Plan Limit from DB > Default Fallback
        const limit = customProjectsLimit ?? (maxProjectsLimit || 1)

        if (projects.length >= limit) {
            setLimitModalOpen(true)
        } else {
            router.push('/founder/projects/new')
        }
    }

    function handleDeleteSuccess() {
        setDeleteModal(null)
        // Reload projects after deletion
        setIsLoading(true)
        loadProjects()
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    // Determine current limit for display
    const currentLimit = customProjectsLimit ?? (maxProjectsLimit || 1)

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Mis Proyectos</h1>
                </div>
                <div className="dashboard-header-right">
                    <span className={`project-count-badge ${projects.length >= currentLimit ? 'limit-reached' : ''}`}>
                        {projects.length} / {currentLimit} Proyectos
                    </span>
                    <p className="dashboard-subtitle">Gestiona los proyectos de tu empresa</p>
                </div>
            </div>

            {/* ListView Implementation */}
            <div style={{ marginTop: '2rem' }}>
                <ListView
                    schema={ProjectSchema}
                    data={projects}
                    isLoading={isLoading}
                    onCreate={handleCreateClick}
                    onAction={(action: string, item: Project) => {
                        if (action === 'view') router.push(`/founder/projects/${item.id}`)
                        if (action === 'delete') {
                            setDeleteModal({
                                projectId: item.id,
                                projectCode: item.code,
                                projectName: item.name
                            })
                        }
                    }}
                    customActions={[
                        {
                            id: 'delete',
                            label: 'Eliminar',
                            icon: Trash2,
                            color: '#ef4444'
                        }
                    ]}
                />
            </div>

            {/* Delete Modal */}
            {deleteModal && companyId && (
                <DeleteProjectModal
                    projectId={deleteModal.projectId}
                    projectCode={deleteModal.projectCode}
                    projectName={deleteModal.projectName}
                    companyId={companyId}
                    onClose={() => setDeleteModal(null)}
                    onSuccess={handleDeleteSuccess}
                />
            )}

            {/* Limit Reached Modal */}
            {limitModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content limit-reached">
                        <div className="modal-icon-container">
                            <div className="modal-icon-circle danger">
                                <XCircle size={32} color="#f87171" />
                            </div>
                        </div>

                        <h2 className="modal-title danger">Límite del Plan Alcanzado</h2>

                        <p className="modal-text">
                            Tu plan actual <strong style={{ color: 'white', textTransform: 'capitalize' }}>{subscriptionTier}</strong> permite hasta <strong>{maxProjectsLimit}</strong> proyectos.
                        </p>

                        <p className="modal-text secondary">
                            Para crear más proyectos, debes cambiarte a un plan superior o eliminar proyectos antiguos.
                        </p>

                        <div className="modal-actions">
                            <button
                                onClick={() => setLimitModalOpen(false)}
                                className="action-button primary full-width"
                                style={{ background: '#3b82f6', justifyContent: 'center' }}
                            >
                                <ArrowUpCircle size={18} />
                                Contactar para Upgrade
                            </button>
                            <button
                                onClick={() => setLimitModalOpen(false)}
                                className="action-button secondary full-width"
                                style={{ justifyContent: 'center' }}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
