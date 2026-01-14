'use client'

import React, { useState } from 'react'
import WeldCompactCard from './WeldCompactCard'
import JointCompactCard from './JointCompactCard'
import { Flame, Wrench } from 'lucide-react'

interface SpoolExpandedContentProps {
    spool: any
    isoNumber: string
    projectId: string
    welds: any[]
    joints: any[]
    weldTypesConfig: any
    loading: boolean
    onWeldClick: (weld: any) => void
}

export default function SpoolExpandedContent({
    spool,
    isoNumber,
    projectId,
    welds,
    joints,
    weldTypesConfig,
    loading,
    onWeldClick
}: SpoolExpandedContentProps) {
    const [activeTab, setActiveTab] = useState<'WELDS' | 'JOINTS'>('WELDS')

    // Initial check: If no welds but has joints, default to JOINTS
    React.useEffect(() => {
        if (!loading && welds.length === 0 && joints.length > 0) {
            setActiveTab('JOINTS')
        }
    }, [loading, welds.length, joints.length])

    if (loading) {
        return (
            <div style={{
                color: '#64748b',
                fontSize: '0.8rem',
                textAlign: 'center',
                padding: '8px'
            }}>
                Cargando datos...
            </div>
        )
    }

    const TabButton = ({ id, label, icon: Icon, count }: any) => {
        const isActive = activeTab === id
        return (
            <button
                onClick={() => setActiveTab(id)}
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: isActive ? '#334155' : 'transparent', // Selected vs Unselected bg
                    border: 'none',
                    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                    color: isActive ? 'white' : '#94a3b8',
                    padding: '10px 4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    position: 'relative'
                }}
            >
                <Icon size={16} color={isActive ? '#f59e0b' : '#94a3b8'} />
                <span>{label}</span>
                {count > 0 && (
                    <span style={{
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.2)',
                        padding: '1px 6px',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        marginLeft: '4px',
                        color: isActive ? '#93c5fd' : '#cbd5e1'
                    }}>
                        {count}
                    </span>
                )}
            </button>
        )
    }

    return (
        <div>
            {/* Tabs Header */}
            <div style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                borderBottom: '1px solid #334155',
                marginBottom: '8px'
            }}>
                <TabButton
                    id="WELDS"
                    label="Uniones"
                    icon={Flame}
                    count={welds.length}
                />
                <TabButton
                    id="JOINTS"
                    label="Juntas"
                    icon={Wrench}
                    count={joints.length}
                />
            </div>

            {/* Content Area */}
            <div style={{ padding: '0 8px 8px 8px' }}>

                {/* WELDS TAB */}
                {activeTab === 'WELDS' && (
                    <>
                        {welds.length === 0 ? (
                            <div style={{
                                color: '#64748b',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                padding: '16px',
                                fontStyle: 'italic'
                            }}>
                                No hay soldaduras registradas
                            </div>
                        ) : (
                            welds.map((weld) => (
                                <WeldCompactCard
                                    key={weld.id}
                                    weld={{
                                        ...weld,
                                        spool_number: spool.name,
                                        iso_number: isoNumber
                                    }}
                                    weldTypeConfig={weldTypesConfig[weld.type_weld]}
                                    onClick={() => onWeldClick({
                                        ...weld,
                                        spool_number: spool.name,
                                        spool_id: spool.id,
                                        iso_number: isoNumber,
                                        project_id: projectId
                                    })}
                                />
                            ))
                        )}
                    </>
                )}

                {/* JOINTS TAB */}
                {activeTab === 'JOINTS' && (
                    <>
                        {joints.length === 0 ? (
                            <div style={{
                                color: '#64748b',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                padding: '16px',
                                fontStyle: 'italic'
                            }}>
                                No hay uniones apernadas registradas
                            </div>
                        ) : (
                            joints.map((joint) => (
                                <JointCompactCard
                                    key={joint.id}
                                    joint={joint}
                                />
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
