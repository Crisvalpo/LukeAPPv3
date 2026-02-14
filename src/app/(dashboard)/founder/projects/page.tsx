'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, XCircle, ArrowUpCircle } from 'lucide-react'

import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'
import DeleteProjectModal from '@/components/modals/DeleteProjectModal'
// Styles migrated to Tailwind v4
// Styles migrated to Tailwind v4
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { SubscriptionTierType } from '@/types'

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
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    // Determine current limit for display
    const currentLimit = customProjectsLimit ?? (maxProjectsLimit || 1)

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="text-white tracking-tight">
                            Mis Proyectos
                        </Heading>
                    </div>
                    <Text size="base" className="text-slate-400 font-medium ml-4.5">
                        Gestiona los proyectos de tu empresa
                    </Text>
                </div>

                <div className="flex items-center gap-4 ml-4 md:ml-0">
                    <div className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all
                        ${projects.length >= currentLimit
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                    `}>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {projects.length} / {currentLimit} Proyectos
                    </div>
                    <Button
                        onClick={handleCreateClick}
                        disabled={projects.length >= currentLimit}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 active:scale-95 transition-all"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Proyecto
                    </Button>
                </div>
            </div>

            {/* ListView Implementation - Premium Container */}
            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <ListView
                    schema={ProjectSchema}
                    data={projects}
                    isLoading={isLoading}
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
                    hideHeader={true}
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

            {/* Limit Reached Modal - Premium Utility Style */}
            {limitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-bg-surface-1 border border-white/10 rounded-2xl p-8 shadow-2xl transform animate-in zoom-in-95 duration-200">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <XCircle size={32} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-4 tracking-tight">
                            Límite del Plan Alcanzado
                        </h2>

                        <div className="space-y-4 text-center mb-8">
                            <p className="text-slate-300 leading-relaxed">
                                Tu plan actual <strong className="text-white capitalize px-2 py-0.5 bg-white/5 rounded border border-white/10 font-bold">{subscriptionTier}</strong> permite hasta <strong className="text-brand-primary text-lg">{maxProjectsLimit}</strong> proyectos.
                            </p>
                            <p className="text-sm text-slate-400 italic">
                                Para crear más proyectos, debes cambiarte a un plan superior o eliminar proyectos antiguos.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => setLimitModalOpen(false)}
                                className="w-full justify-center bg-brand-primary hover:bg-brand-primary/90 text-white h-11"
                            >
                                <ArrowUpCircle className="mr-2 h-4 w-4" />
                                Contactar para Upgrade
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setLimitModalOpen(false)}
                                className="w-full justify-center text-slate-400 hover:text-white hover:bg-white/5 h-10 font-medium"
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
