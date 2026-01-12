'use client'

import { useState, useEffect } from 'react'
import { createInvitation, getPendingInvitations, revokeInvitation, type Invitation } from '@/services/invitations'
import InvitationManager from '@/components/invitations/InvitationManager'

interface CompanyInvitationsTabProps {
    companyId: string
    companyName: string
    companySlug: string
}

export default function CompanyInvitationsTab({ companyId, companyName, companySlug }: CompanyInvitationsTabProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [invitations, setInvitations] = useState<Invitation[]>([])

    useEffect(() => {
        loadData()
    }, [companyId])

    async function loadData(silent = false) {
        if (!silent) setIsLoading(true)
        const invitationsData = await getPendingInvitations(companyId)
        setInvitations(invitationsData)
        if (!silent) setIsLoading(false)
    }

    async function handleRevoke(id: string) {
        if (!confirm('¿Eliminar esta invitación?')) return

        const invite = invitations.find(i => i.id === id)
        const email = invite ? invite.email : undefined

        await revokeInvitation(id, email)
        await loadData(true)
    }

    async function handleInvite(data: { email: string; project_id?: string; role_id: string }) {
        // Staff always invites FOUNDERS (or members), project_id is ignored/null
        // Use logic from original page: if HQ -> Super Admin, else -> Founder
        const targetRole = companySlug === 'lukeapp-hq' ? 'super_admin' : 'founder'

        const result = await createInvitation({
            email: data.email,
            role_id: targetRole as any,
            company_id: companyId,
            project_id: undefined
        })

        if (result.success) {
            await loadData(true)
        }

        return result
    }

    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Cargando invitaciones...</div>
    }

    return (
        <InvitationManager
            companyId={companyId}
            projects={[]}
            invitations={invitations}
            companyName={companyName}
            requireProject={false}
            roleOptions={companySlug === 'lukeapp-hq' ? [
                { value: 'super_admin', label: 'Super Admin', description: 'Acceso total a la plataforma y todos sus recursos.' }
            ] : [
                { value: 'founder', label: 'Fundador / Dueño', description: 'Acceso total a la empresa, facturación y gestión de proyectos.' }
            ]}
            onInvite={handleInvite}
            onRevoke={handleRevoke}
        />
    )
}
