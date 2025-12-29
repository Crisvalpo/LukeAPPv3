'use client'

import { useState, useEffect } from 'react'
import { getConsolidatedMTO, type MTOByIsometric, type MTOItemSummary } from '@/services/material-consolidation'
import CreateRequestModal from './CreateRequestModal'

interface Props {
    projectId: string
    companyId: string
}

export default function ConsolidatedMTO({ projectId, companyId }: Props) {
    const [data, setData] = useState<MTOByIsometric[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedIso, setExpandedIso] = useState<string | null>(null)
    const [selectedItems, setSelectedItems] = useState<MTOItemSummary[]>([])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [projectId])

    async function loadData() {
        setLoading(true)
        try {
            const result = await getConsolidatedMTO(projectId)
            setData(result)
        } catch (error) {
            console.error('Error loading MTO:', error)
        } finally {
            setLoading(false)
        }
    }

    function toggleIso(id: string) {
        setExpandedIso(expandedIso === id ? null : id)
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

    function handleCreateRequestSuccess() {
        setIsModalOpen(false)
        setSelectedItems([]) // Clear selection
        // Could reload data to update "requested" counts
        loadData()
    }

    if (loading) return <div className="loading-spinner">Cargando MTO Consolidado...</div>

    if (data.length === 0) {
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
            <div className="console-header">
                <h3>Consolidado de Materiales (Ingeniería)</h3>
                <div className="actions">
                    <span className="selection-count">
                        {selectedItems.length} items seleccionados
                    </span>
                    <button
                        className="btn-generate"
                        disabled={selectedItems.length === 0}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Generar Solicitud
                    </button>
                </div>
            </div>

            <div className="iso-list">
                {data.map(iso => (
                    <div key={iso.isometric_id} className={`iso-group ${expandedIso === iso.isometric_id ? 'expanded' : ''}`}>
                        <div className="iso-header" onClick={() => toggleIso(iso.isometric_id)}>
                            <span className="iso-name">{iso.iso_number}</span>
                            <span className="iso-spools-count">{iso.spools.length} Spools</span>
                            <span className="chevron">▼</span>
                        </div>

                        {expandedIso === iso.isometric_id && (
                            <div className="iso-content">
                                {iso.spools.map(spool => (
                                    <div key={spool.spool_id} className="spool-block">
                                        <div className="spool-header">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={spool.items.every(i => selectedItems.find(s => s.id === i.id))}
                                                    onChange={() => toggleSpoolSelection(spool.items)}
                                                />
                                                <span className="spool-name">{spool.spool_name}</span>
                                            </label>
                                        </div>
                                        <div className="spool-items">
                                            <table className="items-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '30px' }}></th>
                                                        <th>Descripción</th>
                                                        <th style={{ width: '100px', textAlign: 'right' }}>Requerido</th>
                                                        <th style={{ width: '100px', textAlign: 'right' }}>Solicitado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {spool.items.map(item => (
                                                        <tr key={item.id} className={selectedItems.find(i => i.id === item.id) ? 'selected' : ''}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!selectedItems.find(i => i.id === item.id)}
                                                                    onChange={() => toggleItemSelection(item)}
                                                                />
                                                            </td>
                                                            <td>{item.description}</td>
                                                            <td className="text-right">{item.quantity_required}</td>
                                                            <td className="text-right">{item.quantity_requested}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Integration */}
            {isModalOpen && (
                <CreateRequestModal
                    projectId={projectId}
                    companyId={companyId}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleCreateRequestSuccess}
                    // We need to pass selected items to pre-fill the modal
                    // I will need to update CreateRequestModal props to accept initialItems
                    // For now, let's assume I'll update it in the next step
                    initialItems={selectedItems.map(i => ({
                        material_spec: i.description,
                        quantity: i.quantity_required.toString(),
                        spool_id: i.spool_id, // Important for traceability
                        isometric_id: i.isometric_id
                    }))}
                />
            )}

            <style jsx>{`
                .mto-console {
                    padding: 1rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                }
                .console-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .btn-generate {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn-generate:disabled {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.3);
                    cursor: not-allowed;
                }
                .iso-group {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 0.5rem;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.05);
                }
                .iso-header {
                    padding: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .iso-header:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                .iso-content {
                    padding: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.2);
                }
                .spool-block {
                    margin-bottom: 1.5rem;
                }
                .spool-header {
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                    color: #93c5fd;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }
                .items-table th {
                    text-align: left;
                    padding: 0.5rem;
                    color: #94a3b8;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .items-table td {
                    padding: 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .items-table tr.selected {
                    background: rgba(59, 130, 246, 0.1);
                }
                .text-right { text-align: right; }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
            `}</style>
        </div>
    )
}
