'use client'

import { useRouter } from 'next/navigation'
import { Users, Building2, Settings as SettingsIcon, Bell, Shield } from 'lucide-react'
import '@/styles/dashboard.css'

export default function SettingsPage() {
    const router = useRouter()

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

            {/* Settings Grid */}
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
                                opacity: section.available ? 1 : 0.5,
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
                                    marginTop: '0.5rem'
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
