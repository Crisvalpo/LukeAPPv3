'use client'

import React, { useEffect, useState, useRef, useMemo, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { EngineeringRevision } from '@/types'
import {
    deleteRevisionAction,
    updateRevisionModelUrlAction,
    deleteRevisionModelUrlAction,
    updateRevisionPdfUrlAction,
    deleteRevisionPdfUrlAction,
    deleteRevisionModelAction
} from '@/actions/revisions'
import { calculateDataStatus, calculateMaterialStatus, isFabricable, type DataStatus, type MaterialStatus } from '@/services/fabricability'
import RevisionMasterView from './RevisionMasterView'
import IsometricViewer from './viewer/IsometricViewer'
import JointDetailModal from './viewer/JointDetailModal'
import WeldDetailModal from './viewer/WeldDetailModal'
import SpoolExpandedContent from './viewer/SpoolExpandedContent'
import UnassignedJointsPanel from './viewer/UnassignedJointsPanel'
import { assignJointToSpoolAction } from '@/actions/joints'
import { FileText, Trash2, ExternalLink, Box, Wrench, Split } from 'lucide-react'
import { SplitSpoolModal } from './viewer/SplitSpoolModal'
import { createClient } from '@/lib/supabase/client'

// Wrapper to load spools for viewer and handle fullscreen portal
function IsometricViewerWrapper({
    revisionId,
    modelUrl,
    initialModelData,
    isoNumber,
    projectId,
    pdfUrl,
    onClose,
    onSave
}: {
    revisionId: string
    modelUrl: string
    initialModelData: any
    isoNumber: string
    projectId: string
    pdfUrl?: string | null
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

    // Layout State (FULL | SPLIT_HORIZONTAL | SPLIT_VERTICAL)
    // Default to FULL as requested
    const [layout, setLayout] = useState<'FULL' | 'SPLIT_HORIZONTAL' | 'SPLIT_VERTICAL'>('FULL')

    // Split Ratio State (0.1 to 0.9, default 0.5)
    const [splitRatio, setSplitRatio] = useState(0.5)
    // Ref for the container to calculate percentages
    const containerRef = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)
    const [isDragging, setIsDragging] = useState(false) // Trigger re-render for pointerEvents

    // Cycle Layout: FULL -> SPLIT_HORIZONTAL -> SPLIT_VERTICAL -> FULL
    const toggleLayout = () => {
        if (!pdfUrl) return
        setLayout(prev => {
            if (prev === 'FULL') return 'SPLIT_HORIZONTAL'
            if (prev === 'SPLIT_HORIZONTAL') return 'SPLIT_VERTICAL'
            return 'FULL' // from VERTICAL or others
        })
        // Reset ratio on toggle for better UX? Or keep it? Keeping it for now.
    }

    // Resizing Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        isDraggingRef.current = true
        setIsDragging(true)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        let newRatio = 0.5

        if (layout === 'SPLIT_HORIZONTAL') {
            const offsetY = e.clientY - rect.top
            newRatio = offsetY / rect.height
        } else if (layout === 'SPLIT_VERTICAL') {
            const offsetX = e.clientX - rect.left
            newRatio = offsetX / rect.width
        }

        // Clamp ratio between 10% and 90%
        if (newRatio < 0.1) newRatio = 0.1
        if (newRatio > 0.9) newRatio = 0.9

        setSplitRatio(newRatio)
    }

    const handleMouseUp = () => {
        isDraggingRef.current = false
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    }

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // Selection & Assignment State
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [modelData, setModelData] = useState<any>(initialModelData || {})

    // Welds Expansion State
    const [expandedSpoolId, setExpandedSpoolId] = useState<string | null>(null)
    const [weldsMap, setWeldsMap] = useState<Record<string, any[]>>({})
    const [jointsMap, setJointsMap] = useState<Record<string, any[]>>({}) // New: Bolts/Joints
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({}) // New: Loading state per spool
    const [selectedWeldForDetail, setSelectedWeldForDetail] = useState<any | null>(null)
    const [selectedJointForDetail, setSelectedJointForDetail] = useState<any | null>(null)
    const [weldTypesConfig, setWeldTypesConfig] = useState<Record<string, any>>({})



    // PDF Handlers (Keep existing)
    // Derived: assignment map and colors
    const assignments = modelData?.spool_assignments || {}
    const spoolColors = React.useMemo(() => {
        const colors: Record<string, string> = {}
        spools.forEach(s => {
            // Color based on Status
            if (s.status === 'INSTALLED') {
                colors[s.id] = '#4ade80' // Green-400
            } else if (s.status === 'FABRICATED' || s.status === 'DISPATCHED') {
                colors[s.id] = '#3b82f6' // Blue-500 (Stronger Blue for Finished)
            } else if (s.status === 'IN_FABRICATION') {
                colors[s.id] = '#38bdf8' // Sky-400 (Light Blue for In Progress)
            } else {
                colors[s.id] = '#facc15' // Yellow-400 (Pending/Default)
            }
        })
        return colors
    }, [spools])

    const spoolStatuses = React.useMemo(() => {
        const statuses: Record<string, string> = {}
        spools.forEach(s => {
            statuses[s.id] = s.status || 'PENDING'
        })
        return statuses
    }, [spools])

    // Spool Activation State (Highlighting)
    const [activeSpoolId, setActiveSpoolId] = useState<string | null>(null)
    const highlightedIds = useMemo(() => {
        if (!activeSpoolId) return []
        return assignments[activeSpoolId] || []
    }, [activeSpoolId, assignments])

    // Unassigned Joints Panel State
    const [showJointsPanel, setShowJointsPanel] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [unassignedJointsCount, setUnassignedJointsCount] = useState<number | null>(null)
    const [isSplitting, setIsSplitting] = useState(false)

    // Separate function to refresh weld types config
    const refreshWeldTypesConfig = async () => {
        try {
            const supabase = createClient()
            const { data } = await supabase
                .from('project_weld_type_config')
                .select('type_code, requires_welder, icon, color, type_name_es')
                .eq('project_id', projectId)

            if (data) {
                const configMap: Record<string, any> = {}
                data.forEach((config: any) => {
                    configMap[config.type_code] = config
                })
                setWeldTypesConfig(configMap)
            }
        } catch (error) {
            console.error('Error refreshing weld types config:', error)
        }
    }

    useEffect(() => {
        async function fetchContext() {
            try {
                // Parallel fetch for spools, structure models, and weld types config
                const { getRevisionSpoolsAction } = await import('@/actions/revisions')
                const { getStructureModelsAction } = await import('@/actions/structure-models')
                const supabase = createClient()

                const [spoolsData, modelsResult, weldTypesResult, jointsCountResult] = await Promise.all([
                    getRevisionSpoolsAction(revisionId),
                    getStructureModelsAction(projectId),
                    supabase
                        .from('project_weld_type_config')
                        .select('type_code, requires_welder, icon, color, type_name_es')
                        .eq('project_id', projectId),
                    supabase
                        .from('spools_joints')
                        .select('*', { count: 'exact', head: true })
                        .eq('revision_id', revisionId)
                        .is('spool_id', null)
                ])

                setSpools(spoolsData || [])
                setUnassignedJointsCount(jointsCountResult.count ?? 0)

                if (modelsResult.success && modelsResult.data) {
                    setStructureModels(modelsResult.data)
                } else {
                    console.warn('⚠️ No structure models found or error:', modelsResult)
                }

                // Build weld types config map
                if (weldTypesResult.data) {
                    const configMap: Record<string, any> = {}
                    weldTypesResult.data.forEach((config: any) => {
                        configMap[config.type_code] = config
                    })
                    setWeldTypesConfig(configMap)
                }
            } catch (error) {
                console.error('Error loading viewer context:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchContext()
    }, [revisionId, projectId])

    // Auto-refresh weld config when window becomes visible (after user edits config in another tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshWeldTypesConfig()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [projectId])

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

    const handleToggleExpand = async (spoolId: string, spoolNumber: string) => {
        // Toggle collapse
        if (expandedSpoolId === spoolId) {
            setExpandedSpoolId(null)
            return
        }

        // Expand
        setExpandedSpoolId(spoolId)

        // If data already cached, don't refetch
        if (weldsMap[spoolId] && jointsMap[spoolId]) return

        setLoadingMap(prev => ({ ...prev, [spoolId]: true }))

        try {
            const supabase = createClient()

            // Parallel Fetch: Welds & Joints
            // Note: Welds currently linked by revision_id + spool_number (Legacy?)
            // Joints are linked by spool_id if assigned, or we might need fallback logic? 
            // For now, assuming spool_id is reliable for Joints as per schema.
            // Actually, let's use the same pattern for Welds to be safe (rev + spool_number) 
            // and assume Joints use spool_id or typical keys.
            // Checking schema implies spools_joints are linked via spool_id if processed.

            const [weldsRes, jointsRes] = await Promise.all([
                supabase
                    .from('spools_welds')
                    .select('*')
                    .eq('revision_id', revisionId)
                    .eq('spool_number', spoolNumber)
                    .order('weld_number'),
                supabase
                    .from('spools_joints')
                    .select('*')
                    .eq('revision_id', revisionId)
                    // Try matching by spool_id first (ideal)
                    // If that fails in future users might want number matching, but for now ID is safest if populated.
                    .eq('spool_id', spoolId)
                    .order('flanged_joint_number', { ascending: true })
            ])

            setWeldsMap(prev => ({ ...prev, [spoolId]: weldsRes.data || [] }))
            setJointsMap(prev => ({ ...prev, [spoolId]: jointsRes.data || [] }))

            if (weldsRes.error) console.error('Error fetching welds:', weldsRes.error)
            if (jointsRes.error) console.error('Error fetching joints:', jointsRes.error)

        } catch (error) {
            console.error('Error loading spool details:', error)
            setWeldsMap(prev => ({ ...prev, [spoolId]: [] }))
            setJointsMap(prev => ({ ...prev, [spoolId]: [] }))
        } finally {
            setLoadingMap(prev => ({ ...prev, [spoolId]: false }))
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

    // Drop Handler for assigning Joints to Spools
    const handleJointDrop = async (e: React.DragEvent, spoolId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const jointId = e.dataTransfer.getData('jointId')
        const jointNumber = e.dataTransfer.getData('jointNumber')

        if (!jointId) return

        if (confirm(`¿Asignar junta ${jointNumber} a este spool?`)) {
            const res = await assignJointToSpoolAction(jointId, spoolId)
            if (res.success) {
                // Refresh unassigned list
                setRefreshTrigger(prev => prev + 1)
                setUnassignedJointsCount(prev => {
                    const next = (prev || 0) - 1
                    if (next <= 0) setShowJointsPanel(false)
                    return next < 0 ? 0 : next
                })
                // Force refresh of spool's expanded content if open (clear cache)
                setJointsMap(prev => {
                    const next = { ...prev }
                    delete next[spoolId] // Remove from cache to force refetch on next expand
                    return next
                })
                // Also trigger expand refresh immediately if currently expanded
                if (expandedSpoolId === spoolId) {
                    handleToggleExpand(spoolId, '') // Refetch
                }
            } else {
                alert('Error al asignar: ' + res.message)
            }
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
                            let baseColor = '#facc15' // Default Yellow (Pending)
                            let baseBg = 'rgba(250, 204, 21, 0.1)'
                            let baseBorder = '#eab308'

                            if (spool.status === 'INSTALLED') {
                                baseColor = '#4ade80' // Green
                                baseBg = 'rgba(74, 222, 128, 0.1)'
                                baseBorder = '#22c55e'
                            } else if (spool.status === 'FABRICATED' || spool.status === 'DISPATCHED') {
                                baseColor = '#3b82f6' // Blue-500
                                baseBg = 'rgba(59, 130, 246, 0.1)'
                                baseBorder = '#2563eb'
                            } else if (spool.status === 'IN_FABRICATION') {
                                baseColor = '#38bdf8' // Sky-400
                                baseBg = 'rgba(56, 189, 248, 0.1)'
                                baseBorder = '#0ea5e9'
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
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = 'move'
                                        e.currentTarget.style.border = '2px dashed #3b82f6'
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.border = isAssigned
                                            ? (isSelectedInModel || isActiveHighlight ? `2px solid ${baseBorder}` : `1px solid ${baseBorder}`)
                                            : (isDisabled ? '1px solid #475569' : '1px solid #334155')
                                    }}
                                    onDrop={(e) => handleJointDrop(e, spool.id)}
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

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {/* Isometric Box Icon - Only if assigned */}
                                            {isAssigned && (
                                                <Box size={14} color="#94a3b8" />
                                            )}

                                            {/* Status Badge */}
                                            <span style={{
                                                fontSize: '0.7rem',
                                                color: spool.status === 'PENDING' ? '#94a3b8' : (spool.status === 'INSTALLED' ? '#4ade80' : '#60a5fa'),
                                                backgroundColor: 'rgba(0,0,0,0.2)',
                                                padding: '2px 8px',
                                                borderRadius: '99px',
                                                border: `1px solid ${spool.status === 'PENDING' ? '#475569' : (spool.status === 'INSTALLED' ? '#22c55e' : '#3b82f6')}`
                                            }}>
                                                {{
                                                    'PENDING': 'PENDIENTE',
                                                    'IN_FABRICATION': 'EN FABRICACIÓN',
                                                    'FABRICATED': 'FABRICADO',
                                                    'PAINTING': 'PINTURA',
                                                    'SHIPPED': 'DESPACHADO',
                                                    'DELIVERED': 'ENTREGADO',
                                                    'INSTALLED': 'INSTALADO',
                                                    'COMPLETED': 'COMPLETADO'
                                                }[spool.status as string] || spool.status || 'PENDIENTE'}
                                            </span>

                                            {/* Expand Button (Repositioned) */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleToggleExpand(spool.id, spool.name)
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: '#94a3b8',
                                                    transition: 'color 0.2s',
                                                    marginLeft: '4px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                            >
                                                {expandedSpoolId === spool.id ? '▼' : '▶'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expandable Welds List */}
                                    {expandedSpoolId === spool.id && (
                                        <SpoolExpandedContent
                                            spool={spool}
                                            isoNumber={isoNumber}
                                            projectId={projectId}
                                            welds={weldsMap[spool.id] || []}
                                            joints={jointsMap[spool.id] || []}
                                            // Pass Child Spools if this is a Parent
                                            childSpools={spools.filter((s: any) => s.parent_spool_id === spool.id)}

                                            weldTypesConfig={weldTypesConfig}
                                            loading={loadingMap[spool.id] || false}
                                            onWeldClick={(weldData) => {
                                                console.log('🔥 Weld clicked:', weldData.weld_number)
                                                console.log('📦 Setting weld data:', weldData)
                                                setSelectedWeldForDetail(weldData)
                                            }}
                                            onJointClick={(joint) => setSelectedJointForDetail(joint)}
                                        />
                                    )}
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


                        {/* Split Spool Button (When Spool Selected) */}
                        {activeSpoolId && (
                            <button
                                onClick={() => setIsSplitting(true)}
                                title="Dividir Spool"
                                style={{
                                    background: isSplitting ? '#3b82f6' : 'transparent',
                                    color: isSplitting ? 'white' : '#94a3b8',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    marginLeft: '8px',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                onMouseLeave={(e) => !isSplitting && (e.currentTarget.style.color = '#94a3b8')}
                            >
                                <Split size={16} />
                            </button>
                        )}


                        {/* Unassigned Joints Toggle */}
                        {(unassignedJointsCount ?? 0) > 0 && (
                            <button
                                onClick={() => setShowJointsPanel(!showJointsPanel)}
                                title={showJointsPanel ? "Ocultar Juntas" : `Asignar Juntas (${unassignedJointsCount})`}
                                style={{
                                    background: showJointsPanel ? '#3b82f6' : 'transparent',
                                    color: showJointsPanel ? 'white' : '#94a3b8',
                                    border: '1px solid #334155',
                                    borderRadius: '4px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    marginLeft: '8px',
                                    position: 'relative'
                                }}
                            >
                                <Wrench size={16} />
                                {/* Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    borderRadius: '99px',
                                    padding: '0 4px',
                                    height: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {unassignedJointsCount}
                                </div>
                            </button>
                        )}

                        {/* Layout Toggle (Only if PDF exists) */}
                        {pdfUrl && (
                            <button
                                onClick={toggleLayout}
                                title={layout === 'FULL' ? 'Ver PDF y Modelo' : (layout === 'SPLIT_HORIZONTAL' ? 'Dividir Verticalmente' : 'Solo Modelo 3D')}
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                {layout === 'FULL' ? '📄' : (layout === 'SPLIT_HORIZONTAL' ? '◫' : '⊟')}
                            </button>
                        )}

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



                <div
                    ref={containerRef}
                    style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: layout === 'SPLIT_HORIZONTAL' ? 'column' : 'row',
                        overflow: 'hidden'
                    }}>
                    {/* Unassigned Joints Overlay Panel (Global) */}
                    {showJointsPanel && (
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            zIndex: 60,
                            boxShadow: '4px 0 15px rgba(0,0,0,0.5)'
                        }}>
                            <UnassignedJointsPanel
                                revisionId={revisionId}
                                onClose={() => setShowJointsPanel(false)}
                                refreshTrigger={refreshTrigger}
                            />
                        </div>
                    )}

                    {/* 3D Viewer Container */}
                    <div style={{
                        flex: layout === 'FULL' ? 1 : 'none', // If full take all, else rely heavily on width/height
                        height: layout === 'SPLIT_HORIZONTAL' ? `${splitRatio * 100}%` : '100%',
                        width: layout === 'SPLIT_VERTICAL' ? `${splitRatio * 100}%` : '100%',
                        position: 'relative',
                        borderBottom: layout === 'SPLIT_HORIZONTAL' ? '1px solid #334155' : 'none',
                        borderRight: layout === 'SPLIT_VERTICAL' ? '1px solid #334155' : 'none',
                    }}>


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
                            spoolStatuses={spoolStatuses}
                            highlightedIds={highlightedIds}
                        />
                    </div>

                    {/* Resizer Handle */}
                    {layout !== 'FULL' && (
                        <div
                            onMouseDown={handleMouseDown}
                            style={{
                                width: layout === 'SPLIT_VERTICAL' ? '8px' : '100%',
                                height: layout === 'SPLIT_HORIZONTAL' ? '8px' : '100%',
                                cursor: layout === 'SPLIT_VERTICAL' ? 'col-resize' : 'row-resize',
                                backgroundColor: '#0f172a',
                                borderLeft: layout === 'SPLIT_VERTICAL' ? '1px solid #334155' : 'none',
                                borderRight: layout === 'SPLIT_VERTICAL' ? '1px solid #334155' : 'none',
                                borderTop: layout === 'SPLIT_HORIZONTAL' ? '1px solid #334155' : 'none',
                                borderBottom: layout === 'SPLIT_HORIZONTAL' ? '1px solid #334155' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 50 // Above viewer/pdf
                            }}
                        >
                            {/* Visual Handle Dot */}
                            <div style={{
                                width: layout === 'SPLIT_VERTICAL' ? '4px' : '32px',
                                height: layout === 'SPLIT_HORIZONTAL' ? '4px' : '32px',
                                backgroundColor: '#475569',
                                borderRadius: '99px'
                            }} />
                        </div>
                    )}

                    {/* PDF Viewer (Only if not FULL) */}
                    {layout !== 'FULL' && pdfUrl && (
                        <div style={{
                            flex: 1, // Take remaining space
                            position: 'relative',
                            background: '#1e293b'
                        }}>
                            <iframe
                                src={pdfUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    // Disable pointer events during drag so dragging over iframe works
                                    pointerEvents: isDragging ? 'none' : 'auto'
                                }}
                                title="Plan PDF"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Weld Detail Modal */}
            {selectedWeldForDetail && (
                <WeldDetailModal
                    weld={selectedWeldForDetail}
                    weldTypeConfig={weldTypesConfig[selectedWeldForDetail.type_weld]}
                    onClose={() => setSelectedWeldForDetail(null)}
                    onUpdate={(updatedWeld) => {
                        const spoolId = updatedWeld.spool_id
                        if (spoolId && weldsMap[spoolId]) {
                            // 1. Update Weld in Cache
                            const updatedWelds = weldsMap[spoolId].map((w: any) =>
                                w.id === updatedWeld.id ? { ...w, ...updatedWeld } : w
                            )

                            setWeldsMap(prev => ({
                                ...prev,
                                [spoolId]: updatedWelds
                            }))

                            // 2. Check Spool Status Change (Optimistic)
                            // Robust Filter: Everything NOT Field is Shop.
                            const isField = (dest: string | null) => {
                                if (!dest) return false
                                const d = dest.toUpperCase()
                                return d === 'FIELD' || d === 'CAMPO' || d === 'F' || d === 'SITE'
                            }

                            const allWeldsForSpool = updatedWelds || []
                            // Filter Shop Welds (Not Field)
                            const shopWelds = allWeldsForSpool.filter((w: any) => !isField(w.destination))

                            // Valid Shop Welds (Not Deleted)
                            const validShopWelds = shopWelds.filter((w: any) => w.execution_status !== 'DELETED')

                            const executedCount = validShopWelds.filter((w: any) => ['EXECUTED', 'REWORK'].includes(w.execution_status)).length
                            const isFullyFabricated = validShopWelds.length > 0 && executedCount === validShopWelds.length
                            const isPartiallyFabricated = executedCount > 0 && !isFullyFabricated

                            setSpools(prevSpools => prevSpools.map(s => {
                                if (s.id === spoolId) {
                                    // 1. Upgrade to FABRICATED
                                    if (isFullyFabricated) {
                                        // Prevents upgrading if already in higher status
                                        if (['PENDING', 'IN_FABRICATION', null, undefined].includes(s.status)) {
                                            return { ...s, status: 'FABRICATED' }
                                        }
                                    }
                                    // 2. Set to IN_FABRICATION
                                    else if (isPartiallyFabricated) {
                                        // Allow upgrading from PENDING or downgrading from FABRICATED
                                        if (['PENDING', 'FABRICATED', undefined].includes(s.status)) {
                                            return { ...s, status: 'IN_FABRICATION' }
                                        }
                                    }
                                    // 3. Downgrade to PENDING
                                    else {
                                        if (['IN_FABRICATION', 'FABRICATED'].includes(s.status)) {
                                            return { ...s, status: 'PENDING' }
                                        }
                                    }
                                }
                                return s
                            }))
                        }
                    }}
                />
            )}

            {/* Joint Detail Modal */}
            {selectedJointForDetail && (
                <JointDetailModal
                    joint={{ ...selectedJointForDetail, project_id: projectId, iso_number: isoNumber }}
                    onClose={() => setSelectedJointForDetail(null)}
                    onUpdate={(updatedJoint) => {
                        setRefreshTrigger(prev => prev + 1)
                        // Optimistic Update for Joints Map
                        const spoolId = updatedJoint.spool_id
                        if (spoolId && jointsMap[spoolId]) {
                            const updatedJoints = jointsMap[spoolId].map((j: any) =>
                                j.id === updatedJoint.id ? { ...j, ...updatedJoint } : j
                            )
                            setJointsMap(prev => ({
                                ...prev,
                                [spoolId]: updatedJoints
                            }))
                        }
                    }}
                    onUnassign={() => {
                        setRefreshTrigger(prev => prev + 1)
                        setUnassignedJointsCount(prev => (prev ?? 0) + 1)
                    }}
                />
            )}

            <SplitSpoolModal
                isOpen={isSplitting}
                onClose={() => setIsSplitting(false)}
                spool={spools.find(s => s.id === activeSpoolId)}
                onSuccess={() => {
                    // Force Refresh entire context
                    // We can use router.refresh() but local state spools need update too
                    // Simplest is to reload page or re-trigger fetchContext
                    // We can check if `onRefresh` prop exists on parent wrapper? No, this is Wrapper.
                    // We'll trust router.refresh() + maybe imperative fetchContext if we extracted it.
                    // For now, reload window is safest for "Split" which is a major structural change.
                    window.location.reload()
                }}
            />
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

    // PDF Upload State
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const [uploadingPdfRevId, setUploadingPdfRevId] = useState<string | null>(null)

    // 3D Model Upload State (Refactored)
    const modelInputRef = useRef<HTMLInputElement>(null)
    const [uploadingModelRevId, setUploadingModelRevId] = useState<string | null>(null)

    // Actions Menu State
    const [openMenuRevId, setOpenMenuRevId] = useState<string | null>(null)

    // 3D Model Handlers
    const handleModelUploadClick = (revId: string) => {
        modelInputRef.current?.setAttribute('data-target-rev-id', revId)
        modelInputRef.current?.click()
    }

    const handleModelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        const targetRevId = e.target.getAttribute('data-target-rev-id')

        if (!file || !targetRevId) return

        setUploadingModelRevId(targetRevId)
        const rev = revisions.find(r => r.id === targetRevId)

        if (!rev) {
            setUploadingModelRevId(null)
            return
        }

        try {
            const supabase = createClient()
            const fileName = `model-${targetRevId}-${Date.now()}.glb`
            const filePath = `${rev.company_id}/${rev.project_id}/isometric-models/${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(filePath)

            // 3. Update DB
            const res = await updateRevisionModelUrlAction(targetRevId, publicUrl)
            if (!res.success) throw new Error(res.message)

            // 4. Success Feedback
            alert('✅ Modelo 3D cargado exitosamente')
            router.refresh()
            if (onRefresh) onRefresh()
        } catch (error: any) {
            console.error('Error uploading 3D model:', error)
            alert('Error al subir modelo: ' + (error.message || 'Error desconocido'))
        } finally {
            setUploadingModelRevId(null)
            if (modelInputRef.current) modelInputRef.current.value = ''
        }
    }

    const handlePdfUploadClick = (revId: string) => {
        // Store the target revision for the next file selection
        pdfInputRef.current?.setAttribute('data-target-rev-id', revId)
        pdfInputRef.current?.click()
    }

    const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        const targetRevId = e.target.getAttribute('data-target-rev-id')

        if (!file || !targetRevId) {
            // User cancelled or no target
            return
        }

        // NOW set loading state (file was selected)
        setUploadingPdfRevId(targetRevId)

        const rev = revisions.find(r => r.id === targetRevId)
        if (!rev) {
            setUploadingPdfRevId(null)
            return
        }

        try {
            const supabase = createClient()
            const fileName = `pdf-${targetRevId}-${Date.now()}.pdf`
            const filePath = `${rev.company_id}/${rev.project_id}/isometric-pdfs/${fileName}`

            // 1. Upload to Storage (Using project-files bucket)
            const { error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get URL
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(filePath)

            // 3. Update DB
            const res = await updateRevisionPdfUrlAction(targetRevId, publicUrl)
            if (!res.success) throw new Error(res.message)

            // 4. Success feedback
            alert('✅ PDF cargado exitosamente')
            router.refresh() // Force server-side data refresh
            if (onRefresh) onRefresh()
        } catch (error: any) {
            console.error('Error uploading PDF:', error)
            alert('Error al subir PDF: ' + (error.message || 'Error desconocido'))
        } finally {
            setUploadingPdfRevId(null)
            if (pdfInputRef.current) pdfInputRef.current.value = ''
        }
    }

    const handleDeleteModel = async (revId: string, modelUrl: string) => {
        if (!confirm('¿Estás seguro de eliminar el modelo 3D? Esta acción no se puede deshacer.')) {
            setOpenMenuRevId(null)
            return
        }

        try {
            const res = await deleteRevisionModelAction(revId, modelUrl)
            if (!res.success) {
                alert(res.message || 'Error al eliminar modelo')
                return
            }
            alert('✅ Modelo 3D eliminado exitosamente')
            router.refresh()
            if (onRefresh) onRefresh()
        } catch (error: any) {
            console.error('Error deleting model:', error)
            alert('Error al eliminar modelo: ' + (error.message || 'Error desconocido'))
        } finally {
            setOpenMenuRevId(null)
        }
    }

    const handleDeletePdf = async (revId: string, pdfUrl: string) => {
        if (!confirm('¿Eliminar este PDF?')) return
        try {
            const res = await deleteRevisionPdfUrlAction(revId, pdfUrl)
            if (res.success) {
                router.refresh() // Force server-side data refresh
                if (onRefresh) onRefresh()
            } else {
                alert(res.message)
            }
        } catch (error) {
            console.error('Error deleting PDF:', error)
            alert('Error al eliminar PDF')
        }
    }
    const [isExpanded, setIsExpanded] = useState(false)
    const [openRevId, setOpenRevId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [revisionStatuses, setRevisionStatuses] = useState<Record<string, { data: DataStatus; material: MaterialStatus; fabricable: boolean }>>({})
    const [show3DMenu, setShow3DMenu] = useState<string | null>(null)
    const [viewerModalRevision, setViewerModalRevision] = useState<{
        id: string
        glbUrl: string
        modelData: any
        isoNumber: string
        projectId: string
        pdfUrl?: string | null
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
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
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
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                        {/* Expand/Collapse */}
                                                        <button
                                                            className="btn-icon-secondary"
                                                            onClick={() => setOpenRevId(openRevId === rev.id ? null : rev.id)}
                                                            title="Ver detalles"
                                                            style={{
                                                                transform: openRevId === rev.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s ease',
                                                                color: 'white',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            ▼
                                                        </button>

                                                        {/* 3D Model Button */}
                                                        {/* 3D Model Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (uploadingModelRevId === rev.id) return
                                                                if (rev.glb_model_url) {
                                                                    // Direct Viewer Open
                                                                    setViewerModalRevision({
                                                                        id: rev.id,
                                                                        glbUrl: rev.glb_model_url!,
                                                                        modelData: rev.model_data,
                                                                        isoNumber: isoNumber,
                                                                        projectId: rev.project_id,
                                                                        pdfUrl: rev.pdf_url
                                                                    })
                                                                } else {
                                                                    handleModelUploadClick(rev.id)
                                                                }
                                                            }}
                                                            style={{
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                cursor: uploadingModelRevId === rev.id ? 'wait' : 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                color: uploadingModelRevId === rev.id ? '#fbbf24' : (rev.glb_model_url ? '#22c55e' : '#94a3b8'),
                                                                backgroundColor: uploadingModelRevId === rev.id ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                opacity: uploadingModelRevId === rev.id ? 0.7 : 1
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
                                                            title={uploadingModelRevId === rev.id ? 'Cargando Modelo...' : (rev.glb_model_url ? 'Ver Modelo 3D' : 'Cargar Modelo 3D')}
                                                            disabled={uploadingModelRevId === rev.id}
                                                        >
                                                            {uploadingModelRevId === rev.id ? (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                                                                </span>
                                                            ) : (
                                                                '3D'
                                                            )}
                                                        </button>

                                                        {/* PDF Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (uploadingPdfRevId === rev.id) return
                                                                if (rev.pdf_url) {
                                                                    window.open(rev.pdf_url, '_blank')
                                                                } else {
                                                                    handlePdfUploadClick(rev.id)
                                                                }
                                                            }}
                                                            style={{
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 'bold',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                cursor: uploadingPdfRevId === rev.id ? 'wait' : 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                color: uploadingPdfRevId === rev.id ? '#fbbf24' : (rev.pdf_url ? '#22c55e' : '#94a3b8'),
                                                                backgroundColor: uploadingPdfRevId === rev.id ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                opacity: uploadingPdfRevId === rev.id ? 0.7 : 1
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (rev.pdf_url) {
                                                                    e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'
                                                                } else {
                                                                    e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.5)'
                                                                    e.currentTarget.style.color = '#cbd5e1'
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent'
                                                                e.currentTarget.style.color = rev.pdf_url ? '#22c55e' : '#94a3b8'
                                                            }}
                                                            title={uploadingPdfRevId === rev.id ? 'Cargando PDF...' : (rev.pdf_url ? 'Ver PDF' : 'Cargar PDF')}
                                                            disabled={uploadingPdfRevId === rev.id}
                                                        >
                                                            {uploadingPdfRevId === rev.id ? (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                                                                </span>
                                                            ) : (
                                                                <FileText size={14} />
                                                            )}
                                                        </button>

                                                        {/* Options Menu Button */}
                                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setOpenMenuRevId(openMenuRevId === rev.id ? null : rev.id)
                                                                }}
                                                                style={{
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '1rem',
                                                                    fontWeight: 'bold',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    color: '#94a3b8',
                                                                    backgroundColor: openMenuRevId === rev.id ? 'rgba(71, 85, 105, 0.3)' : 'transparent'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.5)'
                                                                    e.currentTarget.style.color = '#cbd5e1'
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (openMenuRevId !== rev.id) {
                                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                                    }
                                                                    e.currentTarget.style.color = '#94a3b8'
                                                                }}
                                                                title="Más opciones"
                                                            >
                                                                ⋮
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {openMenuRevId === rev.id && (
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '100%',
                                                                        right: 0,
                                                                        marginTop: '4px',
                                                                        background: '#1e293b',
                                                                        border: '1px solid #475569',
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                                                        zIndex: 1000,
                                                                        minWidth: '180px',
                                                                        overflow: 'hidden'
                                                                    }}
                                                                >
                                                                    {/* Delete PDF */}
                                                                    {rev.pdf_url && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setOpenMenuRevId(null)
                                                                                handleDeletePdf(rev.id, rev.pdf_url!)
                                                                            }}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '10px 16px',
                                                                                border: 'none',
                                                                                background: 'transparent',
                                                                                color: '#ef4444',
                                                                                textAlign: 'left',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.875rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '8px',
                                                                                transition: 'background 0.15s'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                        >
                                                                            🗑️ Eliminar PDF
                                                                        </button>
                                                                    )}



                                                                    {/* Delete 3D Model */}
                                                                    {rev.glb_model_url && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setOpenMenuRevId(null)
                                                                                handleDeleteModel(rev.id, rev.glb_model_url!)
                                                                            }}
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '10px 16px',
                                                                                border: 'none',
                                                                                background: 'transparent',
                                                                                color: '#ef4444',
                                                                                textAlign: 'left',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.875rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '8px',
                                                                                transition: 'background 0.15s'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                        >
                                                                            🗑️ Eliminar Modelo 3D
                                                                        </button>
                                                                    )}

                                                                    {/* Delete Revision */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setOpenMenuRevId(null)
                                                                            handleDelete(rev.id, rev.rev_code)
                                                                        }}
                                                                        disabled={isDeleting === rev.id}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px 16px',
                                                                            border: 'none',
                                                                            background: 'transparent',
                                                                            color: '#ef4444',
                                                                            textAlign: 'left',
                                                                            cursor: isDeleting === rev.id ? 'not-allowed' : 'pointer',
                                                                            fontSize: '0.875rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            transition: 'background 0.15s',
                                                                            opacity: isDeleting === rev.id ? 0.5 : 1
                                                                        }}
                                                                        onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                        title="Eliminar Revisión"
                                                                    >
                                                                        {isDeleting === rev.id ? '⏳ Eliminando...' : '🗑️ Eliminar Revisión'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>


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

            {/* Hidden PDF Input */}
            <input
                type="file"
                ref={pdfInputRef}
                style={{ display: 'none' }}
                accept="application/pdf"
                onChange={handlePdfFileChange}
            />
            {/* Hidden 3D Model Input */}
            <input
                type="file"
                ref={modelInputRef}
                style={{ display: 'none' }}
                accept=".glb"
                onChange={handleModelFileChange}
            />

            {/* Fullscreen 3D Viewer Modal - Portal handled inside Wrapper */}
            {viewerModalRevision && (
                <IsometricViewerWrapper
                    revisionId={viewerModalRevision.id}
                    modelUrl={viewerModalRevision.glbUrl}
                    initialModelData={viewerModalRevision.modelData}
                    isoNumber={viewerModalRevision.isoNumber}
                    projectId={viewerModalRevision.projectId}
                    pdfUrl={viewerModalRevision.pdfUrl}
                    onClose={() => setViewerModalRevision(null)}
                    onSave={onRefresh}
                />
            )}
        </div >
    )
}
