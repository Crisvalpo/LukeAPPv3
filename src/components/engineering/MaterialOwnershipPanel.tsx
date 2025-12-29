/**
 * Material Ownership Panel
 * Allows marking isometrics as CLIENT or CONTRACTOR material responsibility
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Isometric {
    id: string
    iso_number: string
    material_owner: 'CLIENT' | 'CONTRACTOR' | null
}

interface Props {
    projectId: string
}

export default function MaterialOwnershipPanel({ projectId }: Props) {
    const [isometrics, setIsometrics] = useState<Isometric[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadIsometrics()
    }, [projectId])

    async function loadIsometrics() {
        try {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('isometrics')
                .select('id, iso_number, material_owner')
                .eq('project_id', projectId)
                .order('iso_number')

            if (error) throw error

            setIsometrics(data || [])
        } catch (error) {
            console.error('Error loading isometrics:', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateOwnership(id: string, owner: 'CLIENT' | 'CONTRACTOR' | null) {
        try {
            setSaving(true)
            const supabase = createClient()

            const { error } = await supabase
                .from('isometrics')
                .update({ material_owner: owner })
                .eq('id', id)

            if (error) throw error

            // Update local state
            setIsometrics(prev =>
                prev.map(iso => (iso.id === id ? { ...iso, material_owner: owner } : iso))
            )
        } catch (error) {
            console.error('Error updating ownership:', error)
            alert('Error al actualizar ownership')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="ownership-panel loading">Cargando isométricos...</div>
    }

    const stats = {
        total: isometrics.length,
        client: isometrics.filter(i => i.material_owner === 'CLIENT').length,
        contractor: isometrics.filter(i => i.material_owner === 'CONTRACTOR').length,
        pending: isometrics.filter(i => !i.material_owner).length
    }

    return (
        <div className="ownership-panel">
            <div className="panel-header">
                <h3>Ownership de Materiales</h3>
                <p>Define quién suministrará el material para cada isométrico</p>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-label">Total ISOs</span>
                    <span className="stat-value">{stats.total}</span>
                </div>
                <div className="stat-card client">
                    <span className="stat-label">Cliente</span>
                    <span className="stat-value">{stats.client}</span>
                </div>
                <div className="stat-card contractor">
                    <span className="stat-label">Contractor</span>
                    <span className="stat-value">{stats.contractor}</span>
                </div>
                <div className="stat-card pending">
                    <span className="stat-label">Sin Definir</span>
                    <span className="stat-value">{stats.pending}</span>
                </div>
            </div>

            <div className="isometrics-table">
                <div className="table-header">
                    <span>Isométrico</span>
                    <span>Ownership</span>
                </div>

                {isometrics.map(iso => (
                    <div key={iso.id} className="table-row">
                        <span className="iso-number">{iso.iso_number}</span>
                        <div className="ownership-buttons">
                            <button
                                className={`ownership-btn client ${iso.material_owner === 'CLIENT' ? 'active' : ''}`}
                                onClick={() => updateOwnership(iso.id, 'CLIENT')}
                                disabled={saving}
                            >
                                Cliente
                            </button>
                            <button
                                className={`ownership-btn contractor ${iso.material_owner === 'CONTRACTOR' ? 'active' : ''}`}
                                onClick={() => updateOwnership(iso.id, 'CONTRACTOR')}
                                disabled={saving}
                            >
                                Contractor
                            </button>
                            {iso.material_owner && (
                                <button
                                    className="ownership-btn clear"
                                    onClick={() => updateOwnership(iso.id, null)}
                                    disabled={saving}
                                    title="Limpiar"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .ownership-panel {
                    padding: 2rem;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .panel-header {
                    margin-bottom: 2rem;
                }

                .panel-header h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #f7fafc;
                    margin-bottom: 0.5rem;
                }

                .panel-header p {
                    color: #a0aec0;
                    font-size: 0.95rem;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .stat-card.client {
                    border-color: rgba(66, 153, 225, 0.3);
                }

                .stat-card.contractor {
                    border-color: rgba(72, 187, 120, 0.3);
                }

                .stat-card.pending {
                    border-color: rgba(237, 137, 54, 0.3);
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: #a0aec0;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #63b3ed;
                }

                .isometrics-table {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .table-header {
                    display: grid;
                    grid-template-columns: 200px 1fr;
                    gap: 1rem;
                    padding: 1rem 1.5rem;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 600;
                    color: #e2e8f0;
                }

                .table-row {
                    display: grid;
                    grid-template-columns: 200px 1fr;
                    gap: 1rem;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    align-items: center;
                }

                .table-row:last-child {
                    border-bottom: none;
                }

                .iso-number {
                    font-weight: 500;
                    color: #90cdf4;
                }

                .ownership-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .ownership-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    color: #cbd5e0;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .ownership-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                }

                .ownership-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .ownership-btn.client.active {
                    background: rgba(66, 153, 225, 0.2);
                    border-color: #4299e1;
                    color: #90cdf4;
                }

                .ownership-btn.contractor.active {
                    background: rgba(72, 187, 120, 0.2);
                    border-color: #48bb78;
                    color: #9ae6b4;
                }

                .ownership-btn.clear {
                    padding: 0.5rem 0.75rem;
                    background: rgba(245, 101, 101, 0.1);
                    border-color: rgba(245, 101, 101, 0.3);
                    color: #fc8181;
                }

                .ownership-btn.clear:hover:not(:disabled) {
                    background: rgba(245, 101, 101, 0.2);
                }

                .loading {
                    text-align: center;
                    padding: 4rem;
                    color: #a0aec0;
                }
            `}</style>
        </div>
    )
}
