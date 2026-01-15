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
    onJointClick
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
    if (activeTab === 'SPLIT' || (spool.status === 'DIVIDED' && activeTab === 'SPLIT')) {
        return (
            <div className="bg-slate-900/50 p-2 rounded border border-slate-700 mt-2">
                <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <Icons.Split className="w-3 h-3" />
                    Spool Dividido - Asignación Pendiente
                </div>

                {/* 1. Unassigned Components (Source) */}
                <div className="mb-4">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                        Pool de Componentes ({welds.length + joints.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-1 max-h-[150px] overflow-y-auto p-1 bg-slate-950 rounded border border-slate-800">
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
                                className="cursor-grab hover:bg-slate-800 p-1.5 rounded flex items-center justify-between border border-slate-700 bg-slate-900"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Flame size={10} className="text-orange-400" />
                                    <span className="text-xs font-mono text-white">{w.weld_number}</span>
                                </div>
                                <span className="text-[9px] text-slate-500">{w.type_weld}</span>
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
                                className="cursor-grab hover:bg-slate-800 p-1.5 rounded flex items-center justify-between border border-slate-700 bg-slate-900"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Wrench size={10} className="text-sky-400" />
                                    <span className="text-xs font-mono text-white">{j.flanged_joint_number}</span>
                                </div>
                                <span className="text-[9px] text-slate-500">{j.type_code}</span>
                            </div>
                        ))}
                        {welds.length === 0 && joints.length === 0 && (
                            <div className="col-span-2 text-center text-[10px] text-slate-600 py-2">
                                No hay componentes pendientes
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Child Spools (Targets) */}
                <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                        Sub-Spools (Destinos)
                    </span>
                    <div className="space-y-2 mt-1">
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
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                                onDrop={async (e) => {
                                    e.preventDefault()
                                    e.currentTarget.style.borderColor = '#334155'
                                    e.currentTarget.style.backgroundColor = 'transparent'

                                    const type = e.dataTransfer.getData('type')
                                    const id = e.dataTransfer.getData('id')

                                    // Call Server Action to assign
                                    const { assignComponentsToSpool } = await import('@/actions/spools')
                                    await assignComponentsToSpool(child.id, [id], type as 'WELD' | 'JOINT')

                                    // Note: Caller should handle refresh. 
                                    // Ideally we need a callback from parent to re-fetch welds/joints.
                                    // For now, simple interaction, user might need to collapse/expand to refresh.
                                    // Or we inject a refresh handler.
                                }}
                                className="p-2 rounded border border-slate-700 bg-slate-800/50 flex items-center justify-between transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{child.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1 py-0.5 rounded">
                                        {child.tag || 'SIN-TAG'}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
                                    Arrastra aquí
                                </div>
                            </div>
                        ))}
                        {childSpools.length === 0 && (
                            <div className="text-xs text-red-400 italic">
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
