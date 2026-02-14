'use client'

import { useState } from 'react'
import { ClipboardList, Megaphone, Wrench, CheckCircle } from 'lucide-react'
import RevisionsTab from '@/components/engineering/RevisionsTab'
import RevisionAnnouncementTab from '@/components/engineering/RevisionAnnouncementTab'
import EngineeringDetailsTab from '@/components/engineering/EngineeringDetailsTab'
import FabricabilityDashboard from '@/components/engineering/FabricabilityDashboard'
// Styles migrated to Tailwind v4
// Styles migrated to Tailwind v4
// Styles migrated to Tailwind v4

interface EngineeringManagerProps {
    projectId: string
    companyId: string
    userRole?: 'founder' | 'admin'
}

type TabType = 'revisiones' | 'announcement' | 'details' | 'fabricability'

export default function EngineeringManager({ projectId, companyId, userRole = 'founder' }: EngineeringManagerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('revisiones')

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700">
            {/* Tabs Navigation */}
            <div className="w-full">
                <div className="flex flex-col md:flex-row p-1.5 bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border/50 rounded-2xl gap-1.5 shadow-lg">
                    <button
                        onClick={() => setActiveTab('revisiones')}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group flex-1 md:flex-initial ${activeTab === 'revisiones'
                                ? 'bg-brand-primary/20 text-white shadow-lg shadow-brand-primary/10 border border-brand-primary/20'
                                : 'text-text-dim hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <ClipboardList size={18} className={activeTab === 'revisiones' ? 'text-brand-primary' : 'text-text-dim group-hover:text-white transition-colors'} />
                        <span className="z-10 relative">Revisiones</span>
                        {activeTab === 'revisiones' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 opacity-50 blur-sm" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('announcement')}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group flex-1 md:flex-initial ${activeTab === 'announcement'
                                ? 'bg-brand-secondary/20 text-white shadow-lg shadow-brand-secondary/10 border border-brand-secondary/20'
                                : 'text-text-dim hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <Megaphone size={18} className={activeTab === 'announcement' ? 'text-brand-secondary' : 'text-text-dim group-hover:text-white transition-colors'} />
                        <span className="z-10 relative">1. Anuncio</span>
                        {activeTab === 'announcement' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/0 via-brand-secondary/10 to-brand-secondary/0 opacity-50 blur-sm" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group flex-1 md:flex-initial ${activeTab === 'details'
                                ? 'bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                                : 'text-text-dim hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <Wrench size={18} className={activeTab === 'details' ? 'text-indigo-400' : 'text-text-dim group-hover:text-white transition-colors'} />
                        <span className="z-10 relative">2. Detalles</span>
                        {activeTab === 'details' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-50 blur-sm" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('fabricability')}
                        className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group flex-1 md:flex-initial ${activeTab === 'fabricability'
                                ? 'bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/10 border border-emerald-500/20'
                                : 'text-text-dim hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <CheckCircle size={18} className={activeTab === 'fabricability' ? 'text-emerald-400' : 'text-text-dim group-hover:text-white transition-colors'} />
                        <span className="z-10 relative">3. Fabricabilidad</span>
                        {activeTab === 'fabricability' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-50 blur-sm" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="w-full relative min-h-[400px]">
                {activeTab === 'revisiones' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <RevisionsTab projectId={projectId} />
                    </div>
                )}

                {activeTab === 'announcement' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
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
                    </div>
                )}

                {activeTab === 'details' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <EngineeringDetailsTab
                            projectId={projectId}
                            companyId={companyId}
                        />
                    </div>
                )}

                {activeTab === 'fabricability' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <FabricabilityDashboard projectId={projectId} />
                    </div>
                )}
            </div>
        </div>
    )
}
