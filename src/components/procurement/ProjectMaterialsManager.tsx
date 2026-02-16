'use client'

import { useState, useEffect } from 'react'
import {
    searchProjectMaterials,
    getProjectMaterialStats,
    updateProjectMaterial,
    type ProjectMaterialItem,
    type ProjectMaterialStats
} from '@/services/project-materials'
import { Heading, Text } from '@/components/ui/Typography'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Search, Info, CheckCircle, AlertTriangle, Package, BarChart3, Filter } from 'lucide-react'

interface Props {
    projectId: string
}

export default function ProjectMaterialsManager({ projectId }: Props) {
    const [items, setItems] = useState<ProjectMaterialItem[]>([])
    const [stats, setStats] = useState<ProjectMaterialStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [projectId, searchTerm, activeCategory])

    async function loadData() {
        setLoading(true)
        try {
            const [itemsData, statsData] = await Promise.all([
                searchProjectMaterials(projectId, searchTerm),
                getProjectMaterialStats(projectId)
            ])

            // Filter by category locally if not 'all'
            let filteredItems = itemsData
            if (activeCategory !== 'all') {
                filteredItems = itemsData.filter(item => item.master_catalog?.category === activeCategory)
            }

            setItems(filteredItems)
            setStats(statsData)
        } catch (error) {
            console.error('Error loading project materials:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCertify(item: ProjectMaterialItem) {
        if (!item.master_id) return
        try {
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const { error } = await supabase
                .from('master_catalog')
                .update({ is_verified: true })
                .eq('id', item.master_id)

            if (error) throw error

            loadData()
        } catch (error) {
            console.error('Error certifying material:', error)
            alert('Error al certificar el material')
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid - Glassmorphism */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <Package size={24} />
                        </div>
                        <div>
                            <Text size="sm" className="text-white/50 font-medium">Items Únicos</Text>
                            <Text className="text-2xl font-bold text-white tracking-tight">{stats.total_materials}</Text>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <Text size="sm" className="text-white/50 font-medium">Cantidad Total</Text>
                            <Text className="text-2xl font-bold text-white tracking-tight">{stats.total_quantity.toLocaleString()}</Text>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <Text size="sm" className="text-white/50 font-medium">Pendiente Revisión</Text>
                            <Text className="text-2xl font-bold text-white tracking-tight">
                                {items.filter(i => (i as any).needs_catalog_review).length}
                            </Text>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Filter size={24} />
                        </div>
                        <div>
                            <Text size="sm" className="text-white/50 font-medium">Categorías</Text>
                            <Text className="text-2xl font-bold text-white tracking-tight">{stats.categories.length}</Text>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Toolbar */}
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar componente, NPS o código..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            {['all', 'PIPE', 'ELBOW', 'TEE', 'VALVE', 'FLANGE'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {cat === 'all' ? 'Todos' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Text size="sm" className="text-white/30 italic mr-2">
                            Filtro por Proyecto: <span className="text-indigo-400 font-bold">Activo</span>
                        </Text>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-white/40 uppercase text-[10px] tracking-[0.2em] font-bold">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Componente</th>
                                <th className="px-6 py-4">NPS / Schedule</th>
                                <th className="px-6 py-4">Código Commodity</th>
                                <th className="px-6 py-4 text-center">Cant. Usada</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <Text className="text-white/30">Cargando catálogo del proyecto...</Text>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-white/5 rounded-full text-white/20">
                                                <Package size={48} />
                                            </div>
                                            <Text className="text-white/30">No hay materiales registrados en este proyecto.</Text>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            {item.master_catalog?.is_verified ? (
                                                <StatusBadge status="active" label="Verificado" />
                                            ) : (
                                                <StatusBadge status="pending" label="Pendiente" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <Text className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                                                    {item.master_catalog?.component_type || 'Desconocido'}
                                                </Text>
                                                <Text size="xs" className="text-white/30 uppercase tracking-widest font-bold">
                                                    {item.master_catalog?.category || 'OTRO'}
                                                </Text>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-xs font-bold border border-indigo-500/20">
                                                    {item.master_dimensions?.nps || '-'}
                                                </div>
                                                <span className="text-white/30 text-xs">/</span>
                                                <div className="text-white/70 text-sm font-medium">
                                                    {item.master_dimensions?.schedule_rating || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Text size="xs" className="font-mono text-indigo-400 bg-indigo-400/5 px-2 py-1 rounded inline-block">
                                                {item.master_catalog?.commodity_code || '-'}
                                            </Text>
                                        </td>
                                        <td className="px-6 py-4 text-center text-white font-mono font-bold">
                                            {item.total_quantity_used}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 bg-white/5 hover:bg-indigo-500/20 text-white/40 hover:text-indigo-400 rounded-lg transition-all"
                                                    title="Información Técnica"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                {!item.master_catalog?.is_verified && (
                                                    <button
                                                        onClick={() => handleCertify(item)}
                                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500/60 hover:text-emerald-400 rounded-lg transition-all"
                                                        title="Certificar Material"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="p-4 bg-white/5 border-t border-white/10 text-center">
                    <Text size="xs" className="text-white/10 uppercase tracking-[0.3em] font-black">
                        LukeAPP Material Control System • AWP Integrated
                    </Text>
                </div>
            </div>
        </div>
    )
}
