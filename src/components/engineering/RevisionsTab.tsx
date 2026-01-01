'use client'

/**
 * Revisions Tab Component - MASTER VIEW (Phase 5)
 * 
 * Scalable implementation with Server-Side Search & Pagination
 * - Replaces client-side grouping with pre-grouped backend data
 * - Adds Search Bar
 * - Implements "Load More" pagination
 */

import { useState, useEffect, useCallback } from 'react'
import { searchIsometricsAction } from '@/actions/isometrics'
import type { IsometricMasterView } from '@/services/isometrics'
import IsometricRevisionCard from './IsometricRevisionCard'
import '@/styles/revisions.css'

// Simple Debounce hook implementation if not available
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
        <div className="revisions-tab-container">
            {/* Search & Filter Bar */}
            <div className="toolbar-container glass-panel">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por Isométrico (ej: 3800...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="VIGENTE">Vigente</option>
                        <option value="SPOOLEADO">Spooleado</option>
                        <option value="PENDING">Pendiente</option>
                        <option value="OBSOLETO">Obsoleto</option>
                    </select>
                </div>
            </div>

            {/* Empty State / Loading */}
            {isometrics.length === 0 && !isLoading ? (
                <div className="empty-state-container">
                    <div className="empty-state-icon">📋</div>
                    <h2 className="empty-state-title">No hay resultados</h2>
                    <p className="empty-state-description">
                        No se encontraron isométricos con los filtros actuales.
                    </p>
                </div>
            ) : (
                <div className="revisions-list grouped-list">
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
                <div className="load-more-container">
                    <button
                        onClick={handleLoadMore}
                        className="btn-load-more"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cargando...' : 'Cargar más isométricos'}
                    </button>
                </div>
            )}

            <style jsx>{`
                .toolbar-container {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    margin-bottom: 0.5rem; /* Reduced margin to stick closer to filter */
                    align-items: center;
                    background: rgba(0,0,0,0.2);
                    border-radius: 12px;
                    border: 1px solid var(--glass-border);
                }

                .search-box {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    color: var(--color-text-dim);
                }

                .search-input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: white;
                    font-size: 0.95rem;
                }

                .search-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    background: rgba(255,255,255,0.1);
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 2rem;
                }

                .btn-load-more {
                    padding: 0.75rem 2rem;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid var(--glass-border);
                    border-radius: 99px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-load-more:hover:not(:disabled) {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                
                .btn-load-more:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    )
}

