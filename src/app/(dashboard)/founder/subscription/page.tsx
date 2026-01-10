'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanySubscriptionInfo, getSubscriptionPlans, type CompanySubscriptionInfo, type SubscriptionPlan } from '@/services/subscriptions'
import { Users, FolderKanban, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/subscription.css'

export default function FounderSubscriptionPage() {
    const router = useRouter()
    const [subscriptionInfo, setSubscriptionInfo] = useState<CompanySubscriptionInfo | null>(null)
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const supabase = await import('@/lib/supabase/client').then((m) => m.createClient())

        // Get current user's company
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

        const { data: memberData } = await supabase
            .from('members')
            .select('company_id')
            .eq('user_id', user.id)
            .in('role_id', ['founder', 'admin'])
            .limit(1)
            .maybeSingle()

        if (!memberData) {
            router.push('/founder')
            return
        }

        const [info, plansData] = await Promise.all([
            getCompanySubscriptionInfo(memberData.company_id),
            getSubscriptionPlans()
        ])

        setSubscriptionInfo(info)
        setPlans(plansData)
        setIsLoading(false)
    }

    const getStatusBadge = (status: string) => {
        const statusClasses = {
            active: 'subscription-status-active',
            past_due: 'subscription-status-past-due',
            suspended: 'subscription-status-suspended'
        }

        const statusIcons = {
            active: <CheckCircle size={18} />,
            past_due: <AlertCircle size={18} />,
            suspended: <AlertCircle size={18} />
        }

        const statusLabels = {
            active: 'Activo',
            past_due: 'Vencido',
            suspended: 'Suspendido'
        }

        return (
            <span className={`subscription-status-badge ${statusClasses[status as keyof typeof statusClasses] || ''}`}>
                {statusIcons[status as keyof typeof statusIcons]}
                {statusLabels[status as keyof typeof statusLabels] || status}
            </span>
        )
    }

    const getUsagePercentage = (current: number, max: number) => {
        if (max === 0) return 0
        return Math.min((current / max) * 100, 100)
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (!subscriptionInfo) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>No se pudo cargar la información</p>
            </div>
        )
    }

    const currentPlan = plans.find((p) => p.id === subscriptionInfo.tier)
    const usersPct = getUsagePercentage(subscriptionInfo.current_users, subscriptionInfo.max_users)
    const projectsPct = getUsagePercentage(subscriptionInfo.current_projects, subscriptionInfo.max_projects)

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Suscripción</h1>
                </div>
                <p className="dashboard-subtitle">Estado de tu plan y uso de recursos</p>
            </div>

            {/* Status Alert */}
            {subscriptionInfo.status !== 'active' && (
                <div className={`subscription-alert ${subscriptionInfo.status === 'past_due' ? 'subscription-alert-warning' : 'subscription-alert-error'}`}>
                    <div className="subscription-alert-icon">
                        <AlertCircle size={32} color={subscriptionInfo.status === 'past_due' ? '#fbbf24' : '#ef4444'} />
                    </div>
                    <div className="subscription-alert-content">
                        <h3>
                            {subscriptionInfo.status === 'past_due'
                                ? 'Pago Vencido'
                                : 'Servicio Suspendido'}
                        </h3>
                        <p>
                            {subscriptionInfo.status === 'past_due'
                                ? 'Tu suscripción ha vencido. Por favor, realiza el pago para evitar la suspensión del servicio.'
                                : 'Tu cuenta está suspendida por falta de pago. Contacta a soporte para reactivarla.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Current Plan */}
            <div className="subscription-plan-card">
                <div className="subscription-plan-header">
                    <div>
                        <h2 className="subscription-plan-name">Plan Actual</h2>
                        <p className="subscription-plan-tier">{subscriptionInfo.tier}</p>
                    </div>
                    <div>{getStatusBadge(subscriptionInfo.status)}</div>
                </div>

                {subscriptionInfo.end_date && (
                    <p className="subscription-plan-info">
                        Vencimiento: <strong>
                            {new Date(subscriptionInfo.end_date).toLocaleDateString('es-ES')}
                        </strong>
                    </p>
                )}

                {currentPlan && (
                    <p className="subscription-plan-info">
                        Precio: <strong>
                            ${currentPlan.price_monthly.toLocaleString('es-CL')}/mes
                        </strong>
                    </p>
                )}
            </div>

            {/* Usage Stats */}
            <h2 className="subscription-section-title">Uso de Recursos</h2>
            <div className="subscription-usage-grid">
                {/* Users */}
                <div className="subscription-usage-card">
                    <div className="subscription-usage-header">
                        <div className="subscription-usage-icon">
                            <Users size={24} color="#60a5fa" />
                        </div>
                        <div>
                            <h3 className="subscription-usage-title">Usuarios</h3>
                            <p className="subscription-usage-stats">
                                {subscriptionInfo.current_users} / {subscriptionInfo.max_users}
                            </p>
                        </div>
                    </div>
                    <div className="subscription-progress-bar">
                        <div
                            className={`subscription-progress-fill ${usersPct > 80 ? 'subscription-progress-fill-warning' : 'subscription-progress-fill-users'}`}
                            style={{ width: `${usersPct}%` }}
                        />
                    </div>
                </div>

                {/* Projects */}
                <div className="subscription-usage-card">
                    <div className="subscription-usage-header">
                        <div className="subscription-usage-icon">
                            <FolderKanban size={24} color="#a78bfa" />
                        </div>
                        <div>
                            <h3 className="subscription-usage-title">Proyectos</h3>
                            <p className="subscription-usage-stats">
                                {subscriptionInfo.current_projects} / {subscriptionInfo.max_projects}
                            </p>
                        </div>
                    </div>
                    <div className="subscription-progress-bar">
                        <div
                            className={`subscription-progress-fill ${projectsPct > 80 ? 'subscription-progress-fill-warning' : 'subscription-progress-fill-projects'}`}
                            style={{ width: `${projectsPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Instructions */}
            <div className="subscription-payment-card">
                <h2 className="subscription-payment-title">Instrucciones de Pago</h2>
                <p className="subscription-payment-text">
                    Transferir a Banco Estado, Cuenta Corriente N° 123456789. Enviar comprobante a pagos@lukeapp.cl
                </p>
                <a
                    href="mailto:pagos@lukeapp.cl?subject=Comprobante de Pago&body=Adjunto comprobante de pago para la empresa."
                    className="btn btn-primary"
                >
                    <Mail size={18} />
                    Reportar Pago
                </a>
            </div>
        </div>
    )
}
