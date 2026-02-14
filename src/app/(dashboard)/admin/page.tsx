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
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight text-white">Dashboard Admin</Heading>
                </div>
                <Text size="base" className="text-text-muted font-medium ml-4.5">
                    Gestiona las operaciones de tu proyecto
                </Text>
            </div>

            {/* Project Card */}
            <div
                className="company-header-card"
                style={{ marginBottom: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => router.push(`/admin/projects/${projectData.id}?tab=details&action=edit`)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
                <div className="company-header-content">
                    <div className="company-header-icon">
                        📁
                    </div>
                    <div className="company-header-info">
                        <h2 className="company-header-name">{projectData.name}</h2>
                        <p className="company-header-role" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(96, 165, 250, 0.1)',
                                border: '1px solid rgba(96, 165, 250, 0.3)',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                color: '#60a5fa'
                            }}>
                                {projectData.code}
                            </span>
                            • {projectData.company_name}
                            {projectData.current_week && (
                                <>
                                    <span style={{ color: '#64748b' }}>•</span>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'rgba(168, 85, 247, 0.1)',
                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#c084fc'
                                    }}>
                                        {projectData.current_week}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            < div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }
            }>
                {/* Members Count */}
                < div className="company-form-container" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{
                            width: '3rem',
                            height: '3rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Users size={24} color="#4ade80" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                Miembros del Equipo
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                {stats.totalMembers}
                            </div>
                        </div>
                    </div>
                </div >

                {/* Project Status */}
                < div className="company-form-container" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{
                            width: '3rem',
                            height: '3rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BarChart3 size={24} color="#60a5fa" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                Estado del Proyecto
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                                {projectData.status === 'active' && '🟢 Activo'}
                                {projectData.status === 'planning' && '🔵 Planificación'}
                                {projectData.status === 'on_hold' && '🟠 En Pausa'}
                                {projectData.status === 'completed' && '✅ Completado'}
                                {projectData.status === 'cancelled' && '🔴 Cancelado'}
                            </div>
                        </div>
                    </div>
                </div >
            </div >

            {/* Quick Actions */}
            <div className="quick-actions-grid">
                {/* Workforce Management */}
                <div
                    className="quick-action-card"
                    onClick={() => router.push(`/admin/projects/${projectData.id}?tab=team`)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="quick-action-icon">
                        <Users size={24} color="#4ade80" />
                    </div>
                    <h3 className="quick-action-title">Gestión de Personal</h3>
                    <p className="quick-action-description">
                        Administra turnos, cuadrillas y asistencia
                    </p>
                </div>

                {/* Configuration */}
                < div
                    className="quick-action-card"
                    onClick={() => router.push(`/admin/projects/${projectData.id}?tab=settings`)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="quick-action-icon">
                        <Settings size={24} color="#94a3b8" />
                    </div>
                    <h3 className="quick-action-title">Configuración</h3>
                    <p className="quick-action-description">
                        Configura parámetros del proyecto
                    </p>
                </div >
            </div >

            {/* Project Info */}
            {
                projectData.description && (
                    <div className="company-form-container" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>
                            Descripción del Proyecto
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.6' }}>
                            {projectData.description}
                        </p>
                    </div>
                )
            }
        </div >
    )
}
