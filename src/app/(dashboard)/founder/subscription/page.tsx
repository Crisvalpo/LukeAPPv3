'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanySubscriptionInfo, getSubscriptionPlans, type CompanySubscriptionInfo, type SubscriptionPlan } from '@/services/subscriptions'
import { Users, FolderKanban, AlertCircle, Mail, Database, FileCode } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/views/founder-subscription.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/Progress'

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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }

        const { data: memberData } = await supabase
            .from('members')
            .select('company_id')
            .eq('user_id', user.id)
            .in('role_id', ['founder', 'admin'])
            .limit(1)
            .maybeSingle()

        if (!memberData) { router.push('/founder'); return }

        const [info, plansData] = await Promise.all([
            getCompanySubscriptionInfo(memberData.company_id),
            getSubscriptionPlans()
        ])

        setSubscriptionInfo(info)
        setPlans(plansData)
        setIsLoading(false)
    }

    const getProgressVariant = (current: number, max: number) => {
        const pct = (current / max) * 100
        if (pct >= 90) return 'destructive'
        if (pct >= 75) return 'warning'
        return 'default'
    }

    if (isLoading) {
        return (
            <div className="dashboard-page center-message">
                <Text variant="muted">Cargando...</Text>
            </div>
        )
    }

    if (!subscriptionInfo) {
        return (
            <div className="dashboard-page center-message">
                <Text className="text-error">No se pudo cargar la información</Text>
            </div>
        )
    }

    const currentPlan = plans.find((p) => p.id === subscriptionInfo.tier)

    return (
        <div className="dashboard-page">
            {/* Standard Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <Heading level={1} className="dashboard-title">Suscripción</Heading>
                </div>
                <Text size="base" className="dashboard-subtitle">Administra tu plan y monitoriza el uso de recursos</Text>
            </div>

            {/* Status Alert */}
            {subscriptionInfo.status !== 'active' && (
                <Alert variant={subscriptionInfo.status === 'past_due' ? 'warning' : 'destructive'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        {subscriptionInfo.status === 'past_due' ? 'Pago Vencido' : 'Servicio Suspendido'}
                    </AlertTitle>
                    <AlertDescription>
                        {subscriptionInfo.status === 'past_due'
                            ? 'Tu suscripción ha vencido. Por favor, realiza el pago para evitar la suspensión del servicio.'
                            : 'Tu cuenta está suspendida por falta de pago. Contacta a soporte para reactivarla.'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Master Plan Card */}
            <div className="premium-plan-card">
                <div className="plan-content-wrapper">
                    <div className="plan-main-info">
                        <span className="plan-label">Plan Actual</span>
                        <div className="plan-name-large">{subscriptionInfo.tier}</div>
                        <StatusBadge status={subscriptionInfo.status} />
                    </div>

                    <div className="plan-details-grid">
                        {subscriptionInfo.end_date && (
                            <div className="plan-detail-item">
                                <span className="plan-label">Vencimiento</span>
                                <span className="detail-value">
                                    {new Date(subscriptionInfo.end_date).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                        {currentPlan && (
                            <div className="plan-detail-item">
                                <span className="plan-label">Precio</span>
                                <span className="detail-value">
                                    ${currentPlan.price_monthly.toLocaleString('es-CL')}/mes
                                </span>
                            </div>
                        )}
                        <div className="plan-detail-item">
                            <span className="plan-label">Ciclo</span>
                            <span className="detail-value">Mensual</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Stats Grid */}
            <div>
                <h3 className="section-title">Uso de Recursos</h3>
                <div className="usage-grid">

                    {/* Users */}
                    <div className="premium-stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Usuarios</span>
                            <div className="stat-icon-box">
                                <Users className="h-4 w-4 icon-blue" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <div className="stat-value-large">
                                {subscriptionInfo.current_users}
                                <span className="stat-limit">/ {subscriptionInfo.max_users}</span>
                            </div>
                            {subscriptionInfo.plan_max_users && subscriptionInfo.max_users > subscriptionInfo.plan_max_users && (
                                <Text className="stat-card__extra">
                                    +{subscriptionInfo.max_users - subscriptionInfo.plan_max_users} extra
                                </Text>
                            )}
                        </div>
                        <div className="progress-container">
                            <div
                                className={`progress-fill ${getProgressVariant(subscriptionInfo.current_users, subscriptionInfo.max_users)}`}
                                style={{ width: `${(subscriptionInfo.current_users / subscriptionInfo.max_users) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Projects */}
                    <div className="premium-stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Proyectos</span>
                            <div className="stat-icon-box">
                                <FolderKanban className="h-4 w-4 icon-purple" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <div className="stat-value-large">
                                {subscriptionInfo.current_projects}
                                <span className="stat-limit">/ {subscriptionInfo.max_projects}</span>
                            </div>
                            {subscriptionInfo.plan_max_projects && subscriptionInfo.max_projects > subscriptionInfo.plan_max_projects && (
                                <Text className="stat-card__extra">
                                    +{subscriptionInfo.max_projects - subscriptionInfo.plan_max_projects} extra
                                </Text>
                            )}
                        </div>
                        <div className="progress-container">
                            <div
                                className={`progress-fill ${getProgressVariant(subscriptionInfo.current_projects, subscriptionInfo.max_projects)}`}
                                style={{ width: `${(subscriptionInfo.current_projects / subscriptionInfo.max_projects) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Spools */}
                    <div className="premium-stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Spools</span>
                            <div className="stat-icon-box">
                                <FileCode className="h-4 w-4 icon-emerald" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <div className="stat-value-large">
                                {subscriptionInfo.current_spools}
                                <span className="stat-limit">/ {subscriptionInfo.max_spools}</span>
                            </div>
                        </div>
                        <div className="progress-container">
                            <div
                                className={`progress-fill ${getProgressVariant(subscriptionInfo.current_spools, subscriptionInfo.max_spools)}`}
                                style={{ width: `${(subscriptionInfo.current_spools / subscriptionInfo.max_spools) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="premium-stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Almacenamiento</span>
                            <div className="stat-icon-box">
                                <Database className="h-4 w-4 icon-amber" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <div className="stat-value-large">
                                {subscriptionInfo.current_storage_gb.toFixed(1)}
                                <span className="stat-limit">/ {subscriptionInfo.max_storage_gb} GB</span>
                            </div>
                        </div>
                        <div className="progress-container">
                            <div
                                className={`progress-fill ${getProgressVariant(subscriptionInfo.current_storage_gb, subscriptionInfo.max_storage_gb)}`}
                                style={{ width: `${(subscriptionInfo.current_storage_gb / subscriptionInfo.max_storage_gb) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Payment Section */}
            <div className="payment-section">
                <Text variant="muted" size="sm">¿Necesitas reactivar o mejorar tu plan?</Text>
                <div className="payment-text">
                    Transferir a Banco Estado &bull; Cta Cte 123456789 &bull; pagos@lukeapp.cl
                </div>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.href = "mailto:pagos@lukeapp.cl?subject=Comprobante de Pago"}
                >
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Comprobante de Pago
                </Button>
            </div>
        </div>
    )
}
