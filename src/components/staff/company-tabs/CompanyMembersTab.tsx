'use client'

import { useState, useEffect } from 'react'
import UsersList from '@/components/users/UsersList'
import { getMembersByCompany, deleteMember } from '@/services/members'

interface UIMember {
    id: string
    user_id: string
    email: string
    role_id: string
    project?: { name: string; code: string } | null
    created_at: string
}

interface CompanyMembersTabProps {
    companyId: string
}

export default function CompanyMembersTab({ companyId }: CompanyMembersTabProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [members, setMembers] = useState<UIMember[]>([])

    useEffect(() => {
        loadCompanyMembers()
    }, [companyId])

    async function loadCompanyMembers() {
        setIsLoading(true)
        const data = await getMembersByCompany(companyId)

        const formattedMembers: UIMember[] = data.map(m => ({
            id: m.id,
            user_id: m.user_id,
            role_id: m.role_id,
            email: m.user?.email || 'N/A',
            project: m.project,
            created_at: m.created_at
        }))

        setMembers(formattedMembers)
        setIsLoading(false)
    }

    async function handleDeleteMember(memberId: string) {
        const member = members.find(m => m.id === memberId)
        if (member?.role_id === 'super_admin') {
            alert('❌ No se puede eliminar al Super Admin desde la interfaz.')
            return
        }

        if (!confirm('¿Estás seguro de eliminar este usuario de la empresa? Perderá todos sus accesos.')) {
            return
        }

        const result = await deleteMember(memberId)

        if (result.success) {
            loadCompanyMembers()
        } else {
            alert(result.message)
        }
    }

    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Cargando miembros...</div>
    }

    return (
        <UsersList
            users={members}
            context="staff"
            onDelete={handleDeleteMember}
        />
    )
}
