'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMaterialRequests } from '@/services/material-requests'
import MaterialRequestDetailsModal from './MaterialRequestDetailsModal'
import type { MaterialRequest } from '@/types'

interface MaterialRequestListProps {
    projectId: string
}

export default function MaterialRequestList({ projectId }: MaterialRequestListProps) {
    const router = useRouter()
    const [requests, setRequests] = useState<MaterialRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'CLIENT_MIR' | 'CONTRACTOR_PO'>('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')

    useEffect(() => {
        if (projectId) {
            loadRequests()
        }
    }, [projectId])

    async function loadRequests() {
        setIsLoading(true)
        try {
            const data = await getMaterialRequests(projectId)
            setRequests(data)
        } catch (err) {
            console.error(err)
            setError('Error al cargar solicitudes')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter logic
    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.request_number.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = typeFilter === 'ALL' || req.request_type === typeFilter
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
    })

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            'DRAFT': 'Borrador',
            'SENT': 'Enviada',
            'APPROVED': 'Aprobada',
            'REJECTED': 'Rechazada',
            'PARTIAL': 'Parcial',
            'COMPLETED': 'Completada'
        }
        return map[status] || status
    }

    if (isLoading) return (
        <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando solicitudes...</p>
        </div>
    )

    if (error) return <div className="error-message">{error}</div>

    return (
        <div className="requests-container">
            {/* Header Toolbar */}
            <div className="toolbar">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar MIR o PO..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filters">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="filter-select"
                    >
                        <option value="ALL">Todos los Tipos</option>
                        <option value="CLIENT_MIR">MIR Cliente</option>
                        <option value="CONTRACTOR_PO">PO Compra</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="DRAFT">Borrador</option>
                        <option value="SENT">Enviada</option>
                        <option value="APPROVED">Aprobada</option>
                        <option value="COMPLETED">Completada</option>
                    </select>
                </div>
            </div>

            {/* Empty State */}
            {filteredRequests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No se encontraron solicitudes</h3>
                    <p>Intenta ajustar los filtros de búsqueda.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Solicitud</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Creación</th>
                                <th>ETA</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => (
                                <tr key={req.id} onClick={() => setSelectedRequest(req)} className="clickable-row">
                                    <td className="font-mono">
                                        <span className="req-number">{req.request_number}</span>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${req.request_type === 'CLIENT_MIR' ? 'mir' : 'po'}`}>
                                            {req.request_type === 'CLIENT_MIR' ? '📋 MIR' : '🛒 PO'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${req.status.toLowerCase()}`}>
                                            {getStatusLabel(req.status)}
                                        </span>
                                    </td>
                                    <td className="text-dim">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="text-dim">
                                        {req.eta_date ? new Date(req.eta_date).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedRequest(req)
                                            }}
                                        >
                                            👉 Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                .requests-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    height: 100%;
                }

                .toolbar {
                    display: flex;
                    gap: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    flex-wrap: wrap;
                }

                .search-box {
                    flex: 1;
                    min-width: 250px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0 0.75rem;
                }

                .search-icon {
                    opacity: 0.5;
                    margin-right: 0.5rem;
                }

                .search-box input {
                    width: 100%;
                    background: none;
                    border: none;
                    padding: 0.75rem 0;
                    color: white;
                    outline: none;
                }

                .filters {
                    display: flex;
                    gap: 0.75rem;
                }

                .filter-select {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #e2e8f0;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    outline: none;
                }

                .filter-select:hover {
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .table-wrapper {
                    background: rgba(24, 25, 28, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    overflow: hidden;
                    flex: 1;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    color: #9ca3af;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .data-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                    color: #e5e7eb;
                    vertical-align: middle;
                    font-size: 0.9rem;
                }

                .clickable-row {
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .clickable-row:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .req-number {
                    font-weight: 600;
                    color: #fff;
                    font-size: 1rem;
                }

                .type-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.25rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .type-badge.mir { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
                .type-badge.po { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }

                .status-pill {
                    padding: 0.25rem 0.75rem;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .status-draft { background: rgba(63, 63, 70, 0.5); color: #d4d4d8; }
                .status-sent { background: rgba(30, 58, 138, 0.5); color: #93c5fd; }
                .status-approved { background: rgba(6, 78, 59, 0.5); color: #6ee7b7; }
                
                .text-dim { color: #94a3b8; }
                
                .actions-cell { text-align: center; }

                .btn-icon {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                }
                .btn-icon:hover {
                    background: rgba(59, 130, 246, 0.2);
                    color: white;
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    color: #94a3b8;
                }
                .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
            `}</style>

            {selectedRequest && (
                <MaterialRequestDetailsModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdate={() => {
                        loadRequests()
                        setSelectedRequest(null)
                    }}
                />
            )}
        </div>
    )
}
