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

interface ProjectWithStats extends Project {
    members_count: number
    current_week: string | null
}

export default function ProjectsListPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [projects, setProjects] = useState<ProjectWithStats[]>([])
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [deleteModal, setDeleteModal] = useState<{
        projectId: string
        projectCode: string
        projectName: string
    } | null>(null)

    useEffect(() => {
        loadProjects()
    }, [])

    async function loadProjects() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        const { data: memberData } = await supabase
            .from('members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('role_id', 'founder')
            .single()

        if (!memberData) { router.push('/'); return }

        setCompanyId(memberData.company_id)

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

    function handleDeleteSuccess() {
        setDeleteModal(null)
        // Reload projects after deletion
        setIsLoading(true)
        loadProjects()
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Mis Proyectos</h1>
                </div>
                <p className="dashboard-subtitle">Gestiona los proyectos de tu empresa</p>
            </div>

            {/* ListView Implementation */}
            <div style={{ marginTop: '2rem' }}>
                <ListView
                    schema={ProjectSchema}
                    data={projects}
                    isLoading={isLoading}
                    onCreate={() => router.push('/founder/projects/new')}
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
        </div>
    )
}
