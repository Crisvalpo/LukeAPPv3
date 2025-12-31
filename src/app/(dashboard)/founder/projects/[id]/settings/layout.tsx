'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { Settings, MapPin } from 'lucide-react'

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.push(`/founder/projects/${projectId}`)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Volver al Proyecto
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Configuración del Proyecto</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = pathname?.includes(tab.id)

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => router.push(tab.path)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${isActive
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    )
}
