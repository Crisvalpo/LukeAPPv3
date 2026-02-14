'use client'

import { useState, useEffect } from 'react'
import UsersList from '@/components/users/UsersList'
import { getMembersByCompany, deleteMember } from '@/services/members'
import { Icons } from '@/components/ui/Icons'

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
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Icons.Refresh size={24} className="text-blue-500 animate-spin" />
                </div>
                <p className="text-slate-400 font-medium tracking-wide">Cargando nómina de personal...</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UsersList
                users={members}
                context="staff"
                onDelete={handleDeleteMember}
            />
        </div>
    )
}
