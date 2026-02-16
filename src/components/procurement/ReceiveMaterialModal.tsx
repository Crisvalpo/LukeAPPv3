'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { receiveMaterials } from '@/services/material-inventory'
import { searchProjectMaterials } from '@/services/project-materials'
import { Heading, Text } from '@/components/ui/Typography'
import { X, Save, Search, Package, Layers } from 'lucide-react'

interface Props {
    projectId: string
    onClose: () => void
    onSuccess: () => void
}

export default function ReceiveMaterialModal({ projectId, onClose, onSuccess }: Props) {
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
    const [quantity, setQuantity] = useState('')
    const [heatNumber, setHeatNumber] = useState('')
    const [location, setLocation] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (search.length > 2) {
            handleSearch()
        }
    }, [search])

    async function handleSearch() {
        const results = await searchProjectMaterials(projectId, search)
        setSearchResults(results)
    }

    async function handleSave() {
        if (!selectedItem || !quantity) return

        try {
            setIsSaving(true)
            await receiveMaterials({
                project_id: projectId,
                company_id: selectedItem.company_id,
                master_id: selectedItem.master_id,
                dimension_id: selectedItem.dimension_id,
                quantity_received: Number(quantity),
                unit: 'UNIT',
                heat_number: heatNumber,
                location_bin: location
            })
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving reception:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <Heading level={3} className="text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-400" />
                        Recibir Material
                    </Heading>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Item Selection */}
                    {!selectedItem ? (
                        <div className="space-y-4">
                            <Text className="text-xs font-bold text-slate-500 uppercase">1. Buscar Item en el Catálogo del Proyecto</Text>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Tubería, Codo, Brida..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {searchResults.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="w-full text-left p-3 rounded-xl bg-white/5 border border-transparent hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-bold text-sm">{item.master_catalog?.commodity_code}</span>
                                            <span className="text-xs text-slate-500 font-mono italic">
                                                {item.master_dimensions?.nps} {item.master_dimensions?.schedule_rating}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-600 uppercase group-hover:text-blue-400/60 transition-colors">
                                            {item.master_catalog?.component_type}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                            <div>
                                <Text className="text-blue-400 text-xs font-bold uppercase mb-1">Item Seleccionado</Text>
                                <Heading level={4} className="text-white">{selectedItem.master_catalog?.commodity_code}</Heading>
                                <Text className="text-slate-400 text-xs">{selectedItem.master_dimensions?.nps} {selectedItem.master_dimensions?.schedule_rating}</Text>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="text-xs text-blue-400 hover:underline">Cambiar</button>
                        </div>
                    )}

                    {/* Quantity & Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase px-1">Cantidad</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="0.00"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase px-1">Heat Number</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="HT-XXXXX"
                                value={heatNumber}
                                onChange={(e) => setHeatNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase px-1">Ubicación (Bin/Rack)</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Almacén A - Estante 2..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedItem || !quantity}
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Guardando...' : 'Registrar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
