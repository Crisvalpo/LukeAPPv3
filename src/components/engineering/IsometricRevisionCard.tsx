'use client'

import React, { useEffect, useState, useRef, useMemo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { getProjectFilePath } from '@/lib/storage-paths'
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
import { FileText, Trash2, ExternalLink, Box, Wrench, Split, Loader2, MoreVertical, ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SplitSpoolModal } from './viewer/SplitSpoolModal'
import { useViewerStore } from './viewer/ViewerLogic'

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
        <div className="fixed inset-0 z-[100000] flex flex-row bg-slate-900">
            {/* Sidebar for Viewer Context (Expanded Width for Spools) */}
            <div className="w-[300px] bg-slate-800 border-r border-slate-700 flex flex-col pt-0">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-xs">
                        3D
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-200 font-medium text-sm">
                            Spools ({spools.length})
                        </span>
                        {selectedIds.length > 0 && (
                            <span className="text-amber-500 text-xs font-semibold">
                                {selectedIds.length} elementos seleccionados
                            </span>
                        )}
                    </div>
                </div>

                {/* Spools List */}
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {loading ? (
                        <div className="text-slate-400 text-center mt-5 text-sm">
                            Cargando spools...
                        </div>
                    ) : spools.length === 0 ? (
                        <div className="text-slate-400 text-center mt-5 text-sm">
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

                            // Classes for styling based on state
                            let cardClasses = `mb-2 rounded-md p-2.5 transition-all duration-200 flex flex-col gap-1.5 relative overflow-hidden group border `

                            // Base styles
                            if (canAssign) {
                                if (isAssignedToThisSpool) {
                                    cardClasses += "bg-red-500/10 border-red-500/20 "
                                } else if (isAssigned) {
                                    cardClasses += "bg-slate-700/50 " // Will be overridden by status colors
                                } else {
                                    cardClasses += "bg-slate-700/50 border-slate-700 "
                                }
                            } else {
                                if (isAssigned) {
                                    cardClasses += "bg-slate-700/50 "
                                } else {
                                    cardClasses += "bg-slate-700/50 border-slate-700 "
                                }
                            }

                            // Dynamic Border & Shadow
                            if (isAssigned) {
                                if (isSelectedInModel || isActiveHighlight) {
                                    cardClasses += "border-2 shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.25)] "
                                    if (isActiveHighlight) cardClasses += "shadow-purple-500/40 border-purple-500 "
                                    else if (isSelectedInModel) cardClasses += "shadow-white/40 border-white/50 "
                                } else {
                                    cardClasses += "border-opacity-50 "
                                }
                            } else if (isDisabled) {
                                cardClasses += "border-slate-600 opacity-50 cursor-not-allowed "
                            } else {
                                cardClasses += "border-slate-700 cursor-pointer hover:border-slate-500 "
                            }

                            // Determine Status Colors for Badge & Border if assigned
                            const statusColorMap: Record<string, string> = {
                                'PENDING': 'text-slate-400 border-slate-600 bg-slate-800/50',
                                'IN_FABRICATION': 'text-sky-400 border-sky-500 bg-sky-500/10',
                                'FABRICATED': 'text-blue-500 border-blue-600 bg-blue-600/10',
                                'PAINTING': 'text-pink-400 border-pink-500 bg-pink-500/10',
                                'SHIPPED': 'text-indigo-400 border-indigo-500 bg-indigo-500/10',
                                'DELIVERED': 'text-cyan-400 border-cyan-500 bg-cyan-500/10',
                                'INSTALLED': 'text-green-400 border-green-500 bg-green-500/10',
                                'COMPLETED': 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
                            }
                            const statusStyle = statusColorMap[spool.status] || statusColorMap['PENDING']

                            // Dynamic Border Color integration
                            // This part is tricky with just classes because distinct colors map to distinct border classes
                            // We can use style for the specific color-dependent properties to keep it clean, OR use comprehensive map
                            // For simplicity, let's keep using style for the dynamic border/bg colors that depend on status heavily
                            // BUT we will use Tailwind for layout/spacing/typography.

                            // ... actually we can use Tailwind arbitrary values or just specific styles for the color bits
                            let statusBorderColor = '#eab308' // yellow
                            if (spool.status === 'INSTALLED') statusBorderColor = '#22c55e'
                            else if (spool.status === 'FABRICATED') statusBorderColor = '#2563eb'
                            else if (spool.status === 'IN_FABRICATION') statusBorderColor = '#0ea5e9'

                            // Override for Selection
                            if (isActiveHighlight) statusBorderColor = '#a855f7'

                            return (
                                <div
                                    key={spool.id}
                                    className={cardClasses}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = 'move'
                                        e.currentTarget.style.borderColor = '#3b82f6'
                                        e.currentTarget.style.borderStyle = 'dashed'
                                        e.currentTarget.style.borderWidth = '2px'
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.borderColor = isAssigned ? statusBorderColor : (isDisabled ? '#475569' : '#334155')
                                        e.currentTarget.style.borderStyle = 'solid'
                                        e.currentTarget.style.borderWidth = (isSelectedInModel || isActiveHighlight) ? '2px' : '1px'
                                    }}
                                    onDrop={(e) => {
                                        e.currentTarget.style.borderStyle = 'solid' // reset from dashed
                                        // Border width reset will happen on next render or mouse leave
                                        handleJointDrop(e, spool.id)
                                    }}
                                    style={{
                                        borderColor: isAssigned ? statusBorderColor : undefined,
                                        backgroundColor: isAssigned
                                            ? (isActiveHighlight ? 'rgba(168, 85, 247, 0.15)' : undefined)
                                            : undefined
                                        // We keep some inline styles for the dynamic status colors to avoid huge class maps
                                        // But we moved layout to classes
                                    }}
                                    onClick={() => !isDisabled && handleAssignToSpool(spool.id)}
                                >
                                    {/* Action Indicator Overlay */}
                                    {canAssign && (
                                        <div className={`absolute top-0 right-0 text-white text-[0.6rem] px-1.5 py-0.5 rounded-bl-md font-bold ${isDisabled ? 'bg-slate-500' : (isAssignedToThisSpool ? 'bg-red-500' : 'bg-blue-500')
                                            }`}>
                                            {isDisabled
                                                ? 'BLOQUEADO'
                                                : (isAssignedToThisSpool ? 'DESVINCULAR' : 'ASIGNAR')}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className={`font-bold text-sm ${isAssigned ? (isActiveHighlight ? 'text-purple-400' : 'text-white') : 'text-white' // assigned usually has color text but white looks better on dark
                                            }`}>
                                            {spool.name}
                                        </span>
                                        {spool.tag && (
                                            <span className="font-mono text-xs text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                                                {spool.tag}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-1">
                                        {spool.location ? (
                                            <span className="text-xs text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
                                                📍 {spool.location.code}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">
                                                Sin ubicación
                                            </span>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {/* Isometric Box Icon - Only if assigned */}
                                            {isAssigned && (
                                                <Box size={14} className="text-slate-400" />
                                            )}

                                            {/* Status Badge */}
                                            <span className={`text-[0.65rem] px-2 py-0.5 rounded-full border ${statusStyle}`}>
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
                                                className="bg-none border-none p-0 cursor-pointer flex items-center text-slate-400 transition-colors hover:text-white ml-1"
                                            >
                                                {expandedSpoolId === spool.id ? <ChevronDown size={14} /> : '▶'}
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
                                            onAssign={(type, id, targetSpoolId) => {
                                                console.log(`📦 Assigned ${type} ${id} to ${targetSpoolId}`)

                                                if (type === 'WELD') {
                                                    // Update Welds Map
                                                    // 1. Remove from Parent (current spool) cache
                                                    const parentId = spool.id
                                                    const parentWelds = weldsMap[parentId] || []

                                                    // Find the weld to move
                                                    const weldToMove = parentWelds.find((w: any) => w.id === id)

                                                    if (weldToMove) {
                                                        // A. Remove from Parent List
                                                        const newParentWelds = parentWelds.filter((w: any) => w.id !== id)

                                                        // B. Add to Child List (if initialized) or create
                                                        // Actually, we don't display child list in detail here yet 
                                                        // BUT removing it from Parent List is KEY for 'Pool' visualization

                                                        setWeldsMap(prev => ({
                                                            ...prev,
                                                            [parentId]: newParentWelds,
                                                            // Optionally add to target if we track it
                                                            [targetSpoolId]: [...(prev[targetSpoolId] || []), { ...weldToMove, spool_id: targetSpoolId }]
                                                        }))
                                                    }
                                                } else {
                                                    // Update JOINTS Map
                                                    const parentId = spool.id
                                                    const parentJoints = jointsMap[parentId] || []
                                                    const jointToMove = parentJoints.find((j: any) => j.id === id)

                                                    if (jointToMove) {
                                                        const newParentJoints = parentJoints.filter((j: any) => j.id !== id)

                                                        setJointsMap(prev => ({
                                                            ...prev,
                                                            [parentId]: newParentJoints,
                                                            [targetSpoolId]: [...(prev[targetSpoolId] || []), { ...jointToMove, spool_id: targetSpoolId }]
                                                        }))
                                                    }
                                                }
                                            }}
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
                    availableWeldTypes={Object.keys(weldTypesConfig)}
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
                    onUnassign={(unassignedSpoolId: string | null, unassignedJointId: string) => {
                        setRefreshTrigger(prev => prev + 1)
                        setUnassignedJointsCount(prev => (prev ?? 0) + 1)

                        // 3. Update Spool Map (Remove from Spool)
                        if (unassignedSpoolId && jointsMap[unassignedSpoolId]) {
                            const updatedJoints = jointsMap[unassignedSpoolId].filter((j: any) => j.id !== unassignedJointId)
                            setJointsMap(prev => ({
                                ...prev,
                                [unassignedSpoolId]: updatedJoints
                            }))
                        }
                    }}
                />
            )}

            <SplitSpoolModal
                isOpen={isSplitting}
                onClose={() => setIsSplitting(false)}
                spool={spools.find(s => s.id === activeSpoolId)}
                onSuccess={(newSpools) => {
                    // Update Local State Optimistically
                    if (newSpools && newSpools.length > 0) {
                        setSpools(current => {
                            // 1. Mark Parent as DIVIDED
                            const updated = current.map(s =>
                                s.id === activeSpoolId ? { ...s, status: 'DIVIDED' } : s
                            )
                            // 2. Add New Children (Mapped)
                            const mappedChildren = newSpools.map((s: any) => ({
                                id: s.id,
                                name: s.spool_number,
                                tag: s.management_tag,
                                status: s.status,
                                welds: 0, // Initial state
                                location: null, // Initial state
                                parent_spool_id: s.parent_spool_id
                            }))

                            // 3. Unlink 3D Meshes (Visual Update via modelData)
                            // Remove the parent assignment so elements become available (Grey)
                            setModelData((prev: any) => {
                                const newAssignments = { ...(prev?.spool_assignments || {}) }
                                // Delete the parent key so its elements are no longer colored/assigned to it
                                if (activeSpoolId) {
                                    delete newAssignments[activeSpoolId]
                                }
                                return {
                                    ...prev,
                                    spool_assignments: newAssignments
                                }
                            })

                            return [...updated, ...mappedChildren]
                        })
                        // Close splitting mode
                        setIsSplitting(false)
                        // Alert user? Maybe toast. For now, simple transition.
                    } else {
                        // Fallback if no children returned?
                        window.location.reload()
                    }
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

            // Fetch project and company info for descriptive path
            const { data: projectData } = await supabase
                .from('projects')
                .select('code, name, company_id, companies(id, slug)')
                .eq('id', rev.project_id)
                .single()

            if (!projectData || !projectData.companies) {
                throw new Error('Could not load project/company data')
            }

            // Generate filename
            const fileName = `model-${targetRevId}-${Date.now()}.glb`

            // Path: {company-slug}-{id}/{project-code}-{id}/isometric-models/{filename}
            // @ts-ignore
            const company = { id: projectData.companies.id, slug: projectData.companies.slug }
            const project = { id: rev.project_id, code: projectData.code, name: projectData.name }
            const filePath = getProjectFilePath(company, project, 'isometric-models', fileName)

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

            // Fetch project and company info for descriptive path
            const { data: projectData } = await supabase
                .from('projects')
                .select('code, name, company_id, companies(id, slug)')
                .eq('id', rev.project_id)
                .single()

            if (!projectData || !projectData.companies) {
                throw new Error('Could not load project/company data')
            }

            // Generate filename
            const fileName = `pdf-${targetRevId}-${Date.now()}.pdf`

            // Path: {company-slug}-{id}/{project-code}-{id}/isometric-pdfs/{filename}
            // @ts-ignore
            const company = { id: projectData.companies.id, slug: projectData.companies.slug }
            const project = { id: rev.project_id, code: projectData.code, name: projectData.name }
            const filePath = getProjectFilePath(company, project, 'isometric-pdfs', fileName)

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
        <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/5 group/card mb-4">
            {/* Header / Summary */}
            <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-glass-border/50 bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-xl shadow-inner border border-brand-primary/20 group-hover/card:scale-110 transition-transform duration-500">
                        📐
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white tracking-tight leading-none">
                            {isoNumber}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5"
                                style={{
                                    backgroundColor: `${statusColor}15`,
                                    color: statusColor,
                                    borderColor: `${statusColor}30`
                                }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
                                {currentStatus} {currentRevision ? `• REV ${currentRevision.rev_code} ` : ''}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 px-4 py-2 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Total</span>
                            <span className="text-sm font-mono font-bold text-white">{stats.total}</span>
                        </div>
                        {stats.obsoletas > 0 && (
                            <div className="w-px h-6 bg-white/10" />
                        )}
                        {stats.obsoletas > 0 && (
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Obs</span>
                                <span className="text-sm font-mono font-bold text-amber-400">{stats.obsoletas}</span>
                            </div>
                        )}
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-brand-primary/80 uppercase tracking-widest">Spool</span>
                            <span className="text-sm font-mono font-bold text-brand-primary">{stats.spooleadas}</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-xl border border-white/5 hover:bg-white/10 text-xs font-semibold gap-2 transition-all ${isExpanded ? 'bg-white/10 border-white/20 text-white' : 'text-text-dim'}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Ocultar Historial' : 'Ver Historial'}
                        <Icons.ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Expanded History */}
            {isExpanded && (
                <div className="p-0 overflow-x-auto bg-black/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-glass-border/30 bg-white/5">
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">Rev</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">Estado</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">Datos</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">Material</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest text-center">Fab</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">F. Anuncio</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">Uniones</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest">Spools</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-text-dim uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/20">
                            {sortedRevisions.map(rev => (
                                <Fragment key={rev.id}>
                                    <tr className={`hover:bg-white/5 transition-colors group/row ${rev.id === currentRevision?.id ? 'bg-brand-primary/5' : ''}`}>
                                        <td className="px-5 py-4">
                                            <div className="w-8 h-8 rounded-lg bg-bg-surface-2 border border-glass-border flex items-center justify-center font-mono font-bold text-white group-hover/row:border-brand-primary/50 transition-colors">
                                                {rev.rev_code}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                                style={{
                                                    color: statusColors[rev.revision_status] || '#ccc',
                                                    borderColor: `${statusColors[rev.revision_status] || '#ccc'}40`,
                                                    backgroundColor: `${statusColors[rev.revision_status] || '#ccc'}10`
                                                }}
                                            >
                                                {rev.revision_status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${revisionStatuses[rev.id]?.data === 'COMPLETO' ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
                                                <span className={`text-[10px] font-bold ${revisionStatuses[rev.id]?.data === 'COMPLETO' ? 'text-green-400' : 'text-amber-400'}`}>
                                                    {revisionStatuses[rev.id]?.data || '...'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${revisionStatuses[rev.id]?.material === 'DISPONIBLE' ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500 shadow-[0_0_8px_#64748b]'}`} />
                                                <span className={`text-[10px] font-bold ${revisionStatuses[rev.id]?.material === 'DISPONIBLE' ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {revisionStatuses[rev.id]?.material || '...'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {revisionStatuses[rev.id]?.fabricable ? (
                                                <span title="Fabricable" className="text-green-500 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">●</span>
                                            ) : (
                                                <span title="No fabricable" className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">●</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-white font-medium">
                                                    {rev.announcement_date
                                                        ? new Date(rev.announcement_date).toLocaleDateString('es-CL')
                                                        : '-'
                                                    }
                                                </span>
                                                {rev.transmittal && (
                                                    <span className="text-[10px] text-text-dim font-mono mt-0.5">
                                                        {rev.transmittal}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-mono text-white font-bold">{rev.welds_count || 0}</td>
                                        <td className="px-5 py-4 text-sm font-mono text-white font-bold">{rev.spools_count || 0}</td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`w-8 h-8 rounded-lg hover:bg-white/10 transition-all ${openRevId === rev.id ? 'bg-white/10 text-brand-primary' : 'text-text-dim'}`}
                                                    onClick={() => setOpenRevId(openRevId === rev.id ? null : rev.id)}
                                                    title="Ver detalles"
                                                >
                                                    <Icons.ChevronDown size={14} className={`transition-transform duration-300 ${openRevId === rev.id ? 'rotate-180' : ''}`} />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`px-3 py-1 h-8 rounded-lg text-[10px] font-bold font-mono transition-all ${rev.glb_model_url ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20' : 'text-text-dim bg-white/5 hover:bg-white/10 border border-white/5'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (uploadingModelRevId === rev.id) return
                                                        if (rev.glb_model_url) {
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
                                                    disabled={uploadingModelRevId === rev.id}
                                                >
                                                    {uploadingModelRevId === rev.id ? <Icons.Loader2 size={14} className="animate-spin" /> : '3D'}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`px-3 py-1 h-8 rounded-lg transition-all ${rev.pdf_url ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20' : 'text-text-dim bg-white/5 hover:bg-white/10 border border-white/5'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (uploadingPdfRevId === rev.id) return
                                                        if (rev.pdf_url) {
                                                            window.open(rev.pdf_url, '_blank')
                                                        } else {
                                                            handlePdfUploadClick(rev.id)
                                                        }
                                                    }}
                                                    disabled={uploadingPdfRevId === rev.id}
                                                >
                                                    {uploadingPdfRevId === rev.id ? <Icons.Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                                </Button>

                                                <div className="relative">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`w-8 h-8 rounded-lg hover:bg-white/10 text-text-dim transition-all ${openMenuRevId === rev.id ? 'bg-white/10' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenMenuRevId(openMenuRevId === rev.id ? null : rev.id)
                                                        }}
                                                    >
                                                        <Icons.MoreVertical size={14} />
                                                    </Button>

                                                    {openMenuRevId === rev.id && (
                                                        <div className="absolute top-full right-0 mt-2 w-48 bg-bg-surface-2 border border-glass-border rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                            {rev.pdf_url && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setOpenMenuRevId(null)
                                                                        handleDeletePdf(rev.id, rev.pdf_url!)
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Trash2 size={14} /> Eliminar PDF
                                                                </button>
                                                            )}
                                                            {rev.glb_model_url && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setOpenMenuRevId(null)
                                                                        handleDeleteModel(rev.id, rev.glb_model_url!)
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Trash2 size={14} /> Eliminar Modelo 3D
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setOpenMenuRevId(null)
                                                                    handleDelete(rev.id, rev.rev_code)
                                                                }}
                                                                disabled={isDeleting === rev.id}
                                                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-500/15 flex items-center gap-2 border-t border-glass-border/30 transition-colors"
                                                            >
                                                                <Trash2 size={14} /> {isDeleting === rev.id ? 'Eliminando...' : 'Eliminar Revisión'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {openRevId === rev.id && (
                                        <tr className="bg-black/20">
                                            <td colSpan={9} className="p-0 border-none">
                                                <div className="p-4 bg-white/5 border-l-2 border-brand-primary/50 ml-5 mr-5 my-4 rounded-xl">
                                                    <RevisionMasterView
                                                        revisionId={rev.id}
                                                        projectId={rev.project_id}
                                                        glbModelUrl={rev.glb_model_url}
                                                        modelData={rev.model_data}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
