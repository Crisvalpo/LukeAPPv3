/**
 * Material Ownership Panel
 * Allows marking isometrics as CLIENT or CONTRACTOR material responsibility
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, Building2, Hammer, X } from 'lucide-react'

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
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserCheck className="text-brand-primary" size={24} />
                    Ownership de Materiales
                </h3>
                <p className="text-text-dim text-sm">Define quién suministrará el material para cada isométrico.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-white mb-1">{stats.total}</span>
                    <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Total ISOs</span>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-sky-400 mb-1">{stats.client}</span>
                    <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Cliente</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-emerald-400 mb-1">{stats.contractor}</span>
                    <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Contractor</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-amber-500 mb-1">{stats.pending}</span>
                    <span className="text-text-dim text-xs uppercase tracking-wider font-semibold">Sin Definir</span>
                </div>
            </div>

            <div className="bg-bg-surface-1/40 backdrop-blur-xl border border-glass-border/50 rounded-xl overflow-hidden shadow-lg">
                <div className="grid grid-cols-[1fr,auto] gap-4 p-4 text-xs uppercase tracking-wider font-semibold text-text-dim bg-white/5 border-b border-glass-border/30">
                    <div>Isométrico</div>
                    <div className="text-center w-[280px]">Asignación de Responsabilidad</div>
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-glass-border/30">
                    {isometrics.map(iso => (
                        <div key={iso.id} className="grid grid-cols-[1fr,auto] gap-4 p-3 items-center hover:bg-white/5 transition-colors group">
                            <div className="font-mono text-sm font-medium text-white group-hover:text-brand-primary transition-colors pl-2">
                                {iso.iso_number}
                            </div>
                            <div className="flex items-center gap-2 justify-end w-[280px]">
                                <button
                                    onClick={() => updateOwnership(iso.id, 'CLIENT')}
                                    disabled={saving}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${iso.material_owner === 'CLIENT'
                                        ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-lg shadow-sky-500/10'
                                        : 'bg-white/5 border-transparent text-text-dim hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-300'
                                        }`}
                                >
                                    <Building2 size={14} />
                                    Cliente
                                </button>
                                <button
                                    onClick={() => updateOwnership(iso.id, 'CONTRACTOR')}
                                    disabled={saving}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${iso.material_owner === 'CONTRACTOR'
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                                        : 'bg-white/5 border-transparent text-text-dim hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300'
                                        }`}
                                >
                                    <Hammer size={14} />
                                    Contractor
                                </button>
                                {iso.material_owner && (
                                    <button
                                        onClick={() => updateOwnership(iso.id, null)}
                                        disabled={saving}
                                        className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all flex items-center justify-center"
                                        title="Limpiar asignación"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
