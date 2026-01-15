'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompaniesWithSubscription, registerManualPayment, updateCompanySubscription, type CompanyWithSubscription } from '@/services/subscriptions'
import { deleteCompanyCascade } from '@/services/companies'
import { Icons } from '@/components/ui/Icons'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'
import '@/styles/dashboard.css'
import '@/styles/staff-payments.css'
import '@/styles/tables.css'

export default function StaffPaymentsPage() {
    const router = useRouter()
    const [companies, setCompanies] = useState<CompanyWithSubscription[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCompany, setSelectedCompany] = useState<CompanyWithSubscription | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [monthsToAdd, setMonthsToAdd] = useState(1)
    const [selectedTier, setSelectedTier] = useState<string>('starter')

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
        const result = await registerManualPayment(selectedCompany.id, monthsToAdd, selectedTier as any)

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

    async function handleDeleteCompany(companyId: string) {
        const confirm1 = confirm('⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEstás a punto de ELIMINAR DEFINITIVAMENTE esta empresa.\n\n- Se borrarán todos los proyectos.\n- Se borrarán todos los usuarios.\n- Se borrarán todos los archivos.\n\nEsta acción NO SE PUEDE DESHACER.\n\n¿Estás seguro?')
        if (!confirm1) return

        const confirm2 = confirm('Última oportunidad: ¿Realmente deseas eliminar todos los datos de esta empresa?')
        if (!confirm2) return

        setIsProcessing(true)
        const result = await deleteCompanyCascade(companyId)

        if (result.success) {
            alert('Empresa eliminada exitosamente.')
            await loadCompanies()
        } else {
            alert('No se pudo eliminar: ' + result.message)
        }
        setIsProcessing(false)
    }

    const getDaysSuspended = (suspendedAt: string | null) => {
        if (!suspendedAt) return 0
        const start = new Date(suspendedAt).getTime()
        const now = new Date().getTime()
        const diff = now - start
        return Math.floor(diff / (1000 * 60 * 60 * 24))
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="status-badge status-badge-active"><Icons.Success size={16} /> Activo</span>
            case 'past_due':
                return <span className="status-badge status-badge-past-due"><Icons.Warning size={16} /> Vencido</span>
            case 'suspended':
                return <span className="status-badge status-badge-suspended"><Icons.Failed size={16} /> Suspendido</span>
            default:
                return status
        }
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <Text size="base" style={{ textAlign: 'center' }}>Cargando...</Text>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <Heading level={1} className="dashboard-title">Gestión de Pagos</Heading>
                </div>
                <Text size="base" className="dashboard-subtitle">Administra suscripciones y pagos manuales de empresas</Text>
            </div>

            {/* Companies Table */}
            <div className="card">
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Plan</th>
                                <th>Estado</th>
                                <th>Vencimiento</th>
                                <th className="th-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company) => {
                                const isSuspended = company.subscription_status === 'suspended'
                                const daysSuspended = getDaysSuspended(company.suspended_at)
                                const canDelete = isSuspended && daysSuspended >= 15
                                const daysRemaining = 15 - daysSuspended

                                return (
                                    <tr key={company.id}>
                                        <td className="company-cell">
                                            <div className="company-cell-content">
                                                <Icons.Company size={18} className="company-icon" />
                                                {company.name}
                                            </div>
                                        </td>
                                        <td className="plan-cell">
                                            {company.subscription_tier}
                                        </td>
                                        <td>{getStatusBadge(company.subscription_status)}</td>
                                        <td className="date-cell">
                                            {company.subscription_end_date
                                                ? new Date(company.subscription_end_date).toLocaleDateString('es-ES')
                                                : 'Sin límite'}
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                {/* Delete Option (Visual indicator only until enabled) */}
                                                {isSuspended && (
                                                    canDelete ? (
                                                        <Button
                                                            onClick={() => handleDeleteCompany(company.id)}
                                                            variant="destructive"
                                                            size="icon"
                                                            title="Eliminar Definitivamente"
                                                            disabled={isProcessing}
                                                        >
                                                            <Icons.Delete size={16} />
                                                        </Button>
                                                    ) : (
                                                        <div className="countdown-badge" title={`Desbloqueo en ${daysRemaining} días`}>
                                                            <Icons.Clock size={14} /> {daysRemaining}d
                                                        </div>
                                                    )
                                                )}

                                                <Button
                                                    onClick={() => {
                                                        setSelectedCompany(company)
                                                        setSelectedTier(company.subscription_tier)
                                                    }}
                                                    variant="default"
                                                    size="sm"
                                                    disabled={isProcessing}
                                                >
                                                    <Icons.Document size={14} /> Registrar Pago
                                                </Button>

                                                {isSuspended ? (
                                                    <Button
                                                        onClick={() => handleActivateCompany(company.id)}
                                                        variant="secondary"
                                                        size="sm"
                                                        className="text-green-400 border-green-500/20 hover:bg-green-500/10"
                                                        disabled={isProcessing}
                                                    >
                                                        Reactivar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleSuspendCompany(company.id)}
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={isProcessing}
                                                    >
                                                        Suspender
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {selectedCompany && (
                <div
                    className="payment-modal-overlay"
                    onClick={() => setSelectedCompany(null)}
                >
                    <div
                        className="card payment-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Heading level={2} className="payment-modal-title">Registrar Pago Manual</Heading>
                        <Text size="base" className="payment-modal-subtitle">
                            Empresa: <strong>{selectedCompany.name}</strong>
                        </Text>

                        <label className="payment-modal-label">
                            Extender servicio por:
                        </label>
                        <select
                            value={monthsToAdd}
                            onChange={(e) => setMonthsToAdd(Number(e.target.value))}
                            className="payment-modal-select"
                        >
                            <option value={1}>1 mes</option>
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={12}>12 meses</option>
                        </select>

                        <label className="payment-modal-label" style={{ marginTop: 'var(--spacing-4)' }}>
                            Plan de Suscripción:
                        </label>
                        <select
                            value={selectedTier}
                            onChange={(e) => setSelectedTier(e.target.value)}
                            className="payment-modal-select"
                        >
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>

                        <div className="payment-modal-actions">
                            <Button
                                onClick={handleRegisterPayment}
                                variant="default"
                                className="payment-modal-btn-confirm"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                            </Button>
                            <Button
                                onClick={() => setSelectedCompany(null)}
                                variant="secondary"
                                disabled={isProcessing}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
