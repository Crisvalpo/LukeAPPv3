'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UsersList from '@/components/users/UsersList'
import { Building2, ChevronRight } from 'lucide-react'
import '@/styles/dashboard.css'

interface Company {
    id: string
    name: string
    code: string
}

interface Member {
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
    const [members, setMembers] = useState<Member[]>([])

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
        const supabase = createClient()
        // Fetch members with user email and project info
        const { data, error } = await supabase
            .from('members')
            .select(`
                id,
                user_id,
                role_id,
                created_at,
                users ( email ),
                projects ( name, code )
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching members:', error)
            setMembers([])
            return
        }

        // Transform data to flat structure
        const formattedMembers: Member[] = data.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            role_id: m.role_id,
            email: m.users?.email || 'N/A', // users table join
            project: m.projects, // projects table join
            created_at: m.created_at
        }))

        setMembers(formattedMembers)
    }

    async function handleDeleteMember(memberId: string) {
        if (!confirm('¿Estás seguro de eliminar este usuario de la empresa? Perderá todos sus accesos.')) {
            return
        }

        const supabase = createClient()
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId)

        if (error) {
            alert('Error al eliminar usuario')
        } else {
            if (selectedCompany) loadCompanyMembers(selectedCompany.id)
        }
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Usuarios Globales</h1>
                </div>
                <p className="dashboard-subtitle">Gestión de personal y roles por empresa.</p>
            </div>

            {/* COMPANY SELECTOR */}
            {!selectedCompany ? (
                <div className="company-form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <Building2 size={48} color="#4ade80" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                            Selecciona una Empresa
                        </h2>
                        <p style={{ color: '#94a3b8' }}>
                            Elige la empresa para ver su nómina de personal.
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
                        background: 'rgba(22, 163, 74, 0.2)', // Green tint for Users context
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '0.75rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="company-logo-box" style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.25rem' }}>
                                <Building2 size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 'bold' }}>Empresa Seleccionada</div>
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

                    {/* REUSABLE USERS LIST */}
                    <UsersList
                        users={members}
                        context="staff"
                        onDelete={handleDeleteMember}
                    />
                </>
            )}
        </div>
    )
}
