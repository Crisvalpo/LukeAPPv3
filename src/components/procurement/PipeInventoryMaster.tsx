'use client'

import { useState } from 'react'

import { PipeNeed, aggregatePipeNeeds } from '@/services/pipe-inventory'
import { getConsolidatedMTO } from '@/services/material-consolidation'

// Styles migrated to Tailwind v4
import { Loader2, Calculator, TrendingUp, Package, AlertTriangle } from 'lucide-react'

interface PipeInventoryMasterProps {
    projectId: string
    companyId: string
}

export default function PipeInventoryMaster({ projectId, companyId }: PipeInventoryMasterProps) {

    const [isLoading, setIsLoading] = useState(false)

    // State for Planning
    const [pipeNeeds, setPipeNeeds] = useState<PipeNeed[]>([])







    // Computed stats
    const totalMetersNeeded = pipeNeeds.reduce((sum, need) => sum + need.total_required_meters, 0)
    const totalSticksEstimated = pipeNeeds.reduce((sum, need) => sum + Math.ceil(need.total_required_meters / 12), 0)




    // Load initial data


    async function handleCalculateNeeds() {
        setIsLoading(true)
        try {
            const mto = await getConsolidatedMTO(projectId)
            const allSpoolIds = mto.flatMap(iso => iso.spools.map(s => s.spool_id))
            const needs = await aggregatePipeNeeds(projectId, allSpoolIds)
            setPipeNeeds(needs)
        } catch (error) {
            console.error('Error calculating needs:', error)
            alert('Error al calcular necesidades')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="pipe-inventory-master">
            {/* Simplified Planning View - No Banner, No Tabs */}
            <div className="planning-view">
                {/* Stats Cards */}
                {pipeNeeds.length > 0 && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon primary">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Total Requerido</div>
                                <div className="stat-value">{totalMetersNeeded.toFixed(1)} m</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon success">
                                <Package size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Sticks Estimados</div>
                                <div className="stat-value">{totalSticksEstimated}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon warning">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Tipos de Pipe</div>
                                <div className="stat-value">{pipeNeeds.length}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header with actions */}
                <div className="section-header">
                    <div>
                        <h3>Cálculo de Necesidades Globales</h3>
                        <p className="section-subtitle">
                            Agrega requerimientos de todos los spools para optimizar compras y cortes
                        </p>
                    </div>



                    <div className="header-actions">

                        <button
                            className="btn-primary"
                            onClick={handleCalculateNeeds}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Calculando...
                                </>
                            ) : (
                                <>
                                    <Calculator size={16} />
                                    Calcular Total
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Table */}
                {pipeNeeds.length > 0 ? (
                    <div className="pipe-table-container">
                        <table className="pipe-table">
                            <thead>
                                <tr>
                                    <th>Material / Ident</th>
                                    <th className="text-right">Total Requerido</th>
                                    <th className="text-right">Spools</th>
                                    <th className="text-right">Sticks Est.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pipeNeeds.map((need, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <div className="material-info">
                                                <div className="material-spec">{need.material_spec}</div>
                                                <div className="material-ident">{need.ident_code}</div>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <span className="highlight-value">
                                                {need.total_required_meters.toFixed(2)} m
                                            </span>
                                        </td>
                                        <td className="text-right text-muted">
                                            {need.spool_ids.length}
                                        </td>
                                        <td className="text-right">
                                            <span className="badge badge-neutral">
                                                {Math.ceil(need.total_required_meters / 12)} varas
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>


                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Calculator size={48} />
                        </div>
                        <h4>No hay cálculos activos</h4>
                        <p>Haz click en "Calcular Total" para analizar las necesidades de cañería del proyecto</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = `
    .pipe-inventory-master {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem;
    }
    .planning-view {
        background: #1e293b;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }
    .stat-card {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .stat-icon.primary { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .stat-icon.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .stat-icon.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: white; }
    .stat-label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; font-weight: 600; }
    
    .header-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        margin-bottom: 1.5rem;
    }
    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
    }
    .btn-secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.15); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .pipe-table-container {
        overflow-x: auto;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
    }
    .pipe-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .pipe-table th {
        text-align: left;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .pipe-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
    }
    .text-right { text-align: right; }
    .text-muted { color: rgba(255, 255, 255, 0.5); }
    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.1);
    }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .empty-state {
        padding: 4rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: rgba(255, 255, 255, 0.5);
    }
`


