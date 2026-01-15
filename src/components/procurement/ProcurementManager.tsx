'use client'

import { useState } from 'react'
import { Book, FileText, BarChart2, Download, Package, Ruler } from 'lucide-react'
import MaterialRequestList from '@/components/procurement/MaterialRequestList'
import ConsolidatedMTO from '@/components/procurement/ConsolidatedMTO'
import PipeInventoryMaster from '@/components/procurement/PipeInventoryMaster'
import MaterialCatalogManager from '@/components/procurement/MaterialCatalogManager'
import MaterialReceiptsManager from '@/components/procurement/MaterialReceiptsManager'
import MaterialInventoryManager from '@/components/procurement/MaterialInventoryManager'
import MaterialTrackingView from '@/components/procurement/MaterialTrackingView'
import '@/styles/dashboard.css'
import '@/styles/engineering.css'

interface ProcurementManagerProps {
    projectId: string
    companyId: string
    userRole?: 'founder' | 'admin'
}

type TabType = 'catalog' | 'requests' | 'mto' | 'tracking' | 'receiving' | 'inventory' | 'pipe-manager'

export default function ProcurementManager({ projectId, companyId, userRole = 'founder' }: ProcurementManagerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('catalog')

    return (
        <div className="engineering-hub-container">
            {/* Header Actions (Empty placeholder removed for consistent spacing) */}
            {/* Actions removed as per request to enforce context-aware creation via MTO */}

            {/* Tabs Navigation */}
            <div className="engineering-tabs">
                <button
                    className={`tab-button ${activeTab === 'catalog' ? 'active' : ''}`}
                    onClick={() => setActiveTab('catalog')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Book size={16} /> Catálogo
                </button>
                <button
                    className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <FileText size={16} /> Solicitudes (MIR/PO)
                </button>
                <button
                    className={`tab-button ${activeTab === 'mto' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mto')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <BarChart2 size={16} /> MTO (Ingeniería)
                </button>
                <button
                    className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tracking')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Package size={16} /> Tracking
                </button>
                <button
                    className={`tab-button ${activeTab === 'receiving' ? 'active' : ''}`}
                    onClick={() => setActiveTab('receiving')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Download size={16} /> Recepción
                </button>
                <button
                    className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Package size={16} /> Inventario
                </button>
                <button
                    className={`tab-button ${activeTab === 'pipe-manager' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pipe-manager')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <Ruler size={16} /> Gestión de Cañería
                </button>
            </div>

            {/* Tab Content */}
            <div className="engineering-content" style={{ minHeight: '400px', marginTop: '1.5rem' }}>
                {activeTab === 'catalog' && (
                    <MaterialCatalogManager projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'requests' && (
                    <MaterialRequestList projectId={projectId} />
                )}

                {activeTab === 'mto' && (
                    <ConsolidatedMTO projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'tracking' && (
                    <MaterialTrackingView projectId={projectId} companyId={companyId} />
                )}


                {activeTab === 'receiving' && (
                    <MaterialReceiptsManager projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'inventory' && (
                    <MaterialInventoryManager projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'pipe-manager' && (
                    <PipeInventoryMaster projectId={projectId} companyId={companyId} />
                )}
            </div>


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
