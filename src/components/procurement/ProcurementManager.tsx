'use client'

import { useState } from 'react'
import {
    ClipboardList,
    BarChart3,
    Inbox,
    Package,
    Book,
    Ruler,
    Layers,
    Search,
    Truck
} from 'lucide-react'
import MaterialRequestList from '@/components/procurement/MaterialRequestList'
import ConsolidatedMTO from '@/components/procurement/ConsolidatedMTO'
import PipeInventoryMaster from '@/components/procurement/PipeInventoryMaster'
import ProjectMaterialsManager from '@/components/procurement/ProjectMaterialsManager'
import SpoolIdentificationDashboard from '@/components/procurement/SpoolIdentificationDashboard'
import MaterialInventoryDashboard from '@/components/procurement/MaterialInventoryDashboard'
import MaterialReceiptsManager from '@/components/procurement/MaterialReceiptsManager'
import MaterialTrackingView from '@/components/procurement/MaterialTrackingView'

interface ProcurementManagerProps {
    projectId: string
    companyId: string
    userRole?: 'founder' | 'admin'
}

type TabType = 'catalog' | 'requests' | 'tracking' | 'receiving' | 'inventory' | 'mto' | 'pipe-manager'

export default function ProcurementManager({ projectId, companyId, userRole = 'founder' }: ProcurementManagerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('catalog')

    return (
        <div className="space-y-6">
            {/* Premium Horizontal Navigation */}
            <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-x-auto scrollbar-hide">
                {[
                    { id: 'catalog', label: 'Catálogo Maestro', icon: <Book className="w-4 h-4" /> },
                    { id: 'requests', label: 'Solicitudes (MIR/PO)', icon: <ClipboardList className="w-4 h-4" /> },
                    { id: 'tracking', label: 'Seguimiento (Expedition)', icon: <Truck className="w-4 h-4" /> },
                    { id: 'receiving', label: 'Recepción (Warehouse)', icon: <Inbox className="w-4 h-4" /> },
                    { id: 'inventory', label: 'Inventario General', icon: <Package className="w-4 h-4" /> },
                    { id: 'mto', label: 'Ingeniería (MTO)', icon: <BarChart3 className="w-4 h-4" /> },
                    { id: 'pipe-manager', label: 'Control Piping', icon: <Ruler className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'catalog' && (
                    <ProjectMaterialsManager projectId={projectId} />
                )}

                {activeTab === 'requests' && (
                    <MaterialRequestList projectId={projectId} />
                )}

                {activeTab === 'mto' && (
                    <ConsolidatedMTO projectId={projectId} companyId={companyId} />
                )}

                {/* Spools moved to Engineering MTO or Pipe Manager */}
                {/* {activeTab === 'spools' && (
                    <SpoolIdentificationDashboard projectId={projectId} />
                )} */}

                {activeTab === 'inventory' && (
                    <MaterialInventoryDashboard projectId={projectId} />
                )}

                {activeTab === 'tracking' && (
                    <MaterialTrackingView projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'receiving' && (
                    <MaterialReceiptsManager projectId={projectId} companyId={companyId} />
                )}

                {activeTab === 'pipe-manager' && (
                    <PipeInventoryMaster projectId={projectId} companyId={companyId} />
                )}
            </div>
        </div>
    )
}
