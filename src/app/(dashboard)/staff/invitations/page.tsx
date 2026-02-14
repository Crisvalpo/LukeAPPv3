'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createInvitation, getPendingInvitations, revokeInvitation, type Invitation } from '@/services/invitations'
import InvitationManager from '@/components/invitations/InvitationManager'
import { Building2, ChevronRight } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'

interface Company {
    id: string
    name: string
    code: string // slug
}

export default function StaffInvitationsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companies, setCompanies] = useState<Company[]>([])
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

    const [invitations, setInvitations] = useState<Invitation[]>([])

    useEffect(() => {
        loadCompanies()
    }, [])

    useEffect(() => {
        if (selectedCompany) {
            loadCompanyData(selectedCompany.id)
        }
    }, [selectedCompany])

    async function loadCompanies() {
        const supabase = createClient()
        // Verify staff access
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        // Load all companies
        const { data } = await supabase
            .from('companies')
            .select('id, name, slug')
            .order('name')

        if (data) {
            setCompanies(data.map(c => ({ id: c.id, name: c.name, code: c.slug })))
        }
        setIsLoading(false)
    }

    async function loadCompanyData(companyId: string) {
        // Only load invitations, Staff doesn't need projects to invite founders
        const invitationsData = await getPendingInvitations(companyId)
        setInvitations(invitationsData)
    }

    async function handleRevoke(id: string) {
        if (!confirm('¿Eliminar esta invitación?')) return

        // Find email for cleanup
        const invite = invitations.find(i => i.id === id)
        const email = invite ? invite.email : undefined

        await revokeInvitation(id, email)
        if (selectedCompany) await loadCompanyData(selectedCompany.id)
    }

    async function handleInvite(data: { email: string; project_id?: string; role_id: string }) {
        if (!selectedCompany) return { success: false, message: 'Selecciona una empresa' }

        // Staff always invites FOUNDERS (or members), project_id is ignored/null
        const result = await createInvitation({
            email: data.email,
            role_id: 'founder', // Force role to founder for Staff context
            company_id: selectedCompany.id,
            project_id: undefined
        })

        if (result.success) {
            await loadCompanyData(selectedCompany.id)
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
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in text-text-main">
            {/* Header */}
            <div className="space-y-2 relative group">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight text-white">Centro de Invitaciones</Heading>
                </div>
                <Text size="base" className="text-text-muted text-sm font-medium ml-4.5">
                    Gestión global de accesos para fundadores de empresas.
                </Text>
            </div>

            {/* COMPANY SELECTOR */}
            {!selectedCompany ? (
                <div className="max-w-3xl mx-auto w-full">
                    <div className="bg-bg-surface-1 border border-glass-border rounded-2xl p-8 shadow-2xl text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Building2 size={48} className="text-brand-primary mx-auto mb-4 opacity-80" />
                        <Heading level={2} className="text-2xl font-bold text-white mb-2">
                            Selecciona una Empresa
                        </Heading>
                        <Text className="text-text-muted">
                            Elige la empresa para invitar a su Fundador.
                        </Text>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {companies.map(company => (
                            <button
                                key={company.id}
                                onClick={() => setSelectedCompany(company)}
                                className="group flex flex-col items-start p-6 bg-bg-surface-1/40 hover:bg-bg-surface-1 border border-glass-border hover:border-brand-primary/50 rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-brand-primary/10"
                            >
                                <div className="flex justify-between w-full items-center mb-2">
                                    <span className="font-bold text-text-main text-lg group-hover:text-brand-primary transition-colors">{company.name}</span>
                                    <ChevronRight size={18} className="text-text-dim group-hover:translate-x-1 transition-transform" />
                                </div>
                                <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                    {company.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* CONTEXT BAR */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl mb-8">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-12 h-12 flex items-center justify-center bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/20 shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter">Empresa Seleccionada</div>
                                <div className="text-white font-bold text-xl">{selectedCompany.name}</div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setSelectedCompany(null)}
                            variant="secondary"
                            className="w-full sm:w-auto font-bold"
                        >
                            Cambiar Empresa
                        </Button>
                    </div>

                    {/* REUSABLE MANAGER - STAFF MODE (Founder Invite) */}
                    <InvitationManager
                        companyId={selectedCompany.id}
                        projects={[]} // No projects needed
                        invitations={invitations}
                        companyName={selectedCompany.name}
                        requireProject={false} // CRITICAL: Disable project requirement
                        roleOptions={selectedCompany.code === 'lukeapp-hq' ? [
                            { value: 'super_admin', label: 'Super Admin', description: 'Acceso total a la plataforma y todos sus recursos.' }
                        ] : [
                            { value: 'founder', label: 'Fundador / Dueño', description: 'Acceso total a la empresa, facturación y gestión de proyectos.' }
                        ]}
                        onInvite={handleInvite}
                        onRevoke={handleRevoke}
                    />
                </>
            )}
        </div>
    )
}
