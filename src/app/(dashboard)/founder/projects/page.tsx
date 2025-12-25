'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'
import '@/styles/dashboard.css'

interface ProjectWithStats extends Project {
    members_count: number
}

export default function ProjectsListPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [projects, setProjects] = useState<ProjectWithStats[]>([])

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

        const projectsData = await getProjectsByCompany(memberData.company_id)

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
        setIsLoading(false)
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
                    }}
                />
            </div>
        </div>
    )
}
