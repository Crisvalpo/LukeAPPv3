'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMaterialRequests } from '@/services/material-requests'
import type { MaterialRequest } from '@/types'

interface MaterialRequestListProps {
    projectId: string
}

export default function MaterialRequestList({ projectId }: MaterialRequestListProps) {
    const router = useRouter()

    const [requests, setRequests] = useState<MaterialRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

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

    if (isLoading) return <div className="loading-spinner">Cargando solicitudes...</div>
    if (error) return <div className="error-message">{error}</div>

    if (requests.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Sin Solicitudes</h3>
                <p>No hay solicitudes de material (MIR/PO) registradas en este proyecto.</p>
            </div>
        )
    }

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>N° Solicitud</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>ETA</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(req => (
                        <tr key={req.id}>
                            <td className="font-mono">{req.request_number}</td>
                            <td>
                                <span className={`badge badge-${req.request_type === 'CLIENT_MIR' ? 'info' : 'warning'}`}>
                                    {req.request_type === 'CLIENT_MIR' ? 'MIR Cliente' : 'PO Compra'}
                                </span>
                            </td>
                            <td>
                                <span className="status-pill">
                                    {req.status}
                                </span>
                            </td>
                            <td>{new Date(req.requested_date).toLocaleDateString()}</td>
                            <td>{req.eta_date ? new Date(req.eta_date).toLocaleDateString() : '-'}</td>
                            <td>
                                <button className="btn-icon" title="Ver Detalle">👁️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <style jsx>{`
                .badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .badge-info { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
                .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
                .font-mono { font-family: monospace; }
            `}</style>
        </div>
    )
}
