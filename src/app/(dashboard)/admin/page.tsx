'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectById, type Project } from '@/services/projects'
import { FolderKanban, Users, Settings, BarChart3 } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

interface ProjectInfo extends Project {
    company_name: string
    current_week?: string | null
}

export default function AdminDashboard() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [projectData, setProjectData] = useState<ProjectInfo | null>(null)
    const [stats, setStats] = useState({
        totalMembers: 0
    })

    useEffect(() => {
        loadAdminData()
    }, [])

    async function loadAdminData() {
        const supabase = createClient()

        // Get current user's project
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

        // Get member info to find project
        const { data: memberData } = await supabase
            .from('members')
            .select(`
                project_id,
                projects (
                    id,
                    name,
                    code,
                    description,
                    status,
                    company_id,
                    start_date,
                    week_end_day,
                    created_at,
                    updated_at,
                    companies (
                        name
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('role_id', 'admin')
            .single()

        if (!memberData || !memberData.projects) {
            router.push('/')
            return
        }

        const project = memberData.projects as any
        let currentWeek: string | null = null

        // Calculate project week if start_date is set
        if (project.start_date) {
            const { data: weekData } = await supabase
                .rpc('calculate_project_week', {
                    p_project_id: project.id,
                    p_date: new Date().toISOString().split('T')[0]
                })
            currentWeek = weekData ? `Semana ${weekData}` : null
        }

        const projectInfo: ProjectInfo = {
            ...project,
            company_name: project.companies?.name || 'N/A',
            current_week: currentWeek
        }

        setProjectData(projectInfo)

        // Get members count
        const { count } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)

        setStats({
            totalMembers: count || 0
        })

        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">Cargando...</p>
            </div>
        )
    }

    if (!projectData) {
        return (
            <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
                <p className="text-white text-center">No tienes acceso a este dashboard</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-12 animate-fade-in px-4">
            {/* 1. Header & Hero Section */}
            <div className="relative overflow-hidden p-8 rounded-[32px] bg-gradient-to-br from-[hsl(220,15%,14%)] to-transparent border border-white/5 shadow-2xl">
                {/* Decorative background effects */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                            <Heading level={1} className="text-xl font-bold tracking-tight text-white uppercase">
                                Dashboard Admin
                            </Heading>
                        </div>

                        <div className="ml-4.5">
                            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                                {projectData.name}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded font-mono text-xs text-indigo-400 font-bold tracking-wider">
                                    {projectData.code}
                                </span>
                                <Text size="sm" variant="dim" className="font-bold uppercase tracking-wider">
                                    {projectData.company_name}
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-4">
                            {projectData.current_week && (
                                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                    <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">Semana Actual</div>
                                    <div className="text-lg font-bold text-white">{projectData.current_week}</div>
                                </div>
                            )}
                            <div className={`px-4 py-2 rounded-xl border ${projectData.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                    projectData.status === 'planning' ? 'bg-blue-500/10 border-blue-500/20' :
                                        'bg-orange-500/10 border-orange-500/20'
                                }`}>
                                <div className="text-[10px] uppercase tracking-wider mb-0.5 font-bold opacity-60">Status</div>
                                <div className={`text-lg font-bold ${projectData.status === 'active' ? 'text-emerald-400' :
                                        projectData.status === 'planning' ? 'text-blue-400' :
                                            'text-orange-400'
                                    }`}>
                                    {projectData.status === 'active' && 'Activo'}
                                    {projectData.status === 'planning' && 'Planificación'}
                                    {projectData.status === 'on_hold' && 'Pausa'}
                                    {projectData.status === 'completed' && 'Cerrado'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {/* Team Stats */}
                <div className="group relative p-8 rounded-3xl bg-[rgba(255,255,255,0.02)] border border-white/5 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl group-hover:scale-105 transition-transform duration-500">
                            <Users size={32} />
                        </div>
                        <div>
                            <Text size="xs" variant="dim" className="font-bold uppercase tracking-widest mb-1">
                                Miembros del Equipo
                            </Text>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white tracking-tight">
                                    {stats.totalMembers}
                                </span>
                                <Text size="xs" variant="dim" className="font-bold uppercase tracking-widest">Activos</Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Overview */}
                <div className="group relative p-8 rounded-3xl bg-[rgba(255,255,255,0.02)] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-xl group-hover:scale-105 transition-transform duration-500">
                            <BarChart3 size={32} />
                        </div>
                        <div>
                            <Text size="xs" variant="dim" className="font-bold uppercase tracking-widest mb-1">
                                Estado del Proyecto
                            </Text>
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full animate-pulse-glow ${projectData.status === 'active' ? 'bg-emerald-400' : 'bg-blue-400'
                                    }`} />
                                <span className="text-2xl font-bold text-white tracking-tight uppercase">
                                    {projectData.status === 'active' ? 'Operativo' : 'Preparación'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Global Actions */}
            <div className="pt-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-white/20 rounded-full" />
                    <Heading level={3} className="text-sm font-bold text-text-muted uppercase tracking-widest">Acciones de Gestión</Heading>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Action Card 1 */}
                    <button
                        onClick={() => router.push(`/admin/projects/${projectData.id}?tab=team`)}
                        className="group relative flex items-center gap-6 p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all">
                            <Users size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors tracking-tight">Gestión de Personal</h4>
                            <p className="text-sm text-text-muted font-medium leading-relaxed">Administra turnos, cuadrillas y asistencia del equipo.</p>
                        </div>
                    </button>

                    {/* Action Card 2 */}
                    <button
                        onClick={() => router.push(`/admin/projects/${projectData.id}?tab=settings`)}
                        className="group relative flex items-center gap-6 p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors tracking-tight">Configuración</h4>
                            <p className="text-sm text-text-muted font-medium leading-relaxed">Configura parámetros globales y workflows del proyecto.</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* 4. Project Details Footer */}
            {projectData.description && (
                <div className="relative p-8 rounded-3xl bg-[rgba(255,255,255,0.01)] border border-white/5 mt-8">
                    <Text size="xs" variant="dim" className="font-bold uppercase tracking-widest mb-4">Información Adicional</Text>
                    <p className="text-sm text-text-muted leading-relaxed max-w-3xl font-medium">
                        {projectData.description}
                    </p>
                </div>
            )}
        </div>
    )
}
