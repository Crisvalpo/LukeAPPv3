'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Building2, Bell, Shield } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/founder.css'

interface CompanyInfo {
    id: string
    name: string
    slug: string
}

export default function FounderDashboard() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [companyData, setCompanyData] = useState<CompanyInfo | null>(null)

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

        setCompanyData(memberData.companies as unknown as CompanyInfo)
        setIsLoading(false)
    }

    const settingsSections = [
        {
            title: 'Roles y Permisos',
            description: 'Configura roles funcionales y permisos de acceso',
            icon: Users,
            color: '#f472b6',
            href: '/founder/settings/roles',
            available: true
        },
        {
            title: 'Información de Empresa',
            description: 'Edita nombre, logo y datos de la organización',
            icon: Building2,
            color: '#c084fc',
            href: '/founder/settings/company',
            available: false
        },
        {
            title: 'Notificaciones',
            description: 'Preferencias de alertas y comunicaciones',
            icon: Bell,
            color: '#60a5fa',
            href: '/founder/settings/notifications',
            available: false
        },
        {
            title: 'Seguridad',
            description: 'Gestión de seguridad y autenticación',
            icon: Shield,
            color: '#4ade80',
            href: '/founder/settings/security',
            available: false
        }
    ]

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
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Configuración</h1>
                </div>
                <p className="dashboard-subtitle">Administra las configuraciones de tu empresa</p>
            </div>

            {/* Content Cards */}
            <div className="quick-actions-grid" style={{ marginTop: '2rem' }}>
                {settingsSections.map((section) => {
                    const Icon = section.icon
                    return (
                        <div
                            key={section.title}
                            className={`quick-action-card ${!section.available ? 'disabled' : ''}`}
                            onClick={() => section.available && router.push(section.href)}
                            style={{
                                cursor: section.available ? 'pointer' : 'not-allowed',
                                opacity: section.available ? 1 : 0.6,
                                position: 'relative'
                            }}
                        >
                            <div className="quick-action-icon">
                                <Icon size={24} color={section.color} />
                            </div>
                            <h3 className="quick-action-title">{section.title}</h3>
                            <p className="quick-action-description">
                                {section.description}
                            </p>
                            {!section.available && (
                                <span className="quick-action-badge" style={{
                                    background: 'rgba(100, 116, 139, 0.2)',
                                    color: '#94a3b8',
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    marginTop: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    Próximamente
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
