'use client'

import { useState } from 'react'
import { Transmittal } from '@/types/document-control'
import { Plus, Search, Filter, FileText, Send, Calendar, User } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface TransmittalsDashboardProps {
    transmittals: Transmittal[]
}

export default function TransmittalsDashboard({ transmittals }: TransmittalsDashboardProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredTransmittals = transmittals.filter(t =>
        t.transmittal_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipient?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <Heading level={1} className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Transmittals
                    </Heading>
                    <Text className="text-slate-400 text-sm mt-1">
                        Gestión de envíos y entregables oficiales
                    </Text>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/transmittals/new"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95"
                    >
                        <Plus size={18} />
                        Nuevo Transmittal
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-[#1e293b]/50 border border-white/5 rounded-xl p-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código, título o destinatario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300">
                    <Filter size={14} className="text-slate-500" />
                    <span>Más recientes primero</span>
                </div>
            </div>

            {/* Transmittals List */}
            <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                {filteredTransmittals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-full border border-white/5">
                            <Send size={48} className="text-slate-600" />
                        </div>
                        <div className="text-center">
                            <Text className="text-slate-300 text-lg font-medium">No se encontraron transmittals</Text>
                            <Text className="text-slate-500 text-sm mt-1">Crea un nuevo envío para comenzar el seguimiento.</Text>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 text-slate-200 font-medium border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Título / Asunto</th>
                                <th className="px-6 py-4">Destinatario</th>
                                <th className="px-6 py-4">Documentos</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTransmittals.map((trn) => (
                                <tr key={trn.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
                                                <Send size={14} />
                                            </div>
                                            <span className="font-mono font-bold text-white tracking-wide">{trn.transmittal_code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-300">{trn.title || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-600" />
                                            <span>{trn.recipient || 'Sin especificar'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-slate-500" />
                                            <span>{(trn as any).items_count || 0} items</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-600" />
                                            <span>{formatDate(trn.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Actions will go here */}
                                        <button className="text-blue-400 hover:text-blue-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
