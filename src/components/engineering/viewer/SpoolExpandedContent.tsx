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
    onJointClick?: (joint: any) => void
}

export default function SpoolExpandedContent({
    spool,
    isoNumber,
    projectId,
    welds,
    joints,
    weldTypesConfig,
    loading,
    onWeldClick,
    onJointClick
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
                    gap: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #3b82f6' : '1px solid #334155',
                    color: isActive ? '#3b82f6' : '#64748b',
                    padding: '6px 4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    position: 'relative',
                    opacity: isActive ? 1 : 0.8
                }}
            >
                <Icon size={14} />
                <span>{label}</span>
                {count > 0 && (
                    <span style={{
                        backgroundColor: isActive ? '#3b82f6' : '#334155',
                        color: 'white',
                        padding: '0 5px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        marginLeft: '4px',
                        minWidth: '16px',
                        textAlign: 'center'
                    }}>
                        {count}
                    </span>
                )}
            </button>
        )
    }

    return (
        <div style={{
            marginTop: '8px',
            borderTop: '1px solid #334155',
            marginLeft: '-10px',
            marginRight: '-10px',
            width: 'calc(100% + 20px)'
        }}>
            {/* Tabs Header */}
            <div style={{
                display: 'flex',
                marginBottom: '0' // Connect directly to content
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
            <div style={{ padding: '8px 4px 4px 4px' }}>

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
                                    onClick={() => onJointClick && onJointClick(joint)}
                                />
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
