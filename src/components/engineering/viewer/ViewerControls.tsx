import React, { useMemo, useState } from 'react'
import { useViewerStore, ViewMode } from './ViewerLogic'

export default function ViewerControls() {
    const {
        viewMode,
        setViewMode,
        spools,
        selection,
        activeSpoolId,
        setActiveSpool,
        setMapping,
        clearSelection,
        meshSpoolMap
    } = useViewerStore()

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Transform Map to Array and Sort
    const sortedSpools = useMemo(() => {
        return Array.from(spools.values())
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [spools, searchTerm])

    const selectedCount = selection.size

    // Handle Assigning Selection to a Spool
    const handleAssign = (spoolId: string) => {
        if (selectedCount === 0) return

        selection.forEach(meshName => {
            setMapping(meshName, spoolId)
        })
        clearSelection()
        // Optional: toast notification here
    }

    // Colors from POC
    const colors = {
        primary: '#667eea',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#1e1e2e',
        panelBg: 'rgba(30, 30, 46, 0.95)',
        border: 'rgba(255, 255, 255, 0.1)',
        textMuted: '#a0a0b0'
    }

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col font-sans text-white">

            {/* --- Top Bar (View Modes) --- */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
                <div className="flex items-center gap-1 bg-[#1e1e2e]/90 backdrop-blur border border-white/10 p-1.5 rounded-xl shadow-xl">
                    <ViewModeButton
                        active={viewMode === 'normal'}
                        onClick={() => setViewMode('normal')}
                        label="Normal"
                        icon="👁️"
                    />
                    <div className="w-px h-5 bg-white/20 mx-1" />
                    <ViewModeButton
                        active={viewMode === 'assignment'}
                        onClick={() => setViewMode('assignment')}
                        label="Asignación"
                        icon="✍️"
                    />
                    <ViewModeButton
                        active={viewMode === 'fabrication'}
                        onClick={() => setViewMode('fabrication')}
                        label="Fabricación"
                        icon="🏭"
                    />
                    <ViewModeButton
                        active={viewMode === 'mounting'}
                        onClick={() => setViewMode('mounting')}
                        label="Montaje"
                        icon="🏗️"
                    />
                </div>
            </div>

            {/* --- Sidebar Panel --- */}
            <div
                className={`pointer-events-auto h-full bg-[#1e1e2e]/95 backdrop-blur border-r border-white/10 transition-transform duration-300 ease-in-out flex flex-col z-20 shadow-2xl ${isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
                    }`}
                style={{ width: '340px' }}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                    <h1 className="text-base font-bold text-[#667eea] tracking-wide m-0">
                        🏗️ Control de Obra
                    </h1>
                    <button
                        onClick={() => setSidebarCollapsed(true)}
                        className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Selection Status Card */}
                    <div>
                        <SectionTitle>Selección Actual</SectionTitle>
                        <div className="bg-black/20 p-4 rounded-lg border border-white/10 flex flex-col items-center justify-center min-h-[80px] text-center">
                            {selectedCount === 0 ? (
                                <>
                                    <span className="text-[#a0a0b0] text-xs">Ningún elemento seleccionado</span>
                                    <span className="text-[10px] text-[#a0a0b0]/70 mt-1">Usa Ctrl + Click para múltiple</span>
                                </>
                            ) : (
                                <>
                                    <div className="bg-[#667eea] text-[10px] font-bold px-2 py-0.5 rounded text-white mb-2">
                                        SELECCIÓN
                                    </div>
                                    <h2 className="text-white font-bold m-0">{selectedCount} Elementos</h2>
                                    <button
                                        onClick={() => clearSelection()}
                                        className="text-xs text-[#ef4444] hover:underline mt-2"
                                    >
                                        Limpiar selección
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Spools List */}
                    <div className="flex-1 flex flex-col">
                        <SectionTitle>
                            Spools Disponibles
                            <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-white">
                                {spools.size}
                            </span>
                        </SectionTitle>

                        <input
                            type="text"
                            placeholder="Buscar Spool..."
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-white mb-2 focus:border-[#667eea] outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="border border-white/10 rounded-md bg-black/20 flex-1 overflow-y-auto max-h-[400px]">
                            {sortedSpools.length === 0 ? (
                                <div className="p-4 text-center text-[#a0a0b0] text-xs italic">
                                    No se encontraron spools
                                </div>
                            ) : (
                                sortedSpools.map(spool => {
                                    // Check if current selection is assigned to this spool
                                    // This is a bit expensive to check every render if selection is huge, but ok for now
                                    // Or we can check if activeSpoolId matches
                                    const isAssigned = false // TODO: logic to show if selection belongs here

                                    return (
                                        <div
                                            key={spool.id}
                                            className={`
                                                group p-2 text-xs cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex flex-col gap-1
                                                ${activeSpoolId === spool.id ? 'bg-[#667eea]/20 border-l-2 border-l-[#667eea]' : 'border-l-2 border-l-transparent'}
                                            `}
                                            onClick={() => setActiveSpool(spool.id)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`font-mono font-medium ${activeSpoolId === spool.id ? 'text-white' : 'text-[#a0a0b0] group-hover:text-white'}`}>
                                                    {spool.name}
                                                </span>
                                                <div className="flex gap-1">
                                                    <StatusDot active={spool.status === 'FABRICADO'} color={colors.success} type="F" />
                                                    <StatusDot active={spool.status === 'MONTADO'} color={colors.primary} type="M" />
                                                </div>
                                            </div>

                                            {/* Action: Assign to this Spool */}
                                            {viewMode === 'assignment' && selectedCount > 0 && (
                                                <div className="mt-1 flex justify-end">
                                                    <button
                                                        className="bg-[#667eea] hover:bg-[#5a6fd6] text-white text-[10px] px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleAssign(spool.id)
                                                        }}
                                                    >
                                                        <span>🔗</span> Asignar {selectedCount} items
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Camera/Tips */}
                    <div>
                        <SectionTitle>Control</SectionTitle>
                        <div className="bg-black/20 p-3 rounded text-[11px] text-[#a0a0b0] leading-relaxed">
                            <p>• <strong>ClickIzq</strong>: Rotar</p>
                            <p>• <strong>ClickDer</strong>: Pan (Mover)</p>
                            <p>• <strong>Rueda</strong>: Zoom</p>
                            <p>• <strong>Ctrl + Click</strong>: Selección múltiple</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Toggle Sidebar Button (when collapsed) */}
            {isSidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="absolute top-5 left-5 pointer-events-auto bg-[#1e1e2e] border border-white/10 text-white p-2 rounded-lg hover:bg-white/10 transition-colors shadow-lg z-20"
                >
                    ☰
                </button>
            )}

            {/* Loading/Notification Overlay */}
            {/* Logic for notifications will be added via store later or local state */}

        </div>
    )
}

// --- Subcomponents ---

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-[11px] uppercase tracking-widest text-[#a0a0b0] font-bold mb-2 flex items-center justify-between">
            {children}
        </h3>
    )
}

function ViewModeButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${active
                    ? 'bg-[#667eea] text-white shadow-lg scale-105'
                    : 'text-[#a0a0b0] hover:text-white hover:bg-white/5'
                }
            `}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    )
}

function StatusDot({ active, color, type }: { active: boolean, color: string, type: string }) {
    return (
        <div
            className="w-2 h-2 rounded-full ring-1 ring-offset-1 ring-offset-[#1e1e2e] ring-transparent"
            style={{
                backgroundColor: active ? color : '#333',
                boxShadow: active ? `0 0 5px ${color}` : 'none'
            }}
            title={active ? 'Completado' : 'Pendiente'}
        />
    )
}
