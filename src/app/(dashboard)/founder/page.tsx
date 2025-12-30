'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FolderKanban, UserPlus, Users, Building2 } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/founder.css'

interface CompanyInfo {
    id: string
    name: string
    slug: string
}

export default function FounderDashboard() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companyData, setCompanyData] = useState<CompanyInfo | null>(null)
    const [projectCount, setProjectCount] = useState(0)

    useEffect(() => {
        loadFounderData()
    }, [])

    async function loadFounderData() {
        const supabase = createClient()

        // Get current user's company
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

        // Get member info to find company
        const { data: memberData } = await supabase
            .from('members')
            .select('company_id, companies(id, name, slug)')
            .eq('user_id', user.id)
            .in('role_id', ['founder', 'admin'])
            .limit(1)
            .maybeSingle()

        if (!memberData || !memberData.companies) {
            router.push('/')
            return
        }

        setCompanyData(memberData.companies as unknown as CompanyInfo)

        // Get projects count
        const { count } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', memberData.company_id)

        setProjectCount(count || 0)
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (!companyData) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>No tienes acceso a este dashboard</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Dashboard Founder</h1>
                </div>
                <p className="dashboard-subtitle">Gestiona tu empresa y proyectos</p>
            </div>

            {/* Company Card */}
            <div className="company-header-card">
                <div className="company-header-content">
                    <div className="company-header-icon">
                        🏢
                    </div>
                    <div className="company-header-info">
                        <h2 className="company-header-name">{companyData.name}</h2>
                        <p className="company-header-role">Tu Empresa</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            {projectCount === 0 ? (
                /* Empty State - No Projects */
                <div className="empty-state-container">
                    <div className="empty-state-icon">📁</div>
                    <h2 className="empty-state-title">¡Bienvenido!</h2>
                    <p className="empty-state-description">
                        Comienza creando tu primer proyecto para {companyData.name}.
                        Podrás invitar administradores y gestionar tu equipo una vez tengas proyectos activos.
                    </p>
                    <button
                        onClick={() => router.push('/founder/projects/new')}
                        className="empty-state-button"
                    >
                        🚀 Crear Mi Primer Proyecto
                    </button>
                </div>
            ) : (
                /* Quick Actions Grid */
                <div className="quick-actions-grid">
                    {/* Create Project */}
                    <div
                        className="quick-action-card primary"
                        onClick={() => router.push('/founder/projects/new')}
                    >
                        <div className="quick-action-icon">
                            <FolderKanban size={24} color="#60a5fa" />
                        </div>
                        <h3 className="quick-action-title">Crear Proyecto</h3>
                        <p className="quick-action-description">
                            Crea un nuevo proyecto para gestionar operaciones
                        </p>
                        <span className="quick-action-badge">Acción Principal</span>
                    </div>

                    {/* Manage Projects */}
                    <div
                        className="quick-action-card"
                        onClick={() => router.push('/founder/projects')}
                    >
                        <div className="quick-action-icon">
                            <FolderKanban size={24} color="#60a5fa" />
                        </div>
                        <h3 className="quick-action-title">Mis Proyectos</h3>
                        <p className="quick-action-description">
                            Gestiona tus {projectCount} proyecto{projectCount !== 1 ? 's' : ''}
                        </p>
                    </div>



                    {/* Company Settings */}
                    <div
                        className="quick-action-card"
                        onClick={() => router.push('/founder/company')}
                    >
                        <div className="quick-action-icon">
                            <Building2 size={24} color="#c084fc" />
                        </div>
                        <h3 className="quick-action-title">Configuración</h3>
                        <p className="quick-action-description">
                            Edita información de {companyData.name}
                        </p>
                    </div>

                    {/* Roles Management */}
                    <div
                        className="quick-action-card"
                        onClick={() => router.push('/founder/settings/roles')}
                    >
                        <div className="quick-action-icon">
                            <Users size={24} color="#f472b6" />
                        </div>
                        <h3 className="quick-action-title">Roles y Permisos</h3>
                        <p className="quick-action-description">
                            Gestiona roles funcionales y accesos
                        </p>
                    </div>


                </div>
            )}
        </div>
    )
}
