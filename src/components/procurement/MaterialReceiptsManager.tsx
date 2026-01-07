import { useState, useEffect } from 'react'
import { FileText, PackageCheck, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MaterialRequest } from '@/types'
import CreateReceiptModal from './CreateReceiptModal'
import MaterialRequestDetailsModal from './MaterialRequestDetailsModal'

interface MaterialReceiptsManagerProps {
    projectId: string
    companyId: string
}

interface ReceiptSummary {
    id: string
    delivery_note: string
    receipt_date: string
    notes: string
    request: {
        request_number: string
    }
}

export default function MaterialReceiptsManager({ projectId, companyId }: MaterialReceiptsManagerProps) {
    const supabase = createClient()
    const [activeView, setActiveView] = useState<'pending' | 'history'>('pending')
    const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([])
    const [receipts, setReceipts] = useState<ReceiptSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Modal States
    const [selectedRequestForReceipt, setSelectedRequestForReceipt] = useState<MaterialRequest | null>(null)
    const [selectedRequestDetails, setSelectedRequestDetails] = useState<MaterialRequest | null>(null)

    useEffect(() => {
        if (projectId) {
            loadData()
        }
    }, [projectId, activeView])

    async function loadData() {
        setIsLoading(true)
        if (activeView === 'pending') {
            const { data, error } = await supabase
                .from('material_requests')
                .select('*')
                .eq('project_id', projectId)
                .in('status', ['APPROVED', 'PARTIAL'])
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error loading pending requests:', error.message, error.details || error)
            } else {
                setPendingRequests(data as any || [])
            }
        } else {
            const { data, error } = await supabase
                .from('material_receipts')
                .select(`
                    *,
                    request:material_requests(request_number)
                `)
                .eq('project_id', projectId)
                .order('receipt_date', { ascending: false })

            if (error) {
                console.error('Error loading receipts:', error.message, error.details || error)
            } else {
                setReceipts(data as any || [])
            }
        }
        setIsLoading(false)
    }

    return (
        <div className="receipts-manager">
            {/* Toolbar */}
            <div className="toolbar">
                <button
                    onClick={() => setActiveView('pending')}
                    className={`tab-button ${activeView === 'pending' ? 'active' : ''}`}
                >
                    <PackageCheck size={18} />
                    <span>Pendientes de Recepción</span>
                </button>
                <button
                    onClick={() => setActiveView('history')}
                    className={`tab-button ${activeView === 'history' ? 'active' : ''}`}
                >
                    <FileText size={18} />
                    <span>Historial de Entradas</span>
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="loading-state">Cargando datos...</div>
            ) : (
                <div className="table-container">
                    {activeView === 'pending' && (
                        <>
                            {pendingRequests.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">✅</div>
                                    <h3 className="empty-title">Todo al día</h3>
                                    <p className="empty-text">No hay solicitudes aprobadas pendientes de recepción.</p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>N° Solicitud</th>
                                            <th>Estado</th>
                                            <th>Fecha Aprobación</th>
                                            <th>Notas</th>
                                            <th className="text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequests.map(req => (
                                            <tr key={req.id}>
                                                <td className="font-mono">{req.request_number}</td>
                                                <td>
                                                    <span className={`status-pill status-${req.status.toLowerCase()}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                                <td className="truncate-note" title={req.notes}>{req.notes || '-'}</td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-icon"
                                                        title="Ver Detalle"
                                                        onClick={() => setSelectedRequestDetails(req)}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-primary-xs"
                                                        onClick={() => setSelectedRequestForReceipt(req)}
                                                    >
                                                        Recepcionar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {activeView === 'history' && (
                        <>
                            {receipts.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📂</div>
                                    <h3 className="empty-title">Sin Recepciones</h3>
                                    <p className="empty-text">No hay historial de recepciones registradas.</p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Guía / Documento</th>
                                            <th>Solicitud Origen</th>
                                            <th>Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receipts.map(receipt => (
                                            <tr key={receipt.id}>
                                                <td className="font-mono text-sm">{new Date(receipt.receipt_date).toLocaleDateString()}</td>
                                                <td className="text-highlight font-bold">{receipt.delivery_note}</td>
                                                <td>
                                                    <span className="request-badge">
                                                        {receipt.request?.request_number || '-'}
                                                    </span>
                                                </td>
                                                <td className="truncate-note" title={receipt.notes}>{receipt.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            {selectedRequestForReceipt && (
                <CreateReceiptModal
                    request={selectedRequestForReceipt}
                    onClose={() => setSelectedRequestForReceipt(null)}
                    onSuccess={() => {
                        loadData() // Refresh list
                    }}
                />
            )}

            {selectedRequestDetails && (
                <MaterialRequestDetailsModal
                    request={selectedRequestDetails}
                    onClose={() => setSelectedRequestDetails(null)}
                    onUpdate={loadData}
                />
            )}

            <style jsx>{`
                /* Toolbar */
                .toolbar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding-top: 0.5rem;
                }

                .tab-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    color: #9ca3af;
                    appearance: none;
                }

                .tab-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .tab-button.active {
                    background: var(--color-primary);
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                    border-color: transparent;
                }

                /* Table Styles */
                .table-container {
                    background: rgba(24, 25, 28, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 1px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                    animation: fadeIn 0.4s ease-out;
                }

                .data-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .data-table th {
                    text-align: left;
                    padding: 1.25rem 1.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    color: #9ca3af;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .data-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                    color: #e5e7eb;
                    vertical-align: middle;
                    transition: background 0.2s;
                    font-size: 0.9rem;
                }

                .data-table tr:hover td {
                    background: rgba(255, 255, 255, 0.04);
                }

                /* Cell Utilities */
                .font-mono {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 500;
                    letter-spacing: -0.025em;
                }

                .truncate-note {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 200px;
                    font-size: 0.75rem;
                    opacity: 0.7;
                }

                .actions-cell {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: flex-end;
                }

                .text-highlight {
                    color: #60a5fa;
                }

                .request-badge {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .text-right {
                    text-align: right;
                }

                /* Buttons */
                .btn-icon {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-icon:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                    transform: scale(1.1);
                }

                .btn-primary-xs {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    padding: 0.35rem 0.8rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);
                }

                .btn-primary-xs:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
                }

                /* Status Pills */
                .status-pill {
                    padding: 0.35em 0.8em;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: inline-block;
                }

                .status-approved {
                    background: rgba(6, 78, 59, 0.5);
                    color: #6ee7b7;
                    border: 1px solid rgba(6, 78, 59, 0.3);
                }

                .status-partial {
                    background: rgba(245, 158, 11, 0.15);
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }
                
                .status-rejected {
                    background: rgba(127, 29, 29, 0.5);
                    color: #fca5a5;
                    border: 1px solid rgba(127, 29, 29, 0.3);
                }

                /* Empty States */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    text-align: center;
                }
                
                .empty-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    opacity: 0.3;
                }
                
                .empty-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.25rem;
                }
                
                .empty-text {
                    color: #6b7280;
                    font-size: 0.9rem;
                }

                .loading-state {
                    padding: 3rem;
                    text-align: center;
                    color: #6b7280;
                }

                /* Animations */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
