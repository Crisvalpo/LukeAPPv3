'use client'

import { useState } from 'react'
import RevisionSpoolsList from './RevisionSpoolsList'
import RevisionWeldsList from './RevisionWeldsList'
import RevisionMTOList from './RevisionMTOList'
import RevisionJointsList from './RevisionJointsList'

interface Props {
    revisionId: string
    projectId: string
    glbModelUrl?: string | null
    modelData?: any
    spools?: any[] // Optional spools data for viewer
}

type TabType = 'SPOOLS' | 'WELDS' | 'MATERIALS' | 'JOINTS'

export default function RevisionMasterView({ revisionId, projectId, glbModelUrl, modelData, spools = [] }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('SPOOLS')

    return (
        <div className="bg-bg-surface-1/40 backdrop-blur-xl border-t border-glass-border/30 rounded-b-xl overflow-hidden animate-in fade-in duration-500">
            {/* Tabs Header */}
            <div className="flex px-4 border-b border-glass-border/30 bg-white/5 gap-1 overflow-x-auto custom-scrollbar">
                <button
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2.5 transition-all whitespace-nowrap ${activeTab === 'SPOOLS'
                            ? 'text-brand-primary border-brand-primary bg-brand-primary/5'
                            : 'text-text-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    onClick={() => setActiveTab('SPOOLS')}
                >
                    <span className="text-lg">🏷️</span> Spools
                </button>
                <button
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2.5 transition-all whitespace-nowrap ${activeTab === 'WELDS'
                            ? 'text-brand-primary border-brand-primary bg-brand-primary/5'
                            : 'text-text-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    onClick={() => setActiveTab('WELDS')}
                >
                    <span className="text-lg">🔥</span> Uniones
                </button>
                <button
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2.5 transition-all whitespace-nowrap ${activeTab === 'MATERIALS'
                            ? 'text-brand-primary border-brand-primary bg-brand-primary/5'
                            : 'text-text-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    onClick={() => setActiveTab('MATERIALS')}
                >
                    <span className="text-lg">📦</span> Materiales
                </button>
                <button
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2.5 transition-all whitespace-nowrap ${activeTab === 'JOINTS'
                            ? 'text-brand-primary border-brand-primary bg-brand-primary/5'
                            : 'text-text-muted border-transparent hover:text-white hover:bg-white/5'
                        }`}
                    onClick={() => setActiveTab('JOINTS')}
                >
                    <span className="text-lg">🔧</span> Juntas
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px] bg-black/20">
                {activeTab === 'SPOOLS' && (
                    <RevisionSpoolsList revisionId={revisionId} projectId={projectId} />
                )}
                {activeTab === 'WELDS' && (
                    <RevisionWeldsList revisionId={revisionId} projectId={projectId} />
                )}
                {activeTab === 'MATERIALS' && (
                    <RevisionMTOList revisionId={revisionId} projectId={projectId} />
                )}
                {activeTab === 'JOINTS' && (
                    <RevisionJointsList revisionId={revisionId} projectId={projectId} />
                )}
            </div>
        </div>
    )
}
