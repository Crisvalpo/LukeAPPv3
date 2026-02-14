'use client'

/**
 * Revisions Tab Component - MASTER VIEW (Phase 5)
 * 
 * Scalable implementation with Server-Side Search & Pagination
 * - Replaces client-side grouping with pre-grouped backend data
 * - Adds Search Bar
 * - Implements "Load More" pagination
 */

import { useState, useEffect } from 'react'
import { searchIsometricsAction } from '@/actions/isometrics'
import type { IsometricMasterView } from '@/services/isometrics'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import IsometricRevisionCard from './IsometricRevisionCard'

// Simple Debounce hook implementation
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

interface RevisionsTabProps {
    projectId: string
}

export default function RevisionsTab({ projectId }: RevisionsTabProps) {
    // State
    const [isometrics, setIsometrics] = useState<IsometricMasterView[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 10

    // Debounce search
    const debouncedSearch = useDebounceValue(searchQuery, 600)

    // Reset list when search or filter changes
    useEffect(() => {
        setPage(0)
        setIsometrics([])
        setHasMore(true)
        loadData(0, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, statusFilter, projectId])

    const loadData = async (offsetPage: number, isReset: boolean) => {
        console.log('[RevisionsTab] loadData called:', { offsetPage, isReset })
        setIsLoading(true)
        try {
            const result = await searchIsometricsAction(
                projectId,
                debouncedSearch,
                offsetPage * PAGE_SIZE,
                PAGE_SIZE,
                { status: statusFilter as any }
            )

            if (result.success && result.data) {
                const newData = result.data
                setIsometrics(prev => isReset ? newData : [...prev, ...newData])

                if (newData.length < PAGE_SIZE) {
                    setHasMore(false)
                }
            }
        } catch (error) {
            console.error('Error loading Master View data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLoadMore = () => {
        const nextPage = page + 1
        setPage(nextPage)
        loadData(nextPage, false)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Search & Filter Bar */}
            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-lg">
                <div className="relative flex-1 group w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-dim group-focus-within:text-brand-primary transition-colors">
                        <Icons.Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por Isométrico (ej: 3800...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-black/20 border border-glass-border/50 rounded-xl text-white placeholder:text-text-dim/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all font-medium"
                    />
                </div>

                <div className="w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-64 bg-black/20 border border-glass-border/50 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer hover:bg-black/30 appearance-none"
                    >
                        <option value="ALL">🔍 Todos los Estados</option>
                        <option value="VIGENTE">✅ Vigente</option>
                        <option value="SPOOLEADO">📦 Spooleado</option>
                        <option value="PENDING">⏳ Pendiente</option>
                        <option value="OBSOLETO">⚠️ Obsoleto</option>
                    </select>
                </div>
            </div>

            {/* Empty State / Loading */}
            {isometrics.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-bg-surface-1/20 border border-glass-border/30 rounded-3xl border-dashed">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-6 shadow-inner border border-white/5">
                        📋
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No se encontraron resultados</h2>
                    <p className="text-text-dim text-center max-w-sm">
                        No hay isométricos que coincidan con los filtros actuales. Intenta ajustar tu búsqueda.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Render List */}
                    {isometrics.map(iso => (
                        <IsometricRevisionCard
                            key={iso.id}
                            isoNumber={iso.iso_number}
                            revisions={iso.revisions}
                            currentRevision={iso.current_revision}
                            stats={iso.stats}
                            onRefresh={() => loadData(0, true)}
                        />
                    ))}
                </div>
            )}

            {/* Load More Trigger */}
            {hasMore && (
                <div className="flex justify-center py-10">
                    <Button
                        onClick={handleLoadMore}
                        variant="secondary"
                        size="lg"
                        className="rounded-full px-10 gap-2 border border-glass-border/50 hover:bg-white/10"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Icons.Loader2 size={18} className="animate-spin" /> Cargando...
                            </>
                        ) : 'Cargar más isométricos'}
                    </Button>
                </div>
            )}
        </div>
    )
}

