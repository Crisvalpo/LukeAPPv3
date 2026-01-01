'use client'

import { useState } from 'react'
import { ClipboardList, Megaphone, Wrench, CheckCircle } from 'lucide-react'
import RevisionsTab from '@/components/engineering/RevisionsTab'
import RevisionAnnouncementTab from '@/components/engineering/RevisionAnnouncementTab'
import EngineeringDetailsTab from '@/components/engineering/EngineeringDetailsTab'
import FabricabilityDashboard from '@/components/engineering/FabricabilityDashboard'
import '@/styles/dashboard.css'
import '@/styles/engineering.css'
import '@/styles/announcement.css'
import '@/styles/engineering-details.css'

interface EngineeringManagerProps {
    projectId: string
    companyId: string
    userRole?: 'founder' | 'admin'
}

type TabType = 'revisiones' | 'announcement' | 'details' | 'fabricability'

export default function EngineeringManager({ projectId, companyId, userRole = 'founder' }: EngineeringManagerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('revisiones')

    return (
        <div className="engineering-hub-container">
            {/* Tabs Navigation */}
            <div className="engineering-tabs">
                <button
                    className={`tab-button ${activeTab === 'revisiones' ? 'active' : ''}`}
                    onClick={() => setActiveTab('revisiones')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <ClipboardList size={16} /> Revisiones
                </button>
                <button
                    className={`tab-button ${activeTab === 'announcement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('announcement')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Megaphone size={16} /> 1. Anuncio
                </button>
                <button
                    className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Wrench size={16} /> 2. Detalles
                </button>
                <button
                    className={`tab-button ${activeTab === 'fabricability' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fabricability')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <CheckCircle size={16} /> 3. Fabricabilidad
                </button>
            </div>

            {/* Tab Content */}
            <div className="engineering-content" style={{ marginTop: '1.5rem' }}>
                {activeTab === 'revisiones' && (
                    <RevisionsTab projectId={projectId} />
                )}

                {activeTab === 'announcement' && (
                    <RevisionAnnouncementTab
                        projectId={projectId}
                        companyId={companyId}
                        onSuccess={() => {
                            // Auto-switch to Revisiones tab to show updated statistics
                            setTimeout(() => {
                                setActiveTab('revisiones')
                            }, 1500) // Wait 1.5s to show success message first
                        }}
                    />
                )}

                {activeTab === 'details' && (
                    <EngineeringDetailsTab
                        projectId={projectId}
                        companyId={companyId}
                    />
                )}

                {activeTab === 'fabricability' && (
                    <FabricabilityDashboard projectId={projectId} />
                )}
            </div>
        </div>
    )
}
