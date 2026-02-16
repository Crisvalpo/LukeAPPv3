'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UsersList from '@/components/users/UsersList'
import { Building2, ChevronRight, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getMembersByCompany, deleteMember } from '@/services/members'
import { Heading, Text } from '@/components/ui/Typography'
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/Icons'

interface Company {
    id: string
    name: string
    code: string
}

interface UIMember {
    id: string
    user_id: string
    email: string
    role_id: string
    project?: { name: string; code: string } | null
    created_at: string
}

export default function StaffUsersPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
    const [members, setMembers] = useState<UIMember[]>([])

    useEffect(() => {
        loadCompanies()
    }, [])

    useEffect(() => {
        if (selectedCompany) {
            loadCompanyMembers(selectedCompany.id)
        }
    }, [selectedCompany])

    async function loadCompanies() {
        const supabase = createClient()
        const { data } = await supabase
            .from('companies')
            .select('id, name, slug')
            .order('name')

        if (data) {
            setCompanies(data.map(c => ({ id: c.id, name: c.name, code: c.slug })))
        }
        setIsLoading(false)
    }

    async function loadCompanyMembers(companyId: string) {
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

        // Block deletion of Ghost Admin definitively
        if (member?.email === 'cristianluke@gmail.com') {
            alert('❌ CRITICAL_SECURITY: Este usuario es un Restaurador del sistema y no puede ser eliminado.')
            return
        }

        if (!confirm('¿Estás seguro de eliminar este usuario de la empresa? Perderá todos sus accesos.')) {
            return
        }

        const result = await deleteMember(memberId)

        if (result.success) {
            if (selectedCompany) loadCompanyMembers(selectedCompany.id)
        } else {
            alert(result.message)
        }
    }

    if (isLoading && !selectedCompany) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-blue-500/20">
                    <Icons.Refresh size={48} className="text-blue-500 animate-spin" />
                </div>
                <Text className="text-slate-400 font-medium">Sincronizando base de datos de personal...</Text>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                            <Heading level={1} className="text-white tracking-tight">
                                Usuarios Globales
                            </Heading>
                        </div>
                        <p className="text-slate-400 text-sm font-medium ml-4.5 italic">
                            Administración centralizada de personal y permisos por organización
                        </p>
                    </div>
                </div>
            </div>

            {/* COMPANY SELECTOR */}
            {!selectedCompany ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-10 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/10 transition-colors duration-700" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 -mb-32 group-hover:bg-indigo-500/10 transition-colors duration-700" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 transform group-hover:scale-110 transition-transform duration-500">
                                <Building2 size={36} className="text-white" />
                            </div>
                            <Heading level={2} className="text-3xl font-bold text-white mb-3">
                                Selecciona una Empresa
                            </Heading>
                            <Text className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
                                Para gestionar el personal, primero elige la organización que deseas auditar.
                            </Text>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map(company => (
                            <button
                                key={company.id}
                                onClick={() => setSelectedCompany(company)}
                                className="group relative p-8 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all duration-500 text-left overflow-hidden shadow-xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors duration-300">
                                            <Building2 size={24} />
                                        </div>
                                        <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                                        {company.name}
                                    </h3>
                                    <span className="inline-block px-3 py-1 rounded-lg bg-white/5 text-[10px] font-mono font-bold text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 uppercase tracking-widest transition-colors">
                                        {company.code}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* CONTEXT BAR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl backdrop-blur-md shadow-xl group/bar">
                        <div className="flex items-center gap-5 w-full sm:w-auto">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transform group-hover/bar:rotate-3 transition-transform">
                                <Building2 size={28} />
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Organización Activa</div>
                                <div className="text-2xl font-black text-white">{selectedCompany.name}</div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setSelectedCompany(null)}
                            variant="secondary"
                            className="w-full sm:w-auto font-bold bg-white/5 hover:bg-white/10 text-white border-white/10 group/btn"
                        >
                            <ArrowLeft size={18} className="mr-2 group-hover/btn:-translate-x-1 transition-transform" />
                            Cambiar Empresa
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <Users size={24} className="text-blue-500" />
                            <Heading level={3} className="text-xl font-bold text-white">Nómina de Personal</Heading>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 rounded-2xl border border-white/5">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                                    <Icons.Refresh size={24} className="text-blue-500 animate-spin" />
                                </div>
                                <p className="text-slate-400 font-medium">Buscando miembros...</p>
                            </div>
                        ) : (
                            <UsersList
                                users={members}
                                context="staff"
                                onDelete={handleDeleteMember}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
