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
        <div className="revision-master-view">
            {/* Tabs Header */}
            <div className="tabs-header">
                <button
                    className={`tab-btn ${activeTab === 'SPOOLS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('SPOOLS')}
                >
                    <span className="icon">🏷️</span> Spools
                </button>
                <button
                    className={`tab-btn ${activeTab === 'WELDS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('WELDS')}
                >
                    <span className="icon">🔥</span> Uniones
                </button>
                <button
                    className={`tab-btn ${activeTab === 'MATERIALS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('MATERIALS')}
                >
                    <span className="icon">📦</span> Materiales
                </button>
                <button
                    className={`tab-btn ${activeTab === 'JOINTS' ? 'active' : ''}`}
                    onClick={() => setActiveTab('JOINTS')}
                >
                    <span className="icon">🔧</span> Juntas
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
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

            <style jsx>{`
                .revision-master-view {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 0 0 12px 12px;
                    border-top: 1px solid var(--glass-border);
                    margin-top: -1px;
                    overflow: hidden;
                }

                .tabs-header {
                    display: flex;
                    gap: 2px;
                    padding: 0 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid var(--glass-border);
                }

                .tab-btn {
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--color-text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .tab-btn:hover {
                    color: var(--color-text-main);
                    background: rgba(255, 255, 255, 0.05);
                }

                .tab-btn.active {
                    color: #d8b4fe; /* Purple primary */
                    border-bottom-color: #d8b4fe;
                    background: rgba(126, 34, 206, 0.1);
                }

                .tab-content {
                    padding: 0;
                    min-height: 200px;
                }

                .placeholder-tab {
                    padding: 2rem;
                    text-align: center;
                    color: var(--color-text-dim);
                    font-style: italic;
                }
            `}</style>
        </div>
    )
}
