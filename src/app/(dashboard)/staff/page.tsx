'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getGlobalStats, getRecentCompanies, type GlobalStats, type RecentCompany } from '@/services/staff'
import { getPendingInvitations, type Invitation } from '@/services/invitations'
import { Building2, Users, FolderKanban, Mail } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import DashboardWidget from '@/components/dashboard/DashboardWidget'
import '@/styles/dashboard.css'
import '@/styles/companies.css'
import '@/styles/invitations.css'
import '@/styles/staff-dashboard.css'
import '@/styles/tables.css'

export default function StaffDashboard() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<GlobalStats>({
        totalCompanies: 0,
        totalProjects: 0,
        totalUsers: 0,
        pendingInvitations: 0
    })
    const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([])
    const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([])

    useEffect(() => {
        loadDashboardData()
    }, [])

    async function loadDashboardData() {
        setIsLoading(true)

        const [statsData, companiesData, invitationsData] = await Promise.all([
            getGlobalStats(),
            getRecentCompanies(5),
            getPendingInvitations()
        ])

        setStats(statsData)
        // Filter out the system company 'lukeapp-hq'
        setRecentCompanies(companiesData.filter(c => c.slug !== 'lukeapp-hq'))
        setPendingInvitations(invitationsData.slice(0, 5)) // Last 5
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p className="loading-text">Cargando...</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Vista General</h1>
                </div>
                <p className="dashboard-subtitle">Panel de control global del sistema (Staff)</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    title="Empresas"
                    value={stats.totalCompanies}
                    icon={Building2}
                    color="blue"
                    onClick={() => router.push('/staff/companies')}
                    buttonText="Gestionar Empresas"
                />

                <StatCard
                    title="Proyectos"
                    value={stats.totalProjects}
                    icon={FolderKanban}
                    color="purple"
                    onClick={() => router.push('/staff/projects')}
                    buttonText="Auditar Proyectos"
                />

                <StatCard
                    title="Usuarios"
                    value={stats.totalUsers}
                    icon={Users}
                    color="green"
                    onClick={() => router.push('/staff/users')}
                    buttonText="Ver Personal Global"
                />

                <StatCard
                    title="Pendientes"
                    value={stats.pendingInvitations}
                    icon={Mail}
                    color="orange"
                    onClick={() => router.push('/staff/invitations')}
                    buttonText="Revisar Invitaciones"
                />
            </div>

            {/* Recent Companies Widget */}
            <DashboardWidget
                title="Empresas Recientes"
                onAction={() => router.push('/staff/companies')}
                isEmpty={recentCompanies.length === 0}
                emptyMessage="No hay empresas registradas"
            >
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Proyectos</th>
                                <th>Miembros</th>
                                <th>Creada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCompanies.map((company) => (
                                <tr
                                    key={company.id}
                                    onClick={() => router.push(`/staff/companies/${company.id}`)}
                                    className="clickable-row"
                                >
                                    <td>{company.name}</td>
                                    <td>{company.projects_count}</td>
                                    <td>{company.members_count}</td>
                                    <td>
                                        <span className="company-date">
                                            {new Date(company.created_at).toLocaleDateString('es-ES')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DashboardWidget>

            {/* Pending Invitations Widget */}
            {pendingInvitations.length > 0 && (
                <DashboardWidget
                    title="Invitaciones Pendientes"
                    onAction={() => router.push('/staff/invitations')}
                >
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Empresa</th>
                                    <th>Creada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingInvitations.map((invitation) => (
                                    <tr key={invitation.id}>
                                        <td>
                                            <span className="invitation-email">{invitation.email}</span>
                                        </td>
                                        <td>
                                            <span className="invitation-role-badge">
                                                {invitation.role_id}
                                            </span>
                                        </td>
                                        <td>{(invitation as any).company?.name || 'N/A'}</td>
                                        <td>
                                            <span className="invitation-date">
                                                {new Date(invitation.created_at).toLocaleDateString('es-ES')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DashboardWidget>
            )}
        </div>
    )
}
