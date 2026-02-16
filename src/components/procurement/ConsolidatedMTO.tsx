'use client'

import { useState, useEffect } from 'react'
import { Search, ClipboardList, ShoppingCart, Info, Loader2, ChevronRight, BarChart3, Package } from 'lucide-react'
import { searchConsolidatedMTO, type MTOByIsometricWithStats, type MTOItemSummary } from '@/services/material-consolidation'
import { createMaterialRequest } from '@/services/material-requests'
import { MaterialRequestTypeEnum } from '@/types'
import { Heading, Text } from '@/components/ui/Typography'
import IsometricMTOCard from './IsometricMTOCard'

interface Props {
    projectId: string
    companyId: string
}

// Simple Debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

export default function ConsolidatedMTO({ projectId, companyId }: Props) {
    const [data, setData] = useState<MTOByIsometricWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedItems, setSelectedItems] = useState<MTOItemSummary[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 10

    // Loading state for request creation
    const [creatingRequest, setCreatingRequest] = useState(false)

    // Debounce search
    const debouncedSearch = useDebounceValue(searchQuery, 600)

    // Reset list when search changes
    useEffect(() => {
        setPage(0)
        setData([])
        setHasMore(true)
        loadData(0, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, projectId])

    async function loadData(offsetPage: number, isReset: boolean) {
        setLoading(true)
        try {
            const result = await searchConsolidatedMTO(
                projectId,
                debouncedSearch,
                offsetPage * PAGE_SIZE,
                PAGE_SIZE
            )

            setData(prev => isReset ? result : [...prev, ...result])

            if (result.length < PAGE_SIZE) {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading MTO:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleLoadMore() {
        const nextPage = page + 1
        setPage(nextPage)
        loadData(nextPage, false)
    }

    function toggleItemSelection(item: MTOItemSummary) {
        if (selectedItems.find(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id))
        } else {
            setSelectedItems([...selectedItems, item])
        }
    }

    function toggleSpoolSelection(items: MTOItemSummary[]) {
        const allSelected = items.every(item => selectedItems.find(i => i.id === item.id))

        if (allSelected) {
            // Unselect all
            const idsToRemove = items.map(i => i.id)
            setSelectedItems(selectedItems.filter(i => !idsToRemove.includes(i.id)))
        } else {
            // Select all (avoid duplicates)
            const newItems = items.filter(item => !selectedItems.find(i => i.id === item.id))
            setSelectedItems([...selectedItems, ...newItems])
        }
    }

    async function handleCreateRequest(type: 'CLIENT_MIR' | 'CONTRACTOR_PO') {
        if (creatingRequest) return
        setCreatingRequest(true)
        try {
            // Calculate pending quantities and filter out fully requested items
            const items = selectedItems
                .map(i => {
                    const pending = Math.max(0, i.quantity_required - (i.quantity_requested || 0))
                    return {
                        material_spec: i.item_code,
                        quantity_requested: pending,
                        spool_id: i.spool_id || undefined,
                        isometric_id: i.isometric_id || undefined
                    }
                })
                .filter(item => item.quantity_requested > 0) // Only include items with pending quantity

            if (items.length === 0) {
                alert('⚠️ Todos los materiales seleccionados ya fueron solicitados completamente')
                setCreatingRequest(false)
                return
            }

            await createMaterialRequest(
                {
                    project_id: projectId,
                    request_type: type as MaterialRequestTypeEnum,
                    items,
                    notes: ''
                },
                companyId
            )

            // Success - clear selection and reload
            setSelectedItems([])
            setPage(0)
            setData([])
            setHasMore(true)
            loadData(0, true)

            alert(`✅ ${type === 'CLIENT_MIR' ? 'MIR' : 'Orden de Compra'} creada exitosamente`)
        } catch (error) {
            console.error('Error creating request:', error)
            alert(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setCreatingRequest(false)
        }
    }

    if (!loading && data.length === 0 && !debouncedSearch) {
        return (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center animate-fade-in">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sin Datos MTO</h3>
                <p className="text-slate-500">No se encontraron materiales cargados desde ingeniería (Revisiones).</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Stats Overlay */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Consolidado de Ingeniería
                    </div>
                    <Heading level={2} className="text-2xl font-black tracking-tight text-white uppercase italic">MTO Console</Heading>
                    <Text size="sm" className="text-slate-500 max-w-lg">Gestiona el despiece de ingeniería, solicita materiales por isométrico o spool completo.</Text>
                </div>

                <div className="flex gap-3">
                    <div className="flex flex-col items-end px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Items Seleccionados</span>
                        <span className="text-xl font-black text-indigo-400 font-mono tracking-tighter">{selectedItems.length}</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                {/* Search Bar */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por Isométrico (ej: 3800...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleCreateRequest('CLIENT_MIR')}
                        disabled={selectedItems.length === 0 || creatingRequest}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all
                            ${selectedItems.length > 0 && !creatingRequest
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
                            }`}
                    >
                        {creatingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                        Crear MIR
                    </button>
                    <button
                        onClick={() => handleCreateRequest('CONTRACTOR_PO')}
                        disabled={selectedItems.length === 0 || creatingRequest}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all
                            ${selectedItems.length > 0 && !creatingRequest
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
                            }`}
                    >
                        {creatingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                        Crear PO
                    </button>
                </div>
            </div>

            {/* Data Area */}
            {data.length === 0 && !loading ? (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                    <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Sin resultados</h2>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">No se encontraron isométricos con los filtros actuales.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Isometric Cards List */}
                    <div className="grid grid-cols-1 gap-4">
                        {data.map(iso => (
                            <IsometricMTOCard
                                key={iso.isometric_id}
                                isoNumber={iso.iso_number}
                                spools={iso.spools}
                                stats={iso.stats}
                                selectedItems={selectedItems}
                                onToggleItem={toggleItemSelection}
                                onToggleSpool={toggleSpoolSelection}
                            />
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="pt-8 pb-12 flex justify-center">
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="group relative flex items-center gap-3 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cargando...
                                    </>
                                ) : (
                                    <>
                                        Cargar más isométricos
                                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

