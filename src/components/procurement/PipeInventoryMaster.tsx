'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PipeStick, PipeNeed, aggregatePipeNeeds } from '@/services/pipe-inventory'
import { getConsolidatedMTO } from '@/services/material-consolidation'
import '@/styles/engineering.css'

// Only using lucide icons, removed custom UI components
import { Loader2, Ruler, Package } from 'lucide-react'

interface PipeInventoryMasterProps {
    projectId: string
    companyId: string
}

export default function PipeInventoryMaster({ projectId, companyId }: PipeInventoryMasterProps) {
    const [activeSubTab, setActiveSubTab] = useState('planning')
    const [isLoading, setIsLoading] = useState(false)

    // State for Planning
    const [pipeNeeds, setPipeNeeds] = useState<PipeNeed[]>([])

    // State for Inventory
    const [inventory, setInventory] = useState<PipeStick[]>([])

    // Load initial data
    useEffect(() => {
        loadInventory()
    }, [projectId])

    async function loadInventory() {
        const supabase = createClient()
        const { data } = await supabase
            .from('pipe_sticks')
            .select('*')
            .eq('project_id', projectId)
            .order('ident_code')

        if (data) setInventory(data as PipeStick[])
    }

    async function handleCalculateNeeds() {
        setIsLoading(true)
        try {
            const mto = await getConsolidatedMTO(projectId)

            // Extract all spool IDs from MTO
            const allSpoolIds: string[] = []
            mto.forEach(iso => iso.spools.forEach(s => allSpoolIds.push(s.spool_id)))

            // Aggregate needs
            const needs = await aggregatePipeNeeds(projectId, allSpoolIds)
            setPipeNeeds(needs)
        } catch (error) {
            console.error('Error calculating needs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="engineering-content">
            {/* Sub Navigation */}
            <div className="tabs-nav" style={{ marginBottom: 'var(--spacing-6)' }}>
                <button
                    className={`tab-button ${activeSubTab === 'planning' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('planning')}
                >
                    📊 Planificación
                </button>
                <button
                    className={`tab-button ${activeSubTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('inventory')}
                >
                    📦 Inventario Físico
                </button>
                <button
                    className={`tab-button ${activeSubTab === 'dispatch' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('dispatch')}
                >
                    🚚 Despachos
                </button>
                <button
                    className={`tab-button ${activeSubTab === 'cutting' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('cutting')}
                >
                    ✂️ Taller / Corte
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="tab-content">
                {/* PLANNING TAB */}
                {activeSubTab === 'planning' && (
                    <div className="data-section">
                        <div className="section-header">
                            <div>
                                <h3>Cálculo de Necesidades Globales</h3>
                                <p className="section-subtitle">
                                    Agrupa requerimientos de cañería de todos los Spools para optimizar el uso de Sticks.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                                <button
                                    className="action-button action-primary"
                                    onClick={handleCalculateNeeds}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="icon-sm animate-spin" style={{ marginRight: '8px' }} />
                                            Calculando...
                                        </>
                                    ) : (
                                        <>
                                            <Ruler className="icon-sm" style={{ marginRight: '8px' }} />
                                            Calcular Total Proyecto
                                        </>
                                    )}
                                </button>
                                <button
                                    className="action-button"
                                    onClick={loadInventory}
                                >
                                    <Package className="icon-sm" style={{ marginRight: '8px' }} />
                                    Refrescar
                                </button>
                            </div>
                        </div>

                        {pipeNeeds.length > 0 ? (
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left' }}>Material / Ident</th>
                                            <th style={{ textAlign: 'right' }}>Total Requerido (m)</th>
                                            <th style={{ textAlign: 'right' }}>Spools</th>
                                            <th style={{ textAlign: 'right' }}>Sticks Est. (12m)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pipeNeeds.map((need, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '4px' }}>
                                                        {need.material_spec}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-dim)' }}>
                                                        {need.ident_code}
                                                    </div>
                                                </td>
                                                <td style={{
                                                    textAlign: 'right',
                                                    fontFamily: 'var(--font-family-mono)',
                                                    color: 'var(--color-primary)',
                                                    fontWeight: '700',
                                                    fontSize: 'var(--font-size-lg)'
                                                }}>
                                                    {need.total_required_meters.toFixed(2)}m
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                                    {need.spool_ids.length}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-text-main)' }}>
                                                    {Math.ceil(need.total_required_meters / 12)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <h4>No hay cálculos activos</h4>
                                <p>Haz click en "Calcular Total Proyecto" para analizar las necesidades de cañería.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeSubTab === 'inventory' && (
                    <div className="data-section">
                        <div className="section-header">
                            <h3>Inventario de Sticks</h3>
                            <p className="section-subtitle">Control de tiras físicas, retazos y ubicación.</p>
                        </div>

                        {inventory.length > 0 ? (
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left' }}>Ident Code</th>
                                            <th style={{ textAlign: 'left' }}>Heat Number</th>
                                            <th style={{ textAlign: 'right' }}>Largo Inicial</th>
                                            <th style={{ textAlign: 'right' }}>Largo Actual</th>
                                            <th style={{ textAlign: 'center' }}>Ubicación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map(stick => (
                                            <tr key={stick.id}>
                                                <td style={{ fontWeight: '600' }}>{stick.ident_code}</td>
                                                <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                                                    {stick.heat_number || '-'}
                                                </td>
                                                <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                                    {stick.initial_length}m
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-text-main)' }}>
                                                    {stick.current_length}m
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`status-badge status-${stick.location.toLowerCase()}`}>
                                                        {stick.location}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <h4>No hay inventario registrado</h4>
                                <p>Los sticks de cañería aparecerán aquí una vez que se registren en el sistema.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* DISPATCH TAB */}
                {activeSubTab === 'dispatch' && (
                    <div className="empty-state">
                        <div className="empty-icon">🚚</div>
                        <h4>Módulo de Despachos</h4>
                        <p>Gestión de envíos masivos de sticks a talleres. Próximamente disponible.</p>
                    </div>
                )}

                {/* CUTTING TAB */}
                {activeSubTab === 'cutting' && (
                    <div className="empty-state">
                        <div className="empty-icon">✂️</div>
                        <h4>Vista de Taller / Corte</h4>
                        <p>Órdenes inteligentes de corte para optimizar el uso de retazos. Próximamente disponible.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
