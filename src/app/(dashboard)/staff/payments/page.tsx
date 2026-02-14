'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompaniesWithSubscription, registerManualPayment, updateCompanySubscription, type CompanyWithSubscription } from '@/services/subscriptions'
import { deleteCompanyCascade } from '@/services/companies'
import { Icons } from '@/components/ui/Icons'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'

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
        const companyToDelete = companies.find(c => c.id === companyId)
        if (!companyToDelete) return

        const confirm1 = confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEstás a punto de ELIMINAR DEFINITIVAMENTE la empresa:\n"${companyToDelete.name}"\n\n- Se borrarán todos los proyectos.\n- Se borrarán todos los usuarios.\n- Se borrarán todos los archivos.\n\nEsta acción NO SE PUEDE DESHACER.\n\n¿Estás seguro?`)
        if (!confirm1) return

        const typedName = prompt(`Para confirmar, escribe el nombre exacto de la empresa:\n"${companyToDelete.name}"`)
        if (typedName !== companyToDelete.name) {
            alert('El nombre no coincide. Eliminación cancelada.')
            return
        }

        setIsProcessing(true)
        const result = await deleteCompanyCascade(companyId)

        if (result.success) {
            alert(`✅ Empresa eliminada exitosamente\n\n` +
                `Storage path: ${result.stats?.storage_path || 'N/A'}\n` +
                `Archivos eliminados: ${result.stats?.deleted_files || 0}\n` +
                `Usuarios eliminados: ${result.stats?.deleted_users || 0}`)
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
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                        <Icons.Success size={12} /> Activo
                    </span>
                )
            case 'past_due':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        <Icons.Warning size={12} /> Vencido
                    </span>
                )
            case 'suspended':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                        <Icons.Failed size={12} /> Suspendido
                    </span>
                )
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
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in text-text-main">
            {/* Header */}
            <div className="space-y-2 relative group">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight text-white">Transacciones Globales</Heading>
                </div>
                <Text size="base" className="text-text-muted text-sm font-medium ml-4.5">
                    Administra suscripciones y pagos manuales de empresas
                </Text>
            </div>

            {/* Companies Table */}
            <div className="bg-bg-surface-1 border border-glass-border rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-glass-border bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-wider">Vencimiento</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border">
                            {companies.map((company) => {
                                const isSuspended = company.subscription_status === 'suspended'
                                const daysSuspended = getDaysSuspended(company.suspended_at)
                                const canDelete = isSuspended && daysSuspended >= 15
                                const daysRemaining = 15 - daysSuspended

                                return (
                                    <tr key={company.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 font-medium text-text-main">
                                                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
                                                    <Icons.Company size={18} />
                                                </div>
                                                {company.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-bg-surface-2 border border-glass-border rounded text-[10px] font-mono text-text-dim uppercase tracking-wider">
                                                {company.subscription_tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(company.subscription_status)}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-text-muted">
                                            {company.subscription_end_date
                                                ? new Date(company.subscription_end_date).toLocaleDateString('es-ES')
                                                : 'Sin límite'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Delete Option */}
                                                {isSuspended && (
                                                    canDelete ? (
                                                        <Button
                                                            onClick={() => handleDeleteCompany(company.id)}
                                                            variant="destructive"
                                                            size="icon"
                                                            className="w-8 h-8 rounded-lg shadow-lg hover:shadow-red-500/20"
                                                            disabled={isProcessing}
                                                        >
                                                            <Icons.Delete size={14} />
                                                        </Button>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[10px] font-bold" title={`Desbloqueo en ${daysRemaining} días`}>
                                                            <Icons.Clock size={12} /> {daysRemaining}d
                                                        </div>
                                                    )
                                                )}

                                                <Button
                                                    onClick={() => {
                                                        setSelectedCompany(company)
                                                        setSelectedTier(company.subscription_tier)
                                                    }}
                                                    className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/20 hover:border-brand-primary h-8 px-3 text-xs font-semibold rounded-lg transition-all"
                                                    disabled={isProcessing}
                                                >
                                                    <Icons.Document size={12} className="mr-1.5" /> Pago
                                                </Button>

                                                {isSuspended ? (
                                                    <Button
                                                        onClick={() => handleActivateCompany(company.id)}
                                                        variant="secondary"
                                                        className="h-8 px-3 text-xs font-semibold text-green-400 border-green-500/20 hover:bg-green-500/10 rounded-lg"
                                                        disabled={isProcessing}
                                                    >
                                                        Activar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleSuspendCompany(company.id)}
                                                        variant="destructive"
                                                        className="h-8 px-3 text-xs font-semibold bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all"
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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setSelectedCompany(null)}
                >
                    <div
                        className="w-full max-w-md bg-bg-surface-1 border border-glass-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Heading level={2} className="text-2xl font-bold text-white mb-2">Registrar Pago Manual</Heading>
                        <Text size="base" className="text-text-muted mb-8 pb-4 border-b border-glass-border">
                            Empresa: <strong className="text-brand-primary">{selectedCompany.name}</strong>
                        </Text>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                                    Extender servicio por:
                                </label>
                                <select
                                    value={monthsToAdd}
                                    onChange={(e) => setMonthsToAdd(Number(e.target.value))}
                                    className="w-full bg-bg-surface-2 border border-glass-border rounded-lg p-3 text-sm text-text-main focus:ring-1 focus:ring-brand-primary outline-none"
                                >
                                    <option value={1}>1 mes</option>
                                    <option value={3}>3 meses</option>
                                    <option value={6}>6 meses</option>
                                    <option value={12}>12 meses</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                                    Plan de Suscripción:
                                </label>
                                <select
                                    value={selectedTier}
                                    onChange={(e) => setSelectedTier(e.target.value)}
                                    className="w-full bg-bg-surface-2 border border-glass-border rounded-lg p-3 text-sm text-text-main focus:ring-1 focus:ring-brand-primary outline-none"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <Button
                                onClick={handleRegisterPayment}
                                className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-bold h-11"
                                disabled={isProcessing}
                            >
                                {isProcessing ? <Icons.Refresh className="animate-spin mr-2" size={18} /> : null}
                                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                            </Button>
                            <Button
                                onClick={() => setSelectedCompany(null)}
                                variant="secondary"
                                className="w-full h-11"
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
