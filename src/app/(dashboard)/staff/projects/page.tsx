'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectsByCompany, type Project } from '@/services/projects'
import { ListView } from '@/components/views/ListView'
import { ProjectSchema } from '@/schemas/project'
import { Building2, ChevronRight } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'

interface Company {
    id: string
    name: string
    code: string
}

interface ProjectWithStats extends Project {
    members_count: number
    current_week?: string
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
            // Filter out system companies like lukeapp-hq
            const filteredCompanies = data.filter(c => c.slug !== 'lukeapp-hq')
            setCompanies(filteredCompanies.map(c => ({ id: c.id, name: c.name, code: c.slug })))
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
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in text-text-main">
            {/* Header */}
            <div className="space-y-2 relative group">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight text-white">Proyectos Globales</Heading>
                </div>
                <Text size="base" className="text-text-muted text-sm font-medium ml-4.5">
                    Auditoría y revisión de proyectos por empresa.
                </Text>
            </div>

            {/* COMPANY SELECTOR */}
            {!selectedCompany ? (
                <div className="max-w-3xl mx-auto w-full">
                    <div className="bg-bg-surface-1 border border-glass-border rounded-2xl p-8 shadow-2xl text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Building2 size={48} className="text-brand-primary mx-auto mb-4 opacity-80" />
                        <Heading level={2} className="text-2xl font-bold text-white mb-2">
                            Selecciona una Empresa
                        </Heading>
                        <Text className="text-text-muted">
                            Elige la empresa para ver sus proyectos activos e históricos.
                        </Text>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companies.map(company => (
                            <button
                                key={company.id}
                                onClick={() => setSelectedCompany(company)}
                                className="group flex flex-col items-start p-6 bg-bg-surface-1/40 hover:bg-bg-surface-1 border border-glass-border hover:border-brand-primary/50 rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-brand-primary/10"
                            >
                                <div className="flex justify-between w-full items-center mb-2">
                                    <span className="font-bold text-text-main text-lg group-hover:text-brand-primary transition-colors">{company.name}</span>
                                    <ChevronRight size={18} className="text-text-dim group-hover:translate-x-1 transition-transform" />
                                </div>
                                <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                    {company.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* CONTEXT BAR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl mb-8">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-12 h-12 flex items-center justify-center bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/20 shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">Empresa Seleccionada</div>
                                <div className="text-white font-bold text-xl">{selectedCompany.name}</div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setSelectedCompany(null)}
                            variant="secondary"
                            className="w-full sm:w-auto font-bold"
                        >
                            Cambiar Empresa
                        </Button>
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
