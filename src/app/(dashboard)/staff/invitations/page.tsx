'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createInvitation, getPendingInvitations, revokeInvitation, type Invitation } from '@/services/invitations'
import InvitationManager from '@/components/invitations/InvitationManager'
import { Building2, ChevronRight } from 'lucide-react'
import '@/styles/dashboard.css'

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
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Centro de Invitaciones</h1>
                </div>
                <p className="dashboard-subtitle">Gestión global de accesos para fundadores de empresas.</p>
            </div>

            {/* COMPANY SELECTOR */}
            {!selectedCompany ? (
                <div className="company-form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <Building2 size={48} color="#60a5fa" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                            Selecciona una Empresa
                        </h2>
                        <p style={{ color: '#94a3b8' }}>
                            Elige la empresa para invitar a su Fundador.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        {companies.map(company => (
                            <button
                                key={company.id}
                                onClick={() => setSelectedCompany(company)}
                                className="action-button"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    padding: '1.5rem',
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    height: 'auto',
                                    gap: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', color: 'white', fontSize: '1.1rem' }}>{company.name}</span>
                                    <ChevronRight size={16} color="#64748b" />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                    {company.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* CONTEXT BAR */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.5rem',
                        background: 'rgba(5b, 33, 182, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '0.75rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="company-logo-box" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
                                <Building2 size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 'bold' }}>Empresa Seleccionada</div>
                                <div style={{ color: 'white', fontWeight: '600', fontSize: '1.1rem' }}>{selectedCompany.name}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedCompany(null)}
                            className="action-button"
                        >
                            Cambiar Empresa
                        </button>
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
