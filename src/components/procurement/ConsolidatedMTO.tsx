'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { searchConsolidatedMTO, type MTOByIsometricWithStats, type MTOItemSummary } from '@/services/material-consolidation'
import { createMaterialRequest } from '@/services/material-requests'
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
                    request_type: type,
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
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Sin Datos MTO</h3>
                <p>No se encontraron materiales cargados desde ingeniería (Revisiones).</p>
            </div>
        )
    }

    return (
        <div className="mto-console">
            {/* Toolbar */}
            <div className="console-toolbar glass-panel">
                {/* Search Bar */}
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por Isométrico (ej: 3800...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Actions */}
                <div className="toolbar-actions">
                    <span className="selection-count">
                        {selectedItems.length} items seleccionados
                    </span>
                    <button
                        className="btn-create-mir"
                        disabled={selectedItems.length === 0 || creatingRequest}
                        onClick={() => handleCreateRequest('CLIENT_MIR')}
                    >
                        📋 Crear MIR
                    </button>
                    <button
                        className="btn-create-po"
                        disabled={selectedItems.length === 0 || creatingRequest}
                        onClick={() => handleCreateRequest('CONTRACTOR_PO')}
                    >
                        🛒 Crear PO
                    </button>
                </div>
            </div>

            {/* Empty State / No Results */}
            {data.length === 0 && !loading ? (
                <div className="empty-state-container">
                    <div className="empty-state-icon">🔍</div>
                    <h2 className="empty-state-title">No hay resultados</h2>
                    <p className="empty-state-description">
                        No se encontraron isométricos con los filtros actuales.
                    </p>
                </div>
            ) : (
                <>
                    {/* Isometric Cards List */}
                    <div className="iso-list">
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
                        <div className="load-more-container">
                            <button
                                onClick={handleLoadMore}
                                className="btn-load-more"
                                disabled={loading}
                            >
                                {loading ? 'Cargando...' : 'Cargar más isométricos'}
                            </button>
                        </div>
                    )}
                </>
            )}



            <style jsx>{`
                .mto-console {
                    padding: 1rem;
                }

                .console-toolbar {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 1px solid var(--glass-border);
                    flex-wrap: wrap;
                    align-items: center;
                }

                .search-box {
                    flex: 1;
                    min-width: 250px;
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
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: white;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    background: rgba(255, 255, 255, 0.1);
                }

                .toolbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .selection-count {
                    font-size: 0.9rem;
                    color: var(--color-text-dim);
                    white-space: nowrap;
                }

                .btn-create-mir,
                .btn-create-po {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    white-space: nowrap;
                    border: none;
                    color: white;
                }

                .btn-create-mir {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                }

                .btn-create-mir:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
                }

                .btn-create-po {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                }

                .btn-create-po:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
                }

                .btn-create-mir:disabled,
                .btn-create-po:disabled {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.3);
                    cursor: not-allowed;
                    transform: none;
                }

                .iso-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .load-more-container {
                    text-align: center;
                    padding: 2rem;
                }

                .btn-load-more {
                    padding: 0.75rem 2rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid var(--glass-border);
                    border-radius: 99px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }

                .btn-load-more:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .btn-load-more:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .empty-state,
                .empty-state-container {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                }

                .empty-icon,
                .empty-state-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .empty-state h3,
                .empty-state-title {
                    font-size: 1.5rem;
                    color: #e2e8f0;
                    margin-bottom: 0.5rem;
                }

                .empty-state p,
                .empty-state-description {
                    color: var(--color-text-dim);
                    font-size: 1rem;
                }
            `}</style>
        </div>
    )
}

