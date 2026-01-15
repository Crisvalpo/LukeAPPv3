'use client'

import React, { useState } from 'react'
import WeldCompactCard from './WeldCompactCard'
import JointCompactCard from './JointCompactCard'
import { Flame, Wrench } from 'lucide-react'
import { Icons } from '@/components/ui/Icons'

interface SpoolExpandedContentProps {
    spool: any
    isoNumber: string
    projectId: string
    welds: any[]
    joints: any[]
    childSpools?: any[] // New prop
    weldTypesConfig: any
    loading: boolean
    onWeldClick: (weld: any) => void
    onJointClick?: (joint: any) => void
    onAssign?: (type: 'WELD' | 'JOINT', id: string, targetSpoolId: string) => void
}

export default function SpoolExpandedContent({
    spool,
    isoNumber,
    projectId,
    welds,
    joints,
    childSpools = [],
    weldTypesConfig,
    loading,
    onWeldClick,
    onJointClick,
    onAssign
}: SpoolExpandedContentProps) {
    const [activeTab, setActiveTab] = useState<'WELDS' | 'JOINTS' | 'SPLIT'>('WELDS')

    // Initial check: If no welds but has joints, default to JOINTS.
    // UseEffect logic extended to handle initial default.
    React.useEffect(() => {
        if (!loading) {
            if (spool.status === 'DIVIDED') {
                setActiveTab('SPLIT')
            } else if (welds.length === 0 && joints.length > 0) {
                setActiveTab('JOINTS')
            }
        }
    }, [loading, welds.length, joints.length, spool.status])

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

    // -------------------------------------------------------------
    // SPLIT VIEW: Distribution Interface
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // SPLIT VIEW: Distribution Interface
    // -------------------------------------------------------------
    // Warning: 'SPLIT' might not be in the type definition of activeTab initially if inferred incorrectly?
    // It is defined as <'WELDS' | 'JOINTS' | 'SPLIT'> above.
    const isSplitView = activeTab === 'SPLIT'

    if (isSplitView) {
        return (
            <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.5)', // slate-900/50
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #334155', // slate-700
                marginTop: '8px'
            }}>
                <div style={{
                    fontSize: '0.75rem', // xs
                    fontWeight: 'bold',
                    color: '#fbbf24', // amber-400
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Icons.Split size={12} />
                    Spool Dividido - Asignación Pendiente
                </div>

                {/* 1. Unassigned Components (Source) */}
                <div style={{ marginBottom: '16px' }}>
                    <span style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: '#94a3b8', // slate-400
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                    }}>
                        Pool de Componentes ({welds.length + joints.length})
                    </span>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                        marginTop: '4px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        padding: '4px',
                        backgroundColor: '#020617', // slate-950
                        borderRadius: '4px',
                        border: '1px solid #1e293b' // slate-800
                    }}>
                        {/* Welds */}
                        {welds.map(w => (
                            <div
                                key={`w-${w.id}`}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('type', 'WELD')
                                    e.dataTransfer.setData('id', w.id)
                                    e.dataTransfer.effectAllowed = 'move'
                                }}
                                style={{
                                    cursor: 'grab',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid #334155', // slate-700
                                    backgroundColor: '#0f172a' // slate-900
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Flame size={10} color="#fb923c" /> {/* orange-400 */}
                                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'white' }}>{w.weld_number}</span>
                                </div>
                                <span style={{ fontSize: '9px', color: '#64748b' }}>{w.type_weld}</span>
                            </div>
                        ))}
                        {/* Joints */}
                        {joints.map(j => (
                            <div
                                key={`j-${j.id}`}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('type', 'JOINT')
                                    e.dataTransfer.setData('id', j.id)
                                    e.dataTransfer.effectAllowed = 'move'
                                }}
                                style={{
                                    cursor: 'grab',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid #334155', // slate-700
                                    backgroundColor: '#0f172a' // slate-900
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wrench size={10} color="#38bdf8" /> {/* sky-400 */}
                                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'white' }}>{j.flanged_joint_number}</span>
                                </div>
                                <span style={{ fontSize: '9px', color: '#64748b' }}>{j.type_code}</span>
                            </div>
                        ))}
                        {welds.length === 0 && joints.length === 0 && (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', fontSize: '10px', color: '#475569', padding: '8px' }}>
                                No hay componentes pendientes
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Child Spools (Targets) */}
                <div>
                    <span style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: '#94a3b8', // slate-400
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                    }}>
                        Sub-Spools (Destinos)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {childSpools.map((child: any) => (
                            <div
                                key={child.id}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    e.dataTransfer.dropEffect = 'move'
                                    e.currentTarget.style.borderColor = '#3b82f6'
                                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#334155'
                                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)' // slate-800/50
                                }}
                                onDrop={async (e) => {
                                    e.preventDefault()
                                    e.currentTarget.style.borderColor = '#334155'
                                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'

                                    const type = e.dataTransfer.getData('type')
                                    const id = e.dataTransfer.getData('id')

                                    // Call Server Action to assign
                                    const { assignComponentsToSpool } = await import('@/actions/spools')
                                    await assignComponentsToSpool(child.id, [id], type as 'WELD' | 'JOINT')

                                    // Notify Parent for Optimistic Update
                                    if (onAssign) onAssign(type as 'WELD' | 'JOINT', id, child.id)


                                    // Trigger simple refresh if passed, or rely on parent
                                    // ideally we'd have onRefresh() prop
                                }}
                                style={{
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #334155', // slate-700
                                    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>{child.name}</span>
                                    <span style={{
                                        fontSize: '10px',
                                        fontFamily: 'monospace',
                                        color: '#94a3b8',
                                        backgroundColor: '#0f172a',
                                        padding: '2px 4px',
                                        borderRadius: '2px'
                                    }}>
                                        {child.tag || 'SIN-TAG'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#475569' }}></div>
                                    Arrastra aquí
                                </div>
                            </div>
                        ))}
                        {childSpools.length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#f87171', fontStyle: 'italic' }}>
                                Error: No se encontraron sub-spools creados.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const TabButton = ({ id, label, icon: Icon, count }: any) => {
        const isActive = activeTab === id
        const isDisabled = count === 0 && id !== 'SPLIT' // SPLIT is special

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    if (!isDisabled) setActiveTab(id)
                }}
                disabled={isDisabled}
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
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    position: 'relative',
                    opacity: isDisabled ? 0.3 : (isActive ? 1 : 0.8)
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
