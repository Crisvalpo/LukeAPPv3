'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SpoolWithTag {
    id: string
    spool_number: string
    management_tag: string | null
    status: string
    total_welds: number
    current_location_id: string | null
    location: {
        name: string
        code: string
    } | null
}

interface Props {
    revisionId: string
    projectId: string
}

export default function RevisionSpoolsList({ revisionId, projectId }: Props) {
    const [spools, setSpools] = useState<SpoolWithTag[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadSpools() {
            setIsLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('spools')
                .select(`
                    id,
                    spool_number,
                    management_tag,
                    status,
                    total_welds,
                    current_location_id,
                    location:current_location_id (name, code)
                `)
                .eq('revision_id', revisionId)
                .order('spool_number', { ascending: true })

            if (!error && data) {
                const loadedSpools = data.map((item: any) => ({
                    id: item.id,
                    spool_number: item.spool_number,
                    management_tag: item.management_tag,
                    status: item.status,
                    total_welds: item.total_welds,
                    current_location_id: item.current_location_id,
                    location: item.location
                }))
                setSpools(loadedSpools)
            } else if (error) {
                console.error('Error fetching spools:', error)
            }
            setIsLoading(false)
        }

        loadSpools()
    }, [revisionId])

    if (isLoading) {
        return <div className="loading-state">Cargando spools...</div>
    }

    if (spools.length === 0) {
        return <div className="empty-state">No hay spools generados para esta revisión.</div>
    }

    return (
        <div className="spools-list-container">
            <div className="list-header">
                <h5>
                    <span className="icon">🏷️</span>
                    Spools y Tags de Gestión
                </h5>
                <span className="count-badge">Total: {spools.length} spools</span>
            </div>

            <div className="table-wrapper glass-panel">
                <table className="spools-table">
                    <thead>
                        <tr>
                            <th style={{ width: '120px' }}>Tag Gestión</th>
                            <th>Spool Number</th>
                            <th>Ubicación</th>
                            <th style={{ textAlign: 'center' }}>Uniones</th>
                            <th style={{ textAlign: 'right' }}>Estado Actual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spools.map(spool => (
                            <tr key={spool.id}>
                                <td>
                                    <span className="tag-badge">
                                        {spool.management_tag || '---'}
                                    </span>
                                </td>
                                <td className="font-medium">
                                    {spool.spool_number}
                                </td>
                                <td>
                                    {spool.location ? (
                                        <div className="location-cell">
                                            <span className="loc-code">{spool.location.code}</span>
                                            <span className="loc-name" title={spool.location.name}>
                                                {spool.location.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="empty-val">Sin asignar</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                                    {spool.total_welds}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <StatusBadge status={spool.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="footer-note">
                * Los tags de gestión son asignados automáticamente al cargar la revisión.
            </div>

            <style jsx>{`
                .loading-state, .empty-state {
                    padding: 20px;
                    text-align: center;
                    color: var(--color-text-muted);
                    font-size: 0.875rem;
                }
                
                .spools-list-container {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 0 0 12px 12px;
                    border-top: 1px solid var(--glass-border);
                    padding: 16px;
                    animation: slideDown 0.3s ease-out;
                    margin-top: -1px;
                }

                .list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }

                .list-header h5 {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                }

                .list-header .icon {
                    background: rgba(126, 34, 206, 0.2);
                    color: #d8b4fe;
                    padding: 4px;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .count-badge {
                    font-size: 0.75rem;
                    color: var(--color-text-dim);
                    font-weight: 500;
                }

                .table-wrapper {
                    background: var(--color-bg-surface-1);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .spools-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                }

                .spools-table th {
                    text-align: left;
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.03);
                    color: var(--color-text-muted);
                    font-weight: 600;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    border-bottom: 1px solid var(--glass-border);
                }

                .spools-table td {
                    padding: 10px 16px;
                    border-bottom: 1px solid var(--glass-border);
                    color: var(--color-text-main);
                }

                .spools-table tr:last-child td {
                    border-bottom: none;
                }

                .spools-table tr:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                }

                .tag-badge {
                    font-family: var(--font-family-mono);
                    font-weight: 700;
                    color: #d8b4fe;
                    background: rgba(126, 34, 206, 0.15);
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid rgba(126, 34, 206, 0.3);
                    display: inline-block;
                }

                .font-medium {
                    font-weight: 500;
                    color: var(--color-text-main);
                }

                .location-cell {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--color-text-muted);
                }

                .loc-code {
                    font-size: 0.7rem;
                    font-weight: 700;
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text-main);
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 1px solid var(--glass-border);
                }

                .loc-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 150px;
                }

                .empty-val {
                    color: var(--color-text-dim);
                    font-style: italic;
                    font-size: 0.8rem;
                    padding-left: 8px;
                }

                .footer-note {
                    margin-top: 10px;
                    text-align: center;
                    font-size: 0.7rem;
                    color: var(--color-text-dim);
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config = getStatusConfig(status)

    return (
        <span className="status-badge">
            <span className="status-icon">{config.icon}</span>
            {status.replace(/_/g, ' ')}
            <style jsx>{`
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 10px;
                    border-radius: 99px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    background-color: ${config.bg};
                    color: ${config.text};
                    border: 1px solid ${config.border};
                    white-space: nowrap;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .status-icon {
                    font-size: 0.8rem;
                    line-height: 1;
                }
            `}</style>
        </span>
    )
}

function getStatusConfig(status: string) {
    // Adapted colors for Dark Mode
    const map: Record<string, any> = {
        'PENDING': { bg: 'rgba(234, 179, 8, 0.15)', text: '#fef08a', border: 'rgba(234, 179, 8, 0.3)', icon: '⏳' },
        'IN_FABRICATION': { bg: 'rgba(59, 130, 246, 0.15)', text: '#bfdbfe', border: 'rgba(59, 130, 246, 0.3)', icon: '🔨' },
        'COMPLETED': { bg: 'rgba(16, 185, 129, 0.15)', text: '#a7f3d0', border: 'rgba(16, 185, 129, 0.3)', icon: '✅' },
        'PAINTING': { bg: 'rgba(236, 72, 153, 0.15)', text: '#fbcfe8', border: 'rgba(236, 72, 153, 0.3)', icon: '🎨' },
        'SHIPPED': { bg: 'rgba(99, 102, 241, 0.15)', text: '#c7d2fe', border: 'rgba(99, 102, 241, 0.3)', icon: '🚚' },
        'INSTALLED': { bg: 'rgba(148, 163, 184, 0.15)', text: '#e2e8f0', border: 'rgba(148, 163, 184, 0.3)', icon: '🏗️' },
        'DELIVERED': { bg: 'rgba(6, 182, 212, 0.15)', text: '#a5f3fc', border: 'rgba(6, 182, 212, 0.3)', icon: '📦' }
    }
    return map[status] || { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'themes', icon: '❓' }
}
