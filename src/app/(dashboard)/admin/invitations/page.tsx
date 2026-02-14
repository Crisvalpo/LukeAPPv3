'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createInvitation, getPendingInvitations, revokeInvitation, type Invitation } from '@/services/invitations'
import InvitationManager from '@/components/invitations/InvitationManager'
import { Heading, Text } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

export default function AdminInvitationsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [projectId, setProjectId] = useState<string | null>(null)
    const [projectName, setProjectName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [invitations, setInvitations] = useState<Invitation[]>([])

    // Admin can only invite lower-level roles
    const ADMIN_ROLE_OPTIONS = [
        { value: 'supervisor', label: 'Supervisor de Terreno', description: 'Gestión técnica y supervisión de cuadrillas en terreno.' },
        { value: 'worker', label: 'Trabajador / Operario', description: 'Acceso básico para visualización y tareas asignadas.' }
    ]

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        // Get admin's project and company info
        const { data: memberData } = await supabase
            .from('members')
            .select(`
                project_id,
                company_id,
                projects(name),
                companies(name)
            `)
            .eq('user_id', user.id)
            .eq('role_id', 'admin')
            .single()

        if (!memberData) { router.push('/'); return }

        setCompanyId(memberData.company_id)
        setProjectId(memberData.project_id)
        setProjectName((memberData.projects as any)?.name || 'Proyecto')
        setCompanyName((memberData.companies as any)?.name || 'Empresa')

        // Load invitations for this project
        await refreshData(memberData.company_id, memberData.project_id)
        setIsLoading(false)
    }

    async function refreshData(compId: string, projId: string) {
        // Get invitations for this specific project
        const allInvitations = await getPendingInvitations(compId)
        // Filter only invitations for this project
        const projectInvitations = allInvitations.filter(inv => inv.project_id === projId)
        setInvitations(projectInvitations)
    }

    async function handleRevoke(id: string) {
        if (!confirm('¿Eliminar esta invitación? El link dejará de funcionar.')) return

        const invite = invitations.find(i => i.id === id)
        const email = invite ? invite.email : undefined

        await revokeInvitation(id, email)
        if (companyId && projectId) await refreshData(companyId, projectId)
    }

    async function handleInvite(data: {
        email: string
        project_id?: string
        role_id: string
        functional_role_id?: string
        job_title?: string
    }) {
        if (!companyId || !projectId) return { success: false, message: 'Error de sesión' }

        const result = await createInvitation({
            email: data.email,
            project_id: projectId,  // Force admin's project
            role_id: data.role_id as any,
            functional_role_id: data.functional_role_id,
            company_id: companyId,
            job_title: data.job_title
        })

        if (result.success) {
            await refreshData(companyId, projectId)
        }

        return result
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
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight text-white">Invitaciones de Personal</Heading>
                </div>
                <Text size="base" className="text-text-muted font-medium ml-4.5">
                    Invita supervisores y trabajadores al proyecto {projectName} • {companyName}
                </Text>
            </div>

            {companyId && (
                <InvitationManager
                    companyId={companyId}
                    projects={[]}  // Admin can't select project, it's auto-assigned
                    invitations={invitations}
                    companyName={companyName}
                    requireProject={false}  // Don't show project selector
                    roleOptions={ADMIN_ROLE_OPTIONS}  // Restricted roles
                    onInvite={handleInvite}
                    onRevoke={handleRevoke}
                />
            )}
        </div>
    )
}
