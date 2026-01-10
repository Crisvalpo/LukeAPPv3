'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompaniesWithSubscription, registerManualPayment, updateCompanySubscription, type CompanyWithSubscription } from '@/services/subscriptions'
import { Building2, CheckCircle, AlertTriangle, Ban, CreditCard } from 'lucide-react'
import '@/styles/dashboard.css'

export default function StaffPaymentsPage() {
    const router = useRouter()
    const [companies, setCompanies] = useState<CompanyWithSubscription[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCompany, setSelectedCompany] = useState<CompanyWithSubscription | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [monthsToAdd, setMonthsToAdd] = useState(1)

    useEffect(() => {
        loadCompanies()
    }, [])

    async function loadCompanies() {
        setIsLoading(true)

        // Get current staff user's company (to exclude it)
        const supabase = (await import('@/lib/supabase/client')).createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let staffCompanyId: string | null = null
        if (user) {
            const { data: staffMember } = await supabase
                .from('members')
                .select('company_id')
                .eq('user_id', user.id)
                .eq('role_id', 'super_admin')
                .maybeSingle()

            staffCompanyId = staffMember?.company_id || null
        }

        const data = await getCompaniesWithSubscription()

        // Filter out staff's own company (the platform operator company)
        const clientCompanies = staffCompanyId
            ? data.filter(c => c.id !== staffCompanyId)
            : data

        setCompanies(clientCompanies)
        setIsLoading(false)
    }

    async function handleRegisterPayment() {
        if (!selectedCompany) return

        setIsProcessing(true)
        const result = await registerManualPayment(selectedCompany.id, monthsToAdd)

        if (result.success) {
            alert(`Pago registrado. Servicio extendido por ${monthsToAdd} mes(es).`)
            setSelectedCompany(null)
            await loadCompanies()
        } else {
            alert('Error al registrar pago: ' + result.error)
        }

        setIsProcessing(false)
    }

    async function handleSuspendCompany(companyId: string) {
        if (!confirm('¿Seguro que deseas SUSPENDER esta empresa?')) return

        setIsProcessing(true)
        const result = await updateCompanySubscription(companyId, { subscription_status: 'suspended' })

        if (result.success) {
            alert('Empresa suspendida')
            await loadCompanies()
        } else {
            alert('Error: ' + result.error)
        }

        setIsProcessing(false)
    }

    async function handleActivateCompany(companyId: string) {
        setIsProcessing(true)
        const result = await updateCompanySubscription(companyId, { subscription_status: 'active' })

        if (result.success) {
            alert('Empresa reactivada')
            await loadCompanies()
        } else {
            alert('Error: ' + result.error)
        }

        setIsProcessing(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> Activo</span>
            case 'past_due':
                return <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> Vencido</span>
            case 'suspended':
                return <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ban size={16} /> Suspendido</span>
            default:
                return status
        }
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Gestión de Pagos</h1>
                </div>
                <p className="dashboard-subtitle">Administra suscripciones y pagos manuales de empresas</p>
            </div>

            {/* Companies Table */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Empresa</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Plan</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Vencimiento</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((company) => (
                            <tr key={company.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', color: 'white', fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Building2 size={18} color="#60a5fa" />
                                        {company.name}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                                    {company.subscription_tier}
                                </td>
                                <td style={{ padding: '1rem' }}>{getStatusBadge(company.subscription_status)}</td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                    {company.subscription_end_date
                                        ? new Date(company.subscription_end_date).toLocaleDateString('es-ES')
                                        : 'Sin límite'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => setSelectedCompany(company)}
                                            className="btn btn-sm btn-primary"
                                            disabled={isProcessing}
                                        >
                                            <CreditCard size={14} /> Registrar Pago
                                        </button>
                                        {company.subscription_status === 'suspended' ? (
                                            <button
                                                onClick={() => handleActivateCompany(company.id)}
                                                className="btn btn-sm btn-success"
                                                disabled={isProcessing}
                                            >
                                                Reactivar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSuspendCompany(company.id)}
                                                className="btn btn-sm btn-danger"
                                                disabled={isProcessing}
                                            >
                                                Suspender
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {selectedCompany && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setSelectedCompany(null)}
                >
                    <div
                        className="card"
                        style={{ maxWidth: '500px', width: '90%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Registrar Pago Manual</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Empresa: <strong style={{ color: 'white' }}>{selectedCompany.name}</strong>
                        </p>

                        <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.5rem' }}>
                            Extender servicio por:
                        </label>
                        <select
                            value={monthsToAdd}
                            onChange={(e) => setMonthsToAdd(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(15,23,42,0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.5rem',
                                color: 'white',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <option value={1}>1 mes</option>
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={12}>12 meses</option>
                        </select>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleRegisterPayment}
                                className="btn btn-primary"
                                disabled={isProcessing}
                                style={{ flex: 1 }}
                            >
                                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                            <button
                                onClick={() => setSelectedCompany(null)}
                                className="btn btn-secondary"
                                disabled={isProcessing}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
