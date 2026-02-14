'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { Settings, MapPin, ArrowLeft } from 'lucide-react'
import { Heading } from '@/components/ui/Typography'
// Styles migrated to Tailwind v4

export default function ProjectSettingsLayout({
    children
}: {
    children: React.ReactNode
}) {
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const projectId = params.id as string

    const tabs = [
        { id: 'locations', label: 'Ubicaciones', icon: MapPin, path: `/founder/projects/${projectId}/settings/locations` },
        // Future: Team, Permissions, etc.
    ]

    return (
        <div className="settings-layout">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-container">
                    <div className="settings-nav-top">
                        <button
                            onClick={() => router.push(`/founder/projects/${projectId}`)}
                            className="settings-back-btn"
                        >
                            <ArrowLeft size={16} />
                            Volver al Proyecto
                        </button>
                    </div>

                    <div className="settings-title-row">
                        <Settings className="settings-icon" />
                        <Heading level={1} className="settings-title">Configuración del Proyecto</Heading>
                    </div>

                    {/* Tabs */}
                    <div className="settings-tabs">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = pathname?.includes(tab.id)

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => router.push(tab.path)}
                                    className={`settings-tab-btn ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="settings-content">
                <div className="settings-container">
                    {children}
                </div>
            </div>
        </div>
    )
}
