'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getGlobalStats, getRecentCompanies, type GlobalStats, type RecentCompany } from '@/services/staff'
import { getPendingInvitations, type Invitation } from '@/services/invitations'
import { Building2, Users, FolderKanban, Mail } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { Heading } from '@/components/ui/Typography'
import DashboardWidget from '@/components/dashboard/DashboardWidget'

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
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-text-dim animate-pulse">Cargando dashboard...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="space-y-2 relative group">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="text-white tracking-tight">Vista General</Heading>
                </div>
                <p className="text-text-muted text-sm font-medium ml-4.5">
                    Panel de control global del sistema <span className="text-brand-primary/80 font-bold">(Staff)</span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Empresas"
                    value={stats.totalCompanies}
                    icon={Building2}
                    color="blue"
                    onClick={() => router.push('/staff/companies')}
                    buttonText="Gestionar"
                />

                <StatCard
                    title="Proyectos"
                    value={stats.totalProjects}
                    icon={FolderKanban}
                    color="purple"
                    onClick={() => router.push('/staff/projects')}
                    buttonText="Auditar"
                />

                <StatCard
                    title="Usuarios"
                    value={stats.totalUsers}
                    icon={Users}
                    color="green"
                    onClick={() => router.push('/staff/users')}
                    buttonText="Personal"
                />

                <StatCard
                    title="Pendientes"
                    value={stats.pendingInvitations}
                    icon={Mail}
                    color="orange"
                    onClick={() => router.push('/staff/invitations')}
                    buttonText="Revisar"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Companies Widget */}
                <DashboardWidget
                    title="Empresas Recientes"
                    onAction={() => router.push('/staff/companies')}
                    isEmpty={recentCompanies.length === 0}
                    emptyMessage="No hay empresas registradas"
                >
                    <table className="w-full text-left text-sm">
                        <thead className="text-[10px] uppercase tracking-widest text-text-dim font-bold border-b border-glass-border">
                            <tr>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-4 py-4">Proyectos</th>
                                <th className="px-4 py-4">Miembros</th>
                                <th className="px-6 py-4 text-right">Creada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentCompanies.map((company) => (
                                <tr
                                    key={company.id}
                                    onClick={() => router.push(`/staff/companies/${company.id}`)}
                                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 font-bold text-text-main group-hover:text-brand-primary transition-colors">
                                        {company.name}
                                    </td>
                                    <td className="px-4 py-4 text-text-muted">{company.projects_count}</td>
                                    <td className="px-4 py-4 text-text-muted">{company.members_count}</td>
                                    <td className="px-6 py-4 text-right text-text-dim tabular-nums">
                                        {new Date(company.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DashboardWidget>

                {/* Pending Invitations Widget */}
                {pendingInvitations.length > 0 && (
                    <DashboardWidget
                        title="Invitaciones"
                        onAction={() => router.push('/staff/invitations')}
                    >
                        <table className="w-full text-left text-sm">
                            <thead className="text-[10px] uppercase tracking-widest text-text-dim font-bold border-b border-glass-border">
                                <tr>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-4 py-4">Rol</th>
                                    <th className="px-6 py-4 text-right">Creada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pendingInvitations.map((invitation) => (
                                    <tr key={invitation.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-text-main italic">{invitation.email}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold border border-brand-primary/20">
                                                {invitation.role_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-text-dim tabular-nums">
                                            {new Date(invitation.created_at).toLocaleDateString('es-ES')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DashboardWidget>
                )}
            </div>
        </div>
    )
}
