'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'

interface ProjectWithStats extends Project {
    members_count: number
    current_week?: string
}

interface CompanyProjectsTabProps {
    companyId: string
}

export default function CompanyProjectsTab({ companyId }: CompanyProjectsTabProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [projects, setProjects] = useState<ProjectWithStats[]>([])

    useEffect(() => {
        loadCompanyProjects()
    }, [companyId])

    async function loadCompanyProjects() {
        setIsLoading(true)
        const supabase = createClient()
        // Get projects
        const projectsData = await getProjectsByCompany(companyId)

        // Get members stats
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
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Cargando proyectos...</div>
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                {/* Future: "Create Project" button could go here, pre-filling company */}
            </div>

            <ListView
                schema={ProjectSchema}
                data={projects}
                onAction={(action: string, item: Project) => {
                    if (action === 'view') router.push(`/staff/projects/${item.id}`)
                }}
            />
        </div>
    )
}
