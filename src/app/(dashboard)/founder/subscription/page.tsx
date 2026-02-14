'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanySubscriptionInfo, getSubscriptionPlans, type CompanySubscriptionInfo, type SubscriptionPlan } from '@/services/subscriptions'
import { Users, FolderKanban, AlertCircle, Mail, Database, FileCode, Clock } from 'lucide-react'
// Styles migrated to Tailwind v4
// Styles migrated to Tailwind v4
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
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in px-4 md:px-6">
            {/* Standard Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1} className="tracking-tight">Suscripción</Heading>
                </div>
                <Text size="lg" className="text-text-muted max-w-2xl font-medium ml-4.5">
                    Administra tu plan y monitoriza el uso de recursos empresariales.
                </Text>
            </div>

            {/* Status Alert */}
            {subscriptionInfo.status !== 'active' && (
                <Alert variant={subscriptionInfo.status === 'past_due' ? 'warning' : 'destructive'} className="rounded-2xl border-white/5">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-semibold ml-2">
                        {subscriptionInfo.status === 'past_due' ? 'Pago Vencido' : 'Servicio Suspendido'}
                    </AlertTitle>
                    <AlertDescription className="ml-2 py-1">
                        {subscriptionInfo.status === 'past_due'
                            ? 'Tu suscripción ha vencido. Por favor, realiza el pago para evitar la suspensión del servicio.'
                            : 'Tu cuenta está suspendida por falta de pago. Contacta a soporte para reactivarla.'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Master Plan Card */}
            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-700 group-hover:bg-brand-primary/20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <Text size="xs" className="font-bold uppercase tracking-widest text-brand-primary">Plan Contratado</Text>
                            <div className="h-px w-8 bg-brand-primary/30" />
                        </div>
                        <div className="space-y-1">
                            <Heading level={2} className="text-6xl md:text-7xl font-black text-white capitalize tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                                {subscriptionInfo.tier}
                            </Heading>
                            <div className="flex items-center gap-3 pt-2">
                                <StatusBadge status={subscriptionInfo.status} />
                                <span className="text-xs font-medium text-text-dim flex items-center gap-1">
                                    <Clock size={12} className="text-brand-primary" />
                                    Renovación automática
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 w-full md:w-auto md:border-l border-white/5 md:pl-12">
                        {subscriptionInfo.end_date && (
                            <div className="space-y-2">
                                <Text size="xs" className="font-bold uppercase tracking-widest text-text-muted">Próximo Pago</Text>
                                <div className="text-2xl font-bold text-white tracking-tight">
                                    {new Date(subscriptionInfo.end_date).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}
                        {currentPlan && (
                            <div className="space-y-2">
                                <Text size="xs" className="font-bold uppercase tracking-widest text-text-muted">Inversión Mensual</Text>
                                <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
                                    <span className="text-brand-primary text-sm font-bold">$</span>
                                    {currentPlan.price_monthly.toLocaleString('es-CL')}
                                    <span className="text-text-dim text-xs font-medium">/mes</span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Text size="xs" className="font-bold uppercase tracking-widest text-text-muted">Modalidad</Text>
                            <div className="text-2xl font-bold text-white tracking-tight">SaaS Cloud</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Stats Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-brand-primary/50 rounded-full" />
                    <Heading level={2} className="text-2xl font-bold text-white tracking-tight">Capacidad y Recursos</Heading>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Users */}
                    <div className="bg-bg-surface-1 border border-glass-border p-6 rounded-2xl space-y-5 hover:border-brand-primary/30 transition-all duration-300 group shadow-lg">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:scale-105 transition-transform">
                                <Users size={20} />
                            </div>
                            <div className="text-right">
                                <Text size="xs" className="font-bold text-text-dim uppercase tracking-widest">Usuarios</Text>
                                <div className="text-2xl font-bold text-white mt-1">
                                    {subscriptionInfo.current_users}
                                    <span className="text-sm text-text-dim ml-1">/ {subscriptionInfo.max_users}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Progress
                                value={(subscriptionInfo.current_users / subscriptionInfo.max_users) * 100}
                                variant={getProgressVariant(subscriptionInfo.current_users, subscriptionInfo.max_users)}
                                className="h-1.5 bg-white/5"
                            />
                            {subscriptionInfo.plan_max_users && subscriptionInfo.max_users > subscriptionInfo.plan_max_users && (
                                <Text className="text-[10px] text-brand-primary font-bold uppercase tracking-tighter">
                                    Incluye {subscriptionInfo.max_users - subscriptionInfo.plan_max_users} licencias extra
                                </Text>
                            )}
                        </div>
                    </div>

                    {/* Projects */}
                    <div className="bg-bg-surface-1 border border-glass-border p-6 rounded-2xl space-y-5 hover:border-indigo-500/30 transition-all duration-300 group shadow-lg">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-105 transition-transform">
                                <FolderKanban size={20} />
                            </div>
                            <div className="text-right">
                                <Text size="xs" className="font-bold text-text-dim uppercase tracking-widest">Proyectos</Text>
                                <div className="text-2xl font-bold text-white mt-1">
                                    {subscriptionInfo.current_projects}
                                    <span className="text-sm text-text-dim ml-1">/ {subscriptionInfo.max_projects}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Progress
                                value={(subscriptionInfo.current_projects / subscriptionInfo.max_projects) * 100}
                                variant={getProgressVariant(subscriptionInfo.current_projects, subscriptionInfo.max_projects)}
                                className="h-1.5 bg-white/5"
                            />
                            {subscriptionInfo.plan_max_projects && subscriptionInfo.max_projects > subscriptionInfo.plan_max_projects && (
                                <Text className="text-[10px] text-indigo-400 font-bold uppercase tracking-tighter">
                                    Custom Limit: {subscriptionInfo.max_projects} Proy.
                                </Text>
                            )}
                        </div>
                    </div>

                    {/* Spools */}
                    <div className="bg-bg-surface-1 border border-glass-border p-6 rounded-2xl space-y-5 hover:border-emerald-500/30 transition-all duration-300 group shadow-lg">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:scale-105 transition-transform">
                                <FileCode size={20} />
                            </div>
                            <div className="text-right">
                                <Text size="xs" className="font-bold text-text-dim uppercase tracking-widest">Spools</Text>
                                <div className="text-2xl font-bold text-white mt-1">
                                    {subscriptionInfo.current_spools}
                                    <span className="text-sm text-text-dim ml-1">/ {subscriptionInfo.max_spools}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Progress
                                value={(subscriptionInfo.current_spools / subscriptionInfo.max_spools) * 100}
                                variant={getProgressVariant(subscriptionInfo.current_spools, subscriptionInfo.max_spools)}
                                className="h-1.5 bg-white/5"
                            />
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="bg-bg-surface-1 border border-glass-border p-6 rounded-2xl space-y-5 hover:border-amber-500/30 transition-all duration-300 group shadow-lg">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:scale-105 transition-transform">
                                <Database size={20} />
                            </div>
                            <div className="text-right">
                                <Text size="xs" className="font-bold text-text-dim uppercase tracking-widest">Hosting</Text>
                                <div className="text-2xl font-bold text-white mt-1">
                                    {subscriptionInfo.current_storage_gb.toFixed(1)}
                                    <span className="text-sm text-text-dim ml-1">/ {subscriptionInfo.max_storage_gb} GB</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Progress
                                value={(subscriptionInfo.current_storage_gb / subscriptionInfo.max_storage_gb) * 100}
                                variant={getProgressVariant(subscriptionInfo.current_storage_gb, subscriptionInfo.max_storage_gb)}
                                className="h-1.5 bg-white/5"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Payment Section */}
            <div className="p-8 md:p-12 bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-3xl flex flex-col items-center gap-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-brand-primary/10 blur-[60px]" />

                <div className="space-y-3 relative z-10">
                    <Text size="lg" className="font-bold text-white tracking-tight">¿Necesitas reactivar o mejorar tu plan?</Text>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-text-dim bg-white/5 px-6 py-3 rounded-full border border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-brand-primary text-[10px] font-bold uppercase tracking-widest">Banco</span>
                            <span className="text-text-main font-semibold">Banco Estado</span>
                        </div>
                        <div className="hidden md:block w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-brand-primary text-[10px] font-bold uppercase tracking-widest">Cta Cte</span>
                            <span className="text-text-main font-semibold">123456789</span>
                        </div>
                        <div className="hidden md:block w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-brand-primary text-[10px] font-bold uppercase tracking-widest">Email</span>
                            <span className="text-text-main font-semibold">pagos@lukeapp.cl</span>
                        </div>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="relative z-10 group overflow-hidden bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl px-10 py-7 shadow-xl shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => window.location.href = "mailto:pagos@lukeapp.cl?subject=Comprobante de Pago"}
                >
                    <Mail className="mr-3 h-5 w-5 transition-transform group-hover:-rotate-12" />
                    Enviar Comprobante de Pago
                </Button>
            </div>
        </div>
    )
}
