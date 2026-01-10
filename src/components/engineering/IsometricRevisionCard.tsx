'use client'

import React, { useEffect, useState, useRef, useMemo, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { EngineeringRevision } from '@/types'
import { deleteRevisionAction } from '@/actions/revisions'
import { calculateDataStatus, calculateMaterialStatus, isFabricable, type DataStatus, type MaterialStatus } from '@/services/fabricability'
import RevisionMasterView from './RevisionMasterView'
import IsometricViewer from './viewer/IsometricViewer'
import { createClient } from '@/lib/supabase/client'
import { updateRevisionModelUrlAction } from '@/actions/revisions'

// Wrapper to load spools for viewer and handle fullscreen portal
function IsometricViewerWrapper({
    revisionId,
    modelUrl,
    initialModelData,
    isoNumber,
    projectId,
    onClose,
    onSave
}: {
    revisionId: string
    modelUrl: string
    initialModelData: any
    isoNumber: string
    projectId: string
    onClose: () => void
    onSave?: () => void
}) {
    const [spools, setSpools] = useState<any[]>([])
    const [structureModels, setStructureModels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Viewer Control State
    const [mode, setMode] = useState<'ORBIT' | 'PAN'>('ORBIT')
    const [speed, setSpeed] = useState(0.5)

    const [triggerFit, setTriggerFit] = useState(false)
    // Structure Visibility State: If empty, show none. If not empty, show selected.
    const [visibleStructureIds, setVisibleStructureIds] = useState<string[]>([])
    const [isStructureMenuOpen, setIsStructureMenuOpen] = useState(false)

    // Selection & Assignment State
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [modelData, setModelData] = useState<any>(initialModelData || {})

    // Derived: assignment map and colors
    const assignments = modelData?.spool_assignments || {}
    const spoolColors = React.useMemo(() => {
        const colors: Record<string, string> = {}
        spools.forEach(s => {
            if (assignments[s.id] && assignments[s.id].length > 0) {
                // Color based on Status
                if (s.status === 'INSTALLED') {
                    colors[s.id] = '#4ade80' // Green-400
                } else if (s.status === 'FABRICATED' || s.status === 'DISPATCHED') { // Group Dispatched with Fabricated for now
                    colors[s.id] = '#60a5fa' // Blue-400
                } else {
                    colors[s.id] = '#facc15' // Yellow-400 (Pending Assigned)
                }
            }
        })
        return colors
    }, [spools, assignments])

    // Spool Activation State (Highlighting)
    const [activeSpoolId, setActiveSpoolId] = useState<string | null>(null)
    const highlightedIds = useMemo(() => {
        if (!activeSpoolId) return []
        return assignments[activeSpoolId] || []
    }, [activeSpoolId, assignments])

    useEffect(() => {
        async function fetchContext() {
            try {
                // Parallel fetch for spools and structure models
                const { getRevisionSpoolsAction } = await import('@/actions/revisions')
                const { getStructureModelsAction } = await import('@/actions/structure-models')

                const [spoolsData, modelsResult] = await Promise.all([
                    getRevisionSpoolsAction(revisionId),
                    getStructureModelsAction(projectId)
                ])

                setSpools(spoolsData || [])
                if (modelsResult.success && modelsResult.data) {
                    console.log('🏗️ Structure models loaded:', modelsResult.data)
                    setStructureModels(modelsResult.data)
                } else {
                    console.warn('⚠️ No structure models found or error:', modelsResult)
                }
            } catch (error) {
                console.error('Error loading viewer context:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchContext()
    }, [revisionId, projectId])

    const handleDeleteModel = async () => {
        if (confirm('¿Estás seguro de ELIMINAR este modelo 3D permanentemente?')) {
            try {
                const { deleteRevisionModelUrlAction } = await import('@/actions/revisions')
                const res = await deleteRevisionModelUrlAction(revisionId, modelUrl)
                if (res.success) {
                    window.location.reload()
                } else {
                    alert(res.message)
                }
            } catch (error) {
                console.error('Error deleting model:', error)
                alert('Error al eliminar el modelo')
            }
        }
    }

    const handleAssignToSpool = async (spoolId: string) => {
        // Mode 1: Visualization (No active selection in 3D) -> Toggle Highlight
        if (selectedIds.length === 0) {
            setActiveSpoolId(prev => prev === spoolId ? null : spoolId)
            return
        }

        // Mode 2: Assignment (Items selected in 3D) -> Assign/Unassign logic
        const currentAssignments = assignments
        const selectedAreAssignedToTarget = selectedIds.every(id => currentAssignments[spoolId]?.includes(id))

        // CHECK: Are selected items assigned to ANY other spool?
        const isAssignedToOther = Object.keys(currentAssignments).some(key =>
            key !== spoolId && currentAssignments[key]?.some((id: string) => selectedIds.includes(id))
        )

        // 1. UNASSIGN Logic (Toggle off)
        if (selectedAreAssignedToTarget) {
            const newAssignments = { ...assignments }
            newAssignments[spoolId] = newAssignments[spoolId].filter((id: string) => !selectedIds.includes(id))

            // Update State & Persist
            const updatedData = { ...modelData, spool_assignments: newAssignments }
            setModelData(updatedData)
            setSelectedIds([]) // Clear selection after action
            setActiveSpoolId(null) // Clear highlight

            try {
                const { updateModelDataAction } = await import('@/actions/revisions')
                await updateModelDataAction(revisionId, updatedData)
                if (onSave) onSave()
            } catch (error) {
                console.error('Failed to save unassignment:', error)
            }
            return
        }

        // 2. BLOCK Logic (If assigned to other, prevent move)
        if (isAssignedToOther) {
            alert('⚠️ Algunos elementos seleccionados ya pertenecen a otro Spool.\nDebes desasignarlos primero.')
            return
        }

        // 3. ASSIGN Logic (Create new assignments)
        const newAssignments = { ...assignments }

        // Add to target spool
        newAssignments[spoolId] = [
            ...(newAssignments[spoolId] || []),
            ...selectedIds
        ]

        // Update local state
        const updatedData = {
            ...modelData,
            spool_assignments: newAssignments
        }
        setModelData(updatedData)

        // Clear selection to indicate success
        setSelectedIds([])
        setActiveSpoolId(null) // Clear highlight

        // Persist
        try {
            const { updateModelDataAction } = await import('@/actions/revisions')
            await updateModelDataAction(revisionId, updatedData)
            if (onSave) onSave()
        } catch (error) {
            console.error('Failed to save assignment:', error)
        }
    }

    const content = (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0f172a',
            zIndex: 100000,
            display: 'flex',
            flexDirection: 'row'
        }}>
            {/* Sidebar for Viewer Context (Expanded Width for Spools) */}
            <div style={{
                width: '300px', // Expanded to show spools
                backgroundColor: '#1e1e2e',
                borderRight: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: '0px'
            }}>
                {/* Sidebar Header */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                    }}>
                        3D
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#e2e8f0', fontWeight: '500', fontSize: '0.9rem' }}>
                            Spools ({spools.length})
                        </span>
                        {selectedIds.length > 0 && (
                            <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '600' }}>
                                {selectedIds.length} elementos seleccionados
                            </span>
                        )}
                    </div>
                </div>

                {/* Spools List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {loading ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                            Cargando spools...
                        </div>
                    ) : spools.length === 0 ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                            No hay spools asociados
                        </div>
                    ) : (
                        spools.map((spool: any) => {
                            const isAssigned = assignments[spool.id]?.length > 0
                            const canAssign = selectedIds.length > 0

                            // Check relationship with current selection
                            // 1. Are ALL selected items assigned to this spool? (Unassign scenario)
                            const isAssignedToThisSpool = selectedIds.length > 0 && selectedIds.every(id => assignments[spool.id]?.includes(id))

                            // 2. Is this spool currently "Selected" in the 3D model? (i.e. User clicked on a mesh belonging to this spool)
                            // We check if ANY of the selected IDs belong to this spool
                            const isSelectedInModel = selectedIds.length > 0 && assignments[spool.id]?.some((id: string) => selectedIds.includes(id))

                            // 2.b Is this spool "Active" (Highlighted via Card Click)?
                            const isActiveHighlight = activeSpoolId === spool.id

                            // 3. Block Logic: Is it assigned to OTHER spools?
                            const isAssignedToOtherSpool = canAssign && !isAssignedToThisSpool && Object.keys(assignments).some(key =>
                                key !== spool.id && assignments[key]?.some((id: string) => selectedIds.includes(id))
                            )

                            const isDisabled = canAssign && isAssignedToOtherSpool && !isAssignedToThisSpool // Only disable if stealing

                            // Determine Base Color based on Status
                            let baseColor = '#facc15' // Default Yellow (Pending - Assigned)
                            let baseBg = 'rgba(250, 204, 21, 0.1)'
                            let baseBorder = '#eab308'

                            if (spool.status === 'INSTALLED') {
                                baseColor = '#4ade80' // Green
                                baseBg = 'rgba(74, 222, 128, 0.1)'
                                baseBorder = '#22c55e'
                            } else if (spool.status === 'FABRICATED' || spool.status === 'DISPATCHED') {
                                baseColor = '#60a5fa' // Blue
                                baseBg = 'rgba(96, 165, 250, 0.1)'
                                baseBorder = '#3b82f6'
                            }

                            // Override for Selection Highlight (This Card is "Active")
                            if (isSelectedInModel) {
                                baseBg = 'rgba(255, 255, 255, 0.15)' // Bright highlight
                                baseBorder = baseColor // Keep status color for border but make it pop
                            } else if (isActiveHighlight) {
                                // Explicit Card Selection Highlight (Purple)
                                baseBg = 'rgba(168, 85, 247, 0.15)'
                                baseBorder = '#a855f7'
                            }

                            return (
                                <div
                                    key={spool.id}
                                    style={{
                                        backgroundColor: canAssign
                                            ? (isAssignedToThisSpool ? 'rgba(239, 68, 68, 0.1)' : (isAssigned ? baseBg : '#2d3b4e'))
                                            : (isAssigned ? baseBg : '#2d3b4e'),
                                        marginBottom: '8px',
                                        borderRadius: '6px',
                                        padding: '10px',
                                        // Highlight Border if Selected in Model or Active
                                        border: isAssigned
                                            ? (isSelectedInModel || isActiveHighlight ? `2px solid ${baseBorder}` : `1px solid ${baseBorder}`)
                                            : (isDisabled ? '1px solid #475569' : '1px solid #334155'),
                                        // Glow effect if Selected or Active
                                        boxShadow: (isSelectedInModel || isActiveHighlight) ? `0 0 15px ${baseBorder}40` : 'none',
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: isDisabled ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => !isDisabled && handleAssignToSpool(spool.id)}
                                    // Hover effect logic
                                    onMouseEnter={(e) => {
                                        if (canAssign && !isDisabled) {
                                            if (isAssignedToThisSpool) {
                                                // Unassign warning hover
                                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
                                                e.currentTarget.style.borderColor = '#f87171'
                                            } else {
                                                // Assign hover
                                                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
                                                e.currentTarget.style.borderColor = '#60a5fa'
                                            }
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        // Reset to base state
                                        const finalBg = isAssigned ? baseBg : '#2d3b4e'
                                        e.currentTarget.style.backgroundColor = finalBg
                                        e.currentTarget.style.borderColor = isAssigned
                                            ? (isSelectedInModel || isActiveHighlight ? baseBorder : baseBorder)
                                            : '#334155'
                                    }}
                                >
                                    {/* Action Indicator Overlay */}
                                    {canAssign && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            backgroundColor: isDisabled ? '#64748b' : (isAssignedToThisSpool ? '#ef4444' : '#3b82f6'),
                                            color: 'white',
                                            fontSize: '0.6rem',
                                            padding: '2px 6px',
                                            borderBottomLeftRadius: '6px',
                                            fontWeight: 'bold'
                                        }}>
                                            {isDisabled
                                                ? 'BLOQUEADO'
                                                : (isAssignedToThisSpool ? 'DESVINCULAR' : 'ASIGNAR')}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            color: isAssigned ? (isActiveHighlight ? '#d8b4fe' : baseColor) : 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem'
                                        }}>
                                            {spool.name}
                                        </span>
                                        {spool.tag && (
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                color: '#d8b4fe',
                                                backgroundColor: 'rgba(126, 34, 206, 0.2)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                {spool.tag}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: isAssigned ? '#cbd5e1' : '#94a3b8'
                                        }}>
                                            {isAssigned
                                                ? (isSelectedInModel ? '✨ Seleccionado' : (isActiveHighlight ? '👁️ Destacado' : `${assignments[spool.id].length} elementos`))
                                                : 'Sin modelo'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                        {spool.location ? (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                color: '#cbd5e1',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                📍 {spool.location.code}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                                                Sin ubicación
                                            </span>
                                        )}

                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: spool.status === 'PENDING' ? '#94a3b8' : (spool.status === 'INSTALLED' ? '#4ade80' : '#60a5fa'),
                                            backgroundColor: 'rgba(0,0,0,0.2)', // Darker badge for contrast
                                            padding: '2px 8px',
                                            borderRadius: '99px',
                                            border: `1px solid ${spool.status === 'PENDING' ? '#475569' : (spool.status === 'INSTALLED' ? '#22c55e' : '#3b82f6')}`
                                        }}>
                                            {spool.status || 'PENDIENTE'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    padding: '8px 24px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between', // Align items to edges
                    alignItems: 'center',
                    backgroundColor: '#1e293b'
                }}>
                    {/* Left side: ISO Number and Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            ISO: <strong style={{ color: 'white' }}>{isoNumber}</strong>
                        </span>

                        {/* Viewer Toolbar Moved to Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#0f172a',
                            padding: '4px',
                            borderRadius: '8px',
                            border: '1px solid #334155'
                        }}>
                            <button
                                onClick={() => setMode('PAN')}
                                title="Mano (Pan)"
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: mode === 'PAN' ? '#3b82f6' : 'transparent',
                                    color: mode === 'PAN' ? 'white' : '#94a3b8',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem'
                                }}
                            >
                                🤚
                            </button>
                            <button
                                onClick={() => setMode('ORBIT')}
                                title="Orbita"
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: mode === 'ORBIT' ? '#3b82f6' : 'transparent',
                                    color: mode === 'ORBIT' ? 'white' : '#94a3b8',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem'
                                }}
                            >
                                🔄
                            </button>
                            <button
                                onClick={() => setTriggerFit(true)}
                                title="Zoom Fit"
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'transparent',
                                    color: '#94a3b8',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    borderLeft: '1px solid #334155',
                                    marginLeft: '4px',
                                    paddingLeft: '12px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                            >
                                🔍
                            </button>

                            {/* Structure Toggle */}
                            {/* Structure Toggle & Menu */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setIsStructureMenuOpen(!isStructureMenuOpen)}
                                    title="Filtrar Estructuras"
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: visibleStructureIds.length > 0 ? '#3b82f6' : 'transparent',
                                        color: visibleStructureIds.length > 0 ? 'white' : '#94a3b8',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        marginLeft: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    🏗️
                                    {visibleStructureIds.length > 0 && (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{visibleStructureIds.length}</span>
                                    )}
                                </button>

                                {/* Structure Selection Dropdown */}
                                {isStructureMenuOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '120%',
                                        right: 0,
                                        width: '280px',
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                        zIndex: 50,
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <div style={{
                                            padding: '4px 8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            color: '#cbd5e1',
                                            borderBottom: '1px solid #334155',
                                            marginBottom: '4px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>Capas Disponibles</span>
                                            {visibleStructureIds.length > 0 && (
                                                <button
                                                    onClick={() => setVisibleStructureIds([])}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#f87171',
                                                        fontSize: '0.7rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Ocultar Todo
                                                </button>
                                            )}
                                        </div>

                                        {structureModels.length === 0 ? (
                                            <div style={{ padding: '8px', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                                                No hay modelos de estructura disponibles.
                                            </div>
                                        ) : (
                                            structureModels.map(model => {
                                                const isVisible = visibleStructureIds.includes(model.id)
                                                return (
                                                    <div
                                                        key={model.id}
                                                        onClick={() => {
                                                            setVisibleStructureIds(prev =>
                                                                isVisible
                                                                    ? prev.filter(id => id !== model.id)
                                                                    : [...prev, model.id]
                                                            )
                                                        }}
                                                        style={{
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            backgroundColor: isVisible ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                                            border: `1px solid ${isVisible ? '#3b82f6' : 'transparent'}`,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            transition: 'all 0.1s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isVisible) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isVisible) e.currentTarget.style.backgroundColor = 'transparent'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '14px',
                                                            height: '14px',
                                                            borderRadius: '3px',
                                                            border: `1px solid ${isVisible ? '#60a5fa' : '#475569'}`,
                                                            backgroundColor: isVisible ? '#3b82f6' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            {isVisible && '✓'}
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.8rem',
                                                            color: isVisible ? 'white' : '#94a3b8',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {model.name}
                                                        </span>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteModel}
                                title="Eliminar Modelo"
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#f87171',
                                    border: '1px solid #7f1d1d',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginLeft: '12px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ef4444'
                                    e.currentTarget.style.color = 'white'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                                    e.currentTarget.style.color = '#f87171'
                                }}
                            >
                                🗑️
                            </button>

                            {/* Horizontal Speed Slider */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginLeft: '8px',
                                borderLeft: '1px solid #334155',
                                paddingLeft: '8px'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>⚡</span>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="2"
                                    step="0.1"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    style={{
                                        width: '80px',
                                        accentColor: '#3b82f6',
                                        height: '4px',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Selection Hint - NO ANIMATION */}
                        {selectedIds.length > 0 && (
                            <span style={{
                                color: '#f59e0b',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                border: '1px solid #f59e0b',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(245, 158, 11, 0.1)'
                            }}>
                                🖱️ Click en Spool para asignar <span style={{ opacity: 0.7, marginLeft: '8px', fontWeight: 'normal' }}>| Mantén CTRL para sumar</span>
                            </span>
                        )}
                    </div>

                    {/* Right side: Exit Button */}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '6px 14px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                        ✕ Salir
                    </button>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <IsometricViewer
                        modelUrl={modelUrl}
                        spools={spools}
                        structureModels={structureModels.filter(m => visibleStructureIds.includes(m.id))}
                        showStructure={visibleStructureIds.length > 0}
                        initialModelData={modelData}
                        onSaveData={async (data) => {
                            const { updateModelDataAction } = await import('@/actions/revisions')
                            await updateModelDataAction(revisionId, data)
                        }}
                        // Control Props
                        mode={mode}
                        speed={speed}
                        triggerFit={triggerFit}
                        onFitComplete={() => setTriggerFit(false)}
                        // Assignment Props
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        assignments={assignments}
                        spoolColors={spoolColors}
                        highlightedIds={highlightedIds}
                    />
                </div>
            </div>
        </div>
    )

    // Render Portal
    if (typeof window === 'object') {
        return createPortal(content, document.body)
    }
    return null
}


interface IsometricRevisionCardProps {
    isoNumber: string
    revisions: EngineeringRevision[]
    currentRevision: EngineeringRevision | null
    stats: {
        total: number
        vigentes: number
        spooleadas: number
        obsoletas: number
    }
    onRefresh?: () => void
}

export default function IsometricRevisionCard({
    isoNumber,
    revisions,
    currentRevision,
    stats,
    onRefresh
}: IsometricRevisionCardProps) {
    const router = useRouter()
    const [isExpanded, setIsExpanded] = useState(false)
    const [openRevId, setOpenRevId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState<string | null>(null)
    const [revisionStatuses, setRevisionStatuses] = useState<Record<string, { data: DataStatus; material: MaterialStatus; fabricable: boolean }>>({})
    const [uploadInputRevId, setUploadInputRevId] = useState<string | null>(null)
    const [show3DMenu, setShow3DMenu] = useState<string | null>(null)
    const [viewerModalRevision, setViewerModalRevision] = useState<{
        id: string
        glbUrl: string
        modelData: any
        isoNumber: string
        projectId: string
    } | null>(null)

    // Load fabricability statuses
    useEffect(() => {
        async function loadStatuses() {
            const statuses: Record<string, { data: DataStatus; material: MaterialStatus; fabricable: boolean }> = {}
            for (const rev of revisions) {
                try {
                    const data = await calculateDataStatus(rev.id)
                    const material = await calculateMaterialStatus(rev.id)
                    const fab = await isFabricable(rev.id)
                    statuses[rev.id] = { data, material, fabricable: fab.fabricable }
                } catch (error) {
                    console.error(`Error loading status for revision ${rev.id}:`, error)
                }
            }
            setRevisionStatuses(statuses)
        }
        if (revisions.length > 0) {
            loadStatuses()
        }
    }, [revisions])

    // Sort revisions falling back to date or code, usually they come sorted but good to be safe
    // Assuming higher rev code is newer.
    const sortedRevisions = [...revisions].sort((a, b) => {
        return b.rev_code.localeCompare(a.rev_code, undefined, { numeric: true, sensitivity: 'base' })
    })

    // DEBUG: Log revision data to see if counts are coming from backend
    useEffect(() => {
        if (revisions.length > 0) {
            console.log('[IsometricRevisionCard] Revisions data:', revisions.map(r => ({
                rev_code: r.rev_code,
                welds_count: r.welds_count,
                spools_count: r.spools_count,
                status: r.revision_status
            })))
        }
    }, [revisions])

    const statusColors: Record<string, string> = {
        'VIGENTE': '#3b82f6',      // Blue
        'PENDING': '#fbbf24',      // Yellow
        'SPOOLEADO': '#10b981',    // Green
        'APLICADO': '#8b5cf6',     // Purple
        'OBSOLETA': '#6b7280',     // Gray
        'ELIMINADO': '#ef4444'     // Red
    }

    const currentStatus = currentRevision?.revision_status || 'DESCONOCIDO'
    const statusColor = statusColors[currentStatus] || '#94a3b8'

    const handleDelete = async (revId: string, revCode: string) => {
        const message = '¿Estás seguro de eliminar la Revisión ' + revCode + '?\n\nSi borras la revisión vigente, la anterior pasará a ser la vigente automáticamente.';
        if (!window.confirm(message)) {
            return
        }

        setIsDeleting(revId)
        try {
            const result = await deleteRevisionAction(revId)
            if (result.success) {
                router.refresh() // Keep this for good measure for server data
                if (onRefresh) onRefresh() // Trigger parent refresh
            } else {
                alert(result.message)
            }
        } catch (error) {
            console.error('Error deleting revision:', error)
            alert('Error al eliminar la revisión')
        } finally {
            setIsDeleting(null)
        }
    }

    const handleUploadClick = (revId: string) => {
        setUploadInputRevId(revId === uploadInputRevId ? null : revId)
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, revId: string, isoNumber: string, revCode: string) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.glb')) {
            alert('Solo se permiten archivos .glb')
            return
        }

        setIsUploading(revId)
        try {
            // 1. Rename file (Add random suffix to avoid caching/collision)
            const uniqueSuffix = Math.random().toString(36).substring(2, 7)
            const newFileName = `${isoNumber}-${revCode}-${uniqueSuffix}.glb`

            // 2. Upload to Supabase Storage
            const supabase = createClient()
            const { data, error: uploadError } = await supabase
                .storage
                .from('isometric-models')
                .upload(newFileName, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError)
                throw new Error(uploadError.message)
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('isometric-models')
                .getPublicUrl(newFileName)

            // 3. Update Revision Record (Server Action)
            const result = await updateRevisionModelUrlAction(revId, publicUrl)

            if (!result.success) {
                throw new Error(result.message)
            }

            alert('Modelo subido exitosamente')
            setUploadInputRevId(null)
            if (onRefresh) onRefresh()

        } catch (error) {
            console.error('Error uploading model:', error)
            alert('Error al subir el modelo')
        } finally {
            setIsUploading(null)
        }
    }

    return (
        <div className="isometric-card">
            {/* Header / Summary */}
            <div className="isometric-card-header">
                <div className="header-main">
                    <div className="iso-identity">
                        <div className="iso-icon">📐</div>
                        <div className="iso-info">
                            <h3>{isoNumber}</h3>
                            <span
                                className="current-status-badge"
                                style={{ background: statusColor }}
                            >
                                {currentStatus} {currentRevision ? `- Rev ${currentRevision.rev_code} ` : ''}
                            </span>
                        </div>
                    </div>

                    <div className="iso-quick-stats">
                        <div className="quick-stat" title="Total Revisiones">
                            <span className="label">Total</span>
                            <span className="value">{stats.total}</span>
                        </div>
                        {stats.obsoletas > 0 && (
                            <div className="quick-stat warning" title="Obsoletas">
                                <span className="label">Obs.</span>
                                <span className="value">{stats.obsoletas}</span>
                            </div>
                        )}
                        <div className="quick-stat info" title="Revisiones Spooleadas">
                            <span className="label">Spooleadas</span>
                            <span className="value">{stats.spooleadas}</span>
                        </div>
                    </div>
                </div>

                <div className="card-controls">
                    {/* Could add bulk actions here */}

                    <button
                        className={`btn-expand ${isExpanded ? 'active' : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Ocultar Historial' : 'Ver Historial'}
                        <span className="chevron">▼</span>
                    </button>
                </div>
            </div>

            {/* Expanded History */}
            {
                isExpanded && (
                    <div className="isometric-history">
                        <div className="history-table-wrapper">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Rev</th>
                                        <th>Estado</th>
                                        <th>Datos</th>
                                        <th>Material</th>
                                        <th>Fab</th>
                                        <th>F. Anuncio</th>
                                        <th>Uniones</th>
                                        <th>Spools</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRevisions.map(rev => (
                                        <Fragment key={rev.id}>
                                            <tr className={rev.id === currentRevision?.id ? 'active-row' : ''}>
                                                <td className="col-rev">
                                                    <span className="rev-circle">{rev.rev_code}</span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{
                                                            color: statusColors[rev.revision_status] || '#ccc',
                                                            borderColor: statusColors[rev.revision_status] || '#ccc',
                                                            background: `${statusColors[rev.revision_status] || '#ccc'} 15` // 15 = hex opacity approx 8%
                                                        }}
                                                    >
                                                        {rev.revision_status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: revisionStatuses[rev.id]?.data === 'COMPLETO' ? '#10b981' : '#fbbf24',
                                                            borderColor: revisionStatuses[rev.id]?.data === 'COMPLETO' ? '#10b981' : '#fbbf24'
                                                        }}
                                                    >
                                                        {revisionStatuses[rev.id]?.data || '...'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="status-pill"
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: revisionStatuses[rev.id]?.material === 'DISPONIBLE' ? '#10b981' : '#6b7280',
                                                            borderColor: revisionStatuses[rev.id]?.material === 'DISPONIBLE' ? '#10b981' : '#6b7280'
                                                        }}
                                                    >
                                                        {revisionStatuses[rev.id]?.material || '...'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                                                    {revisionStatuses[rev.id]?.fabricable ? '🟢' : '🔴'}
                                                </td>
                                                <td title={rev.transmittal ? `TML: ${rev.transmittal}` : 'Sin transmittal'}>
                                                    <span style={{ fontSize: '0.9rem' }}>
                                                        {rev.announcement_date
                                                            ? new Date(rev.announcement_date).toLocaleDateString('es-CL')
                                                            : '-'
                                                        }
                                                    </span>
                                                    {rev.transmittal && (
                                                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>
                                                            {rev.transmittal}
                                                        </div>
                                                    )}
                                                </td>
                                                <td><strong>{rev.welds_count || 0}</strong></td>
                                                <td><strong>{rev.spools_count || 0}</strong></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="action-group">
                                                        <button
                                                            className="btn-icon-secondary"
                                                            onClick={() => setOpenRevId(openRevId === rev.id ? null : rev.id)}
                                                            title="Ver detalles"
                                                            style={{
                                                                marginRight: '5px',
                                                                transform: openRevId === rev.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s ease',
                                                                color: 'white',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            ▼
                                                        </button>

                                                        {/* Upload / View Model Button */}
                                                        {/* 3D Model Status/Action Button */}
                                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (rev.glb_model_url) {
                                                                        // Direct Viewer Open
                                                                        setViewerModalRevision({
                                                                            id: rev.id,
                                                                            glbUrl: rev.glb_model_url!,
                                                                            modelData: rev.model_data,
                                                                            isoNumber: isoNumber,
                                                                            projectId: rev.project_id // Will be fixed in backend
                                                                        })
                                                                    } else {
                                                                        handleUploadClick(rev.id)
                                                                    }
                                                                }}
                                                                style={{
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    color: rev.glb_model_url ? '#22c55e' : '#94a3b8',
                                                                    backgroundColor: 'transparent',
                                                                    marginRight: '5px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (rev.glb_model_url) {
                                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'
                                                                    } else {
                                                                        e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.5)'
                                                                        e.currentTarget.style.color = '#cbd5e1'
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent'
                                                                    e.currentTarget.style.color = rev.glb_model_url ? '#22c55e' : '#94a3b8'
                                                                }}
                                                                title={rev.glb_model_url ? 'Ver Modelo 3D' : 'Cargar Modelo 3D'}
                                                            >
                                                                3D
                                                            </button>
                                                        </div>

                                                        <button
                                                            className="btn-icon-danger"
                                                            onClick={() => handleDelete(rev.id, rev.rev_code)}
                                                            disabled={isDeleting === rev.id}
                                                            title="Eliminar Revisión"
                                                        >
                                                            {isDeleting === rev.id ? '...' : '🗑️'}
                                                        </button>
                                                    </div>

                                                    {/* Hidden File Input (conditionally rendered) */}
                                                    {uploadInputRevId === rev.id && (
                                                        <div style={{ position: 'absolute', right: '40px', marginTop: '30px', background: '#1e293b', padding: '5px', borderRadius: '4px', border: '1px solid #334155', zIndex: 50 }}>
                                                            <input
                                                                type="file"
                                                                accept=".glb"
                                                                className="text-xs text-white"
                                                                onChange={(e) => handleFileChange(e, rev.id, isoNumber, rev.rev_code)}
                                                            />
                                                            <button onClick={() => setUploadInputRevId(null)} style={{ marginLeft: '5px', color: '#ef4444' }}>✕</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {openRevId === rev.id && (
                                                <tr>
                                                    <td colSpan={9} style={{ padding: 0, borderBottom: 'none' }}>
                                                        <RevisionMasterView
                                                            revisionId={rev.id}
                                                            projectId={rev.project_id}
                                                            glbModelUrl={rev.glb_model_url}
                                                            modelData={rev.model_data}
                                                        // TODO: Pass spools data here. For now it will prompt empty list.
                                                        // Ideally we fetch spools in MasterView or lift state.
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}


                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Fullscreen 3D Viewer Modal - Portal handled inside Wrapper */}
            {viewerModalRevision && (
                <IsometricViewerWrapper
                    revisionId={viewerModalRevision.id}
                    modelUrl={viewerModalRevision.glbUrl}
                    initialModelData={viewerModalRevision.modelData}
                    isoNumber={viewerModalRevision.isoNumber}
                    projectId={viewerModalRevision.projectId}
                    onClose={() => setViewerModalRevision(null)}
                    onSave={onRefresh}
                />
            )}
        </div >
    )
}
