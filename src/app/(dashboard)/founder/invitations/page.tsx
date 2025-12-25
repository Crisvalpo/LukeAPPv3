'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createInvitation, getPendingInvitations, revokeInvitation, type Invitation } from '@/services/invitations'
import { getProjectsByCompany, type Project } from '@/services/projects'
import InvitationManager from '@/components/invitations/InvitationManager' // Import reusable component
import '@/styles/dashboard.css'

export default function FounderInvitationsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [companyName, setCompanyName] = useState('')
    const [projects, setProjects] = useState<Project[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        // Get founder's company
        const { data: memberData } = await supabase
            .from('members')
            .select('company_id, companies(name)')
            .eq('user_id', user.id)
            .eq('role_id', 'founder')
            .single()

        if (!memberData) { router.push('/'); return }

        setCompanyId(memberData.company_id)
        setCompanyName((memberData.companies as any).name)

        // Load projects and invitations
        await refreshData(memberData.company_id)
        setIsLoading(false)
    }

    async function refreshData(compId: string) {
        const [projectsData, invitationsData] = await Promise.all([
            getProjectsByCompany(compId),
            getPendingInvitations(compId)
        ])
        setProjects(projectsData)
        setInvitations(invitationsData)
    }

    async function handleRevoke(id: string) {
        if (!confirm('¿Eliminar esta invitación? El link dejará de funcionar.')) return
        await revokeInvitation(id)
        if (companyId) await refreshData(companyId)
    }

    async function handleInvite(data: { email: string; project_id: string; role_id: string }) {
        if (!companyId) return { success: false, message: 'Error de sesión' }

        const result = await createInvitation({
            ...data,
            role_id: data.role_id as 'admin',
            company_id: companyId
        })

        if (result.success) {
            await refreshData(companyId)
        }

        return result
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Checking permissions...</p></div>
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Gestión de Invitaciones</h1>
                </div>
                <p className="dashboard-subtitle">Invita administradores a tus proyectos en {companyName}</p>
            </div>

            {/* REUSABLE COMPONENT IN ACTION */}
            <InvitationManager
                projects={projects}
                invitations={invitations}
                companyName={companyName}
                onInvite={handleInvite}
                onRevoke={handleRevoke}
            />
        </div>
    )
}
