'use client'

import { useState } from 'react'
import MaterialRequestList from '@/components/procurement/MaterialRequestList'
import CreateRequestModal from '@/components/procurement/CreateRequestModal'
import ConsolidatedMTO from '@/components/procurement/ConsolidatedMTO'
import PipeInventoryMaster from '@/components/procurement/PipeInventoryMaster'
import MaterialCatalogManager from '@/components/procurement/MaterialCatalogManager'
import '@/styles/dashboard.css'
import '@/styles/engineering.css'

interface ProcurementManagerProps {
    projectId: string
    companyId: string
    userRole?: 'founder' | 'admin'
}

type TabType = 'catalog' | 'requests' | 'mto' | 'receiving' | 'inventory' | 'pipe-manager'

export default function ProcurementManager({ projectId, companyId, userRole = 'founder' }: ProcurementManagerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('catalog')
    const [showCreateModal, setShowCreateModal] = useState(false)

    return (
        <div className="procurement-manager-container">
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                {activeTab === 'requests' && (
                    <button
                        className="action-button action-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + Nueva Solicitud
                    </button>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="tabs-nav">
                <button
                    className={`tab-button ${activeTab === 'catalog' ? 'active' : ''}`}
                    onClick={() => setActiveTab('catalog')}
                >
                    📚 Catálogo
                </button>
                <button
                    className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    📋 Solicitudes (MIR/PO)
                </button>
                <button
                    className={`tab-button ${activeTab === 'mto' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mto')}
                >
                    📊 MTO (Ingeniería)
                </button>
                <button
                    className={`tab-button ${activeTab === 'receiving' ? 'active' : ''}`}
                    onClick={() => setActiveTab('receiving')}
                >
                    📥 Recepción
                </button>
                <button
                    className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    📦 Inventario
                </button>
                <button
                    className={`tab-button ${activeTab === 'pipe-manager' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pipe-manager')}
                >
                    📏 Gestión de Cañería
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content" style={{ minHeight: '400px', marginTop: '1.5rem' }}>
                {activeTab === 'catalog' && (
                    <MaterialCatalogManager projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'requests' && (
                    <MaterialRequestList projectId={projectId} />
                )}

                {activeTab === 'mto' && (
                    <ConsolidatedMTO projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'receiving' && (
                    <div className="coming-soon-placeholder">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📥</div>
                        <h3>Módulo de Recepción</h3>
                        <p>Ingreso de materiales y control de guías de despacho</p>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="coming-soon-placeholder">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                        <h3>Inventario de Materiales</h3>
                        <p>Visualización de stock disponible y asignado</p>
                    </div>
                )}

                {activeTab === 'pipe-manager' && (
                    <PipeInventoryMaster projectId={projectId} companyId={companyId} />
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateRequestModal
                    projectId={projectId}
                    companyId={companyId}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        window.location.reload()
                    }}
                />
            )}

            <style jsx>{`
                .coming-soon-placeholder {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 0.5rem;
                    color: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    )
}
