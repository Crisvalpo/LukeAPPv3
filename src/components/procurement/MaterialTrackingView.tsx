/**
 * Material Tracking View
 * Main view for tracking materials by isometric → spool with request history
 */

'use client'

import { useState, useEffect } from 'react'
import { Package, FileText } from 'lucide-react'
import {
    fetchMaterialTracking,
    type MaterialTrackingData,
    type IsometricGroup,
    type SpoolGroup,
    type RequestSummary
} from '@/services/material-tracking'
import { Search } from 'lucide-react'

// Debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

interface Props {
    projectId: string
    companyId: string
}

export default function MaterialTrackingView({ projectId, companyId }: Props) {
    const [data, setData] = useState<MaterialTrackingData>({ isometrics: [], allRequests: [] })
    const [loading, setLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
    const [requestFilter, setRequestFilter] = useState<'all' | 'mir' | 'po'>('all')

    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const PAGE_SIZE = 50

    const debouncedSearch = useDebounceValue(searchQuery, 600)

    useEffect(() => {
        setPage(0)
        setData({ isometrics: [], allRequests: [] })
        setHasMore(true)
        loadData(0, true)
    }, [projectId, debouncedSearch])

    async function loadData(offsetPage: number, isReset: boolean) {
        setLoading(true)
        try {
            const trackingData = await fetchMaterialTracking(projectId, {
                search: debouncedSearch,
                limit: PAGE_SIZE,
                offset: offsetPage * PAGE_SIZE
            })

            if (isReset) {
                setData(trackingData)
            } else {
                setData(prev => {
                    const existingIds = new Set(prev.allRequests.map(r => r.id))
                    const uniqueNewRequests = trackingData.allRequests.filter(r => !existingIds.has(r.id))

                    return {
                        isometrics: [...prev.isometrics, ...trackingData.isometrics],
                        allRequests: [...prev.allRequests, ...uniqueNewRequests]
                    }
                })
            }

            if (trackingData.isometrics.length < PAGE_SIZE) {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading tracking data:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleLoadMore() {
        const nextPage = page + 1
        setPage(nextPage)
        loadData(nextPage, false)
    }

    // Filter requests for sidebar
    const filteredRequests = data.allRequests.filter(req => {
        if (requestFilter === 'all') return true
        if (requestFilter === 'mir') return req.request_type === 'CLIENT_MIR'
        if (requestFilter === 'po') return req.request_type === 'CONTRACTOR_PO'
        return true
    })

    if (loading) {
        return <div className="loading-state">Cargando...</div>
    }

    if (data.isometrics.length === 0 && !loading) {
        return (
            <div className="tracking-container">
                <div className="tracking-main">
                    <div className="tracking-header">
                        <h2>Tracking de Materiales</h2>
                        <div className="search-bar">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar isométrico..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <h3>Sin Datos de Tracking</h3>
                        <p>{searchQuery ? 'No se encontraron isométricos con ese criterio' : 'No se encontraron solicitudes de material para este proyecto.'}</p>
                    </div>
                </div>
                <style jsx>{`
                    .tracking-container { padding: 1.5rem; height: 100%; }
                    .tracking-header { margin-bottom: 1.5rem; }
                    .search-bar {
                        display: flex;
                        align-items: center;
                        background: rgba(0,0,0,0.2);
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        border: 1px solid rgba(255,255,255,0.1);
                        width: 100%;
                        max-width: 400px;
                        margin-top: 1rem;
                    }
                    .search-icon { color: var(--color-text-dim); margin-right: 0.75rem; }
                    .search-bar input {
                        background: none;
                        border: none;
                        color: white;
                        width: 100%;
                        outline: none;
                    }
                    .empty-state {
                        text-align: center;
                        padding: 4rem 2rem;
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 12px;
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                    }
                    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .empty-state h3 { font-size: 1.5rem; color: #e2e8f0; margin-bottom: 0.5rem; }
                    .empty-state p { color: var(--color-text-dim); font-size: 1rem; }
                `}</style>
            </div>
        )
    }

    return (
        <div className="tracking-container">
            {/* Main Content */}
            <div className="tracking-main">
                <div className="tracking-header">
                    <h2>Tracking de Materiales</h2>
                    <p>Vista por Isométrico → Spool → Solicitudes</p>

                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar isométrico..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="isometrics-list">
                    {data.isometrics.map((iso, index) => (
                        <IsometricCard
                            key={`${iso.iso_id}-${index}`}
                            isometric={iso}
                            selectedRequest={selectedRequest}
                        />
                    ))}

                    {hasMore && (
                        <button
                            className="load-more-btn"
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? 'Cargando...' : 'Cargar más isométricos'}
                        </button>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <aside className="requests-sidebar">
                <div className="sidebar-header">
                    <h3>Solicitudes</h3>
                    <div className="filter-buttons">
                        <button
                            className={requestFilter === 'all' ? 'active' : ''}
                            onClick={() => setRequestFilter('all')}
                        >
                            Todas
                        </button>
                        <button
                            className={requestFilter === 'mir' ? 'active' : ''}
                            onClick={() => setRequestFilter('mir')}
                        >
                            MIR
                        </button>
                        <button
                            className={requestFilter === 'po' ? 'active' : ''}
                            onClick={() => setRequestFilter('po')}
                        >
                            PO
                        </button>
                    </div>
                </div>

                <div className="requests-list">
                    {filteredRequests.map(req => (
                        <RequestCard
                            key={req.id}
                            request={req}
                            selected={selectedRequest === req.id}
                            onClick={() => setSelectedRequest(req.id === selectedRequest ? null : req.id)}
                        />
                    ))}
                </div>
            </aside>

            <style jsx>{`
                .tracking-container {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    height: 100%;
                }

                .tracking-main {
                    overflow-y: auto;
                }

                .tracking-header {
                    margin-bottom: 1.5rem;
                }

                .tracking-header h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0 0 0.25rem 0;
                }

                .tracking-header p {
                    color: var(--color-text-dim);
                    font-size: 0.9rem;
                    margin: 0;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    background: rgba(0,0,0,0.2);
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    width: 100%;
                    max-width: 400px;
                    margin-top: 1rem;
                }

                .search-icon {
                    color: var(--color-text-dim);
                    margin-right: 0.75rem;
                }

                .search-bar input {
                    background: none;
                    border: none;
                    color: white;
                    width: 100%;
                    font-size: 0.95rem;
                    outline: none;
                }

                .search-bar input::placeholder {
                    color: rgba(255,255,255,0.3);
                }

                .load-more-btn {
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #e2e8f0;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }

                .load-more-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .load-more-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .isometrics-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .requests-sidebar {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-header {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                }

                .sidebar-header h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0 0 0.75rem 0;
                }

                .filter-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .filter-buttons button {
                    flex: 1;
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #cbd5e1;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-buttons button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .filter-buttons button.active {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border-color: #3b82f6;
                    color: white;
                }

                .requests-list {
                    padding: 0.75rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .loading-state,
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    font-size: 1.5rem;
                    color: #e2e8f0;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: var(--color-text-dim);
                    font-size: 1rem;
                }
            `}</style>
        </div>
    )
}

// Isometric Card Component
function IsometricCard({ isometric, selectedRequest }: {
    isometric: IsometricGroup
    selectedRequest: string | null
}) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="iso-card">
            <div className="iso-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="iso-info">
                    <Package size={20} className="iso-icon" />
                    <div>
                        <h3 className="iso-number">{isometric.iso_number}</h3>
                        <div className="iso-stats">
                            <span>{isometric.spools.length} Spools</span>
                            <span className="separator">•</span>
                            <span>{isometric.total_items} Items</span>
                            <span className="separator">•</span>
                            <span className="requests-badge">{isometric.total_requests} Solicitudes</span>
                        </div>
                    </div>
                </div>
                <button className="expand-btn">
                    {isExpanded ? '▲' : '▼'}
                </button>
            </div>

            {isExpanded && (
                <div className="iso-content">
                    {isometric.spools.map(spool => (
                        <SpoolSection
                            key={spool.spool_id}
                            spool={spool}
                            selectedRequest={selectedRequest}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
                .iso-card {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.3s;
                }

                .iso-card:hover {
                    border-color: rgba(99, 102, 241, 0.5);
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
                }

                .iso-header {
                    padding: 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .iso-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .iso-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .iso-icon {
                    color: var(--color-primary);
                }

                .iso-number {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0 0 0.25rem 0;
                }

                .iso-stats {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--color-text-dim);
                }

                .separator {
                    color: rgba(255, 255, 255, 0.2);
                }

                .requests-badge {
                    padding: 0.125rem 0.5rem;
                    background: rgba(99, 102, 241, 0.2);
                    border-radius: 12px;
                    color: #a5b4fc;
                    font-weight: 500;
                }

                .expand-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-dim);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .expand-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .iso-content {
                    padding: 0 1.25rem 1.25rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    )
}

// Spool Section Component  
function SpoolSection({ spool, selectedRequest }: {
    spool: SpoolGroup
    selectedRequest: string | null
}) {
    const [showAll, setShowAll] = useState(false)
    const itemsToShow = showAll ? spool.items : spool.items.slice(0, 3)
    const hiddenCount = spool.items.length - 3

    return (
        <div className="spool-section">
            <div className="spool-header">
                <span className="spool-name">
                    {spool.spool_number}
                    {spool.spool_tag && (
                        <span className="spool-tag">{spool.spool_tag}</span>
                    )}
                </span>
                <span className="spool-info">
                    Rev {spool.revision_number} · {spool.items.length} items
                </span>
            </div>

            {/* Items table */}
            <div className="items-preview">
                <div className="items-header">
                    <span>Solicitud</span>
                    <span>Material</span>
                    <span style={{ textAlign: 'right' }}>Avance (Rec / Sol)</span>
                </div>
                {itemsToShow.map(item => {
                    const received = item.quantity_received || 0
                    const requested = item.quantity_requested || 0
                    const progress = requested > 0 ? (received / requested) * 100 : 0
                    const isComplete = received >= requested

                    return (
                        <div
                            key={item.id}
                            className={`item-row ${item.request_ids.includes(selectedRequest || '') ? 'highlighted' : ''}`}
                        >
                            <div className="item-req-info">
                                <span className={`req-badge ${item.request_type === 'CONTRACTOR_PO' ? 'po' : 'mir'}`}>
                                    {item.request_number}
                                </span>
                            </div>

                            <div className="item-main">
                                <span className="item-code">{item.item_code}</span>
                                <span className="item-desc" title={item.description}>{item.description}</span>
                            </div>

                            <div className="item-progress">
                                <div className="qty-values">
                                    <span className={`qty-received ${isComplete ? 'complete' : ''}`}>
                                        {received}
                                    </span>
                                    <span className="qty-separator">/</span>
                                    <span className="qty-requested">{requested}</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className={`progress-bar-fill ${isComplete ? 'complete' : ''}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {hiddenCount > 0 && (
                    <button
                        className="more-items-btn"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? 'Ver menos' : `+${hiddenCount} más...`}
                    </button>
                )}
            </div>

            {/* Request history */}
            <div className="request-history">
                <h4>📜 Historial de Solicitudes</h4>
                <div className="history-list">
                    {spool.requests.map(req => (
                        <div key={req.id} className="history-badge">
                            <span className="req-number">{req.request_number}</span>
                            <span className="req-type">
                                {req.request_type === 'CLIENT_MIR' ? '📋 MIR' : '🛒 PO'}
                            </span>
                            <span className="req-count">{req.item_count} items</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .spool-section {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .spool-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .spool-name {
                    color: #93c5fd;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .spool-tag {
                    margin-left: 0.5rem;
                    font-size: 0.85em;
                    color: #d8b4fe;
                    font-family: monospace;
                    background: rgba(126, 34, 206, 0.15);
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid rgba(126, 34, 206, 0.3);
                }

                .spool-info {
                    font-size: 0.8rem;
                    color: var(--color-text-dim);
                }

                .items-preview {
                    margin-bottom: 1rem;
                }

                .items-header {
                    display: grid;
                    grid-template-columns: 80px 1fr 120px;
                    gap: 1rem;
                    padding: 0 0.5rem 0.5rem;
                    color: var(--color-text-dim);
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .item-row {
                    display: grid;
                    grid-template-columns: 80px 1fr 120px;
                    gap: 1rem;
                    padding: 0.75rem 0.5rem;
                    background: rgba(0, 0, 0, 0.2);
                    margin-bottom: 0.25rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    align-items: center;
                    border: 1px solid transparent;
                }

                .item-row.highlighted {
                    background: rgba(34, 197, 94, 0.1);
                    border-color: rgba(34, 197, 94, 0.3);
                }

                .item-req-info {
                    display: flex;
                }

                .req-badge {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 600;
                    background: rgba(255, 255, 255, 0.1);
                    color: #e2e8f0;
                }

                .req-badge.mir {
                    background: rgba(59, 130, 246, 0.15);
                    color: #93c5fd;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .req-badge.po {
                    background: rgba(245, 158, 11, 0.15);
                    color: #fcd34d;
                    border: 1px solid rgba(245, 158, 11, 0.3);
                }

                .item-main {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    overflow: hidden;
                }

                .item-code {
                    font-family: 'Courier New', monospace;
                    color: #a5b4fc;
                    font-weight: 600;
                    font-size: 0.8rem;
                }

                .item-desc {
                    color: #e2e8f0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .item-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: flex-end;
                }

                .qty-values {
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                }

                .qty-received {
                    color: #e2e8f0;
                    font-weight: 600;
                }

                .qty-received.complete {
                    color: #34d399;
                }

                .qty-separator {
                    color: var(--color-text-dim);
                    margin: 0 4px;
                }

                .qty-requested {
                    color: var(--color-text-dim);
                }

                .progress-bar-bg {
                    width: 100%;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-bar-fill {
                    height: 100%;
                    background: #60a5fa;
                    border-radius: 2px;
                }

                .progress-bar-fill.complete {
                    background: #34d399;
                }

                .more-items-btn {
                    width: 100%;
                    text-align: center;
                    padding: 0.5rem;
                    color: #93c5fd;
                    font-size: 0.85rem;
                    background: rgba(147, 197, 253, 0.1);
                    border: 1px dashed rgba(147, 197, 253, 0.3);
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 0.5rem;
                }
                
                .more-items-btn:hover {
                    background: rgba(147, 197, 253, 0.2);
                    border-color: rgba(147, 197, 253, 0.5);
                }

                .request-history h4 {
                    font-size: 0.9rem;
                    color: #e2e8f0;
                    margin: 0 0 0.5rem 0;
                    font-weight: 600;
                }

                .history-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .history-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.375rem 0.75rem;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 6px;
                    font-size: 0.8rem;
                }

                .req-number {
                    color: #a5b4fc;
                    font-weight: 600;
                }

                .req-type {
                    color: #cbd5e1;
                }

                .req-count {
                    color: var(--color-text-dim);
                }
            `}</style>
        </div>
    )
}



// Request Card Component for Sidebar
function RequestCard({ request, selected, onClick }: {
    request: RequestSummary
    selected: boolean
    onClick: () => void
}) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return '#94a3b8'
            case 'SENT': return '#3b82f6'
            case 'COMPLETE': return '#10b981'
            default: return '#94a3b8'
        }
    }

    return (
        <div
            className={`request-card ${selected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="card-header">
                <span className="request-number">{request.request_number}</span>
                <span
                    className="status-badge"
                    style={{
                        backgroundColor: `${getStatusColor(request.status)}20`,
                        color: getStatusColor(request.status),
                        border: `1px solid ${getStatusColor(request.status)}40`
                    }}
                >
                    {request.status}
                </span>
            </div>
            <div className="card-meta">
                <span className="request-type">
                    {request.request_type === 'CLIENT_MIR' ? '📋 MIR' : '🛒 PO'}
                </span>
                <span className="request-date">
                    {new Date(request.created_at).toLocaleDateString('es-CL')}
                </span>
            </div>
            <div className="card-stats">
                {request.item_count} items · {request.affected_spools} spools
            </div>

            <style jsx>{`
                .request-card {
                    padding: 0.75rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .request-card:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(99, 102, 241, 0.5);
                }

                .request-card.selected {
                    background: rgba(99, 102, 241, 0.2);
                    border-color: #6366f1;
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .request-number {
                    font-weight: 600;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                }

                .status-badge {
                    font-size: 0.7rem;
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .card-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.25rem;
                    font-size: 0.8rem;
                }

                .request-type {
                    color: #cbd5e1;
                }

                .request-date {
                    color: var(--color-text-dim);
                }

                .card-stats {
                    font-size: 0.75rem;
                    color: var(--color-text-dim);
                }
            `}</style>
        </div>
    )
}
