'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOnboardingStatus, type OnboardingStatus } from '@/actions/onboarding'
import { Users, Building2, FolderKanban, UserPlus } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/founder.css'
import { Heading, Text } from '@/components/ui/Typography'
import ConfigCard from '@/components/founder/ConfigCard'

interface CompanyInfo {
    id: string
    name: string
    slug: string
}

export default function FounderDashboard() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companyData, setCompanyData] = useState<CompanyInfo | null>(null)
    const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)

    useEffect(() => {
        loadFounderData()
    }, [])

    async function loadFounderData() {
        const supabase = createClient()

        // Get current user's company
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }

        // Get member info to find company
        const { data: memberData } = await supabase
            .from('members')
            .select('company_id, companies(id, name, slug)')
            .eq('user_id', user.id)
            .in('role_id', ['founder', 'admin'])
            .limit(1)
            .maybeSingle()

        if (!memberData || !memberData.companies) {
            router.push('/')
            return
        }

        const company = memberData.companies as unknown as CompanyInfo
        setCompanyData(company)

        // Fetch onboarding status
        const status = await getOnboardingStatus(company.id)
        setOnboardingStatus(status)

        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (!companyData) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>No tienes acceso a este dashboard</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content-wrapper">
                    <div className="dashboard-header-content">
                        <div className="dashboard-accent-line" />
                        <Heading level={1} className="dashboard-title">Panel de Control</Heading>
                    </div>
                    <Text size="base" className="dashboard-subtitle">Administra los recursos y configuraciones de tu organización</Text>
                </div>
            </div>

            {/* Content Cards */}
            <div className="quick-actions-grid" style={{ marginTop: '2rem' }}>
                <ConfigCard
                    title="Información de Empresa"
                    description="Edita nombre, logo y datos de la organización"
                    href="/founder/company"
                    icon={Building2}
                    step="company"
                    onboardingStatus={onboardingStatus}
                />

                <ConfigCard
                    title="Roles y Permisos"
                    description="Configura roles funcionales y permisos de acceso"
                    href="/founder/settings/roles"
                    icon={Users}
                    step="roles"
                    onboardingStatus={onboardingStatus}
                />

                <ConfigCard
                    title="Proyectos"
                    description="Crea y gestiona proyectos de tu organización"
                    href="/founder/projects"
                    icon={FolderKanban}
                    step="projects"
                    onboardingStatus={onboardingStatus}
                />

                <ConfigCard
                    title="Invitaciones"
                    description="Invita a miembros de tu equipo"
                    href="/founder/settings/invitations"
                    icon={UserPlus}
                    step="invitations"
                    onboardingStatus={onboardingStatus}
                />
            </div>
        </div>
    )
}
