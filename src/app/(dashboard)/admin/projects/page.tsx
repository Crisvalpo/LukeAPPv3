'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'
import { Heading, Text } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

interface ProjectWithStats extends Project {
    members_count: number
    current_week: string | null
}

export default function AdminProjectsListPage() {
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
            .eq('role_id', 'admin') // Ensure we are checking admin role logic
            .maybeSingle() // Use maybeSingle in case generic role mapping differs

        if (!memberData) {
            // Fallback for debugging or mixed roles
            console.error('No admin member record found')
            router.push('/admin')
            return
        }

        const projectsData = await getProjectsByCompany(memberData.company_id)

        // Optimization: If Admin has only one project, go directly there
        if (projectsData.length === 1) {
            router.replace(`/admin/projects/${projectsData[0].id}`)
            return
        }

        const projectsWithStats = await Promise.all(
            projectsData.map(async (project) => {
                // Get members count
                const { count } = await supabase
                    .from('members')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', project.id)

                // Get current week if configured
                let currentWeek: string | null = null
                if (project.start_date) {
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

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                        <Heading level={1} className="tracking-tight text-white">Proyectos Asignados</Heading>
                    </div>
                    <Text size="base" className="text-text-muted font-medium ml-4.5">
                        Gestiona los proyectos de tu empresa
                    </Text>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <ListView
                    schema={ProjectSchema}
                    data={projects}
                    isLoading={isLoading}
                    // No creation or deletion for admins by default
                    onAction={(action: string, item: Project) => {
                        if (action === 'view') router.push(`/admin/projects/${item.id}`)
                    }}
                />
            </div>
        </div>
    )
}
