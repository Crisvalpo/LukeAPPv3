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
            <div className="bg-slate-900/50 p-2 rounded-md border border-slate-700 mt-2">
                <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <Icons.Split size={12} />
                    Spool Dividido - Asignación Pendiente
                </div>

                {/* 1. Unassigned Components (Source) */}
                <div className="mb-4">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">
                        Pool de Componentes ({welds.length + joints.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-1 max-h-[150px] overflow-y-auto p-1 bg-slate-950 rounded border border-slate-800 custom-scrollbar">
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
                                className="cursor-grab p-1.5 rounded flex items-center justify-between border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
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
                                className="cursor-grab p-1.5 rounded flex items-center justify-between border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Wrench size={10} className="text-sky-400" />
                                    <span className="text-xs font-mono text-white">{j.flanged_joint_number}</span>
                                </div>
                                <span className="text-[9px] text-slate-500">{j.type_code}</span>
                            </div>
                        ))}
                        {welds.length === 0 && joints.length === 0 && (
                            <div className="col-span-2 text-center text-[10px] text-slate-500 p-2">
                                No hay componentes pendientes
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Child Spools (Targets) */}
                <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">
                        Sub-Spools (Destinos)
                    </span>
                    <div className="flex flex-col gap-2 mt-1">
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
                                }}
                                className="p-2 rounded border border-slate-700 bg-slate-800/50 flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{child.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1 py-0.5 rounded-sm">
                                        {child.tag || 'SIN-TAG'}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
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
                className={`flex-1 flex items-center justify-center gap-1.5 bg-transparent border-b-2 py-1.5 px-1 cursor-pointer text-xs font-semibold transition-all relative ${isActive ? 'border-blue-500 text-blue-500' : 'border-slate-700 text-slate-500 hover:text-slate-300'
                    } ${isDisabled ? 'opacity-30 cursor-not-allowed border-none' : ''}`}
            >
                <Icon size={14} />
                <span>{label}</span>
                {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] min-w-[16px] text-center ml-1 ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                        {count}
                    </span>
                )}
            </button>
        )
    }

    return (
        <div className="mt-2 border-t border-slate-700 -mx-2.5 w-[calc(100%+20px)]">
            {/* Tabs Header */}
            <div className="flex mb-0">
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
            <div className="p-2 pt-2">

                {/* WELDS TAB */}
                {activeTab === 'WELDS' && (
                    <>
                        {welds.length === 0 ? (
                            <div className="text-slate-500 text-xs text-center p-4 italic">
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
                            <div className="text-slate-500 text-xs text-center p-4 italic">
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
