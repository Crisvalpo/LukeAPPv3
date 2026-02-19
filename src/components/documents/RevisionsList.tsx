'use client'

import { DocumentRevision } from '@/types/document-control'
import { Download, FileText, User } from 'lucide-react'
import { Text } from '@/components/ui/Typography'
import { formatDate } from '@/lib/utils'

interface RevisionsListProps {
    revisions: DocumentRevision[]
}

export default function RevisionsList({ revisions }: RevisionsListProps) {
    if (!revisions || revisions.length === 0) {
        return (
            <div className="p-8 text-center border border-white/5 rounded-xl bg-white/5">
                <Text className="text-slate-400">No hay revisiones registradas.</Text>
            </div>
        )
    }

    return (
        <div className="overflow-hidden border border-white/10 rounded-xl">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-white/5 text-slate-200 font-medium border-b border-white/10">
                    <tr>
                        <th className="px-4 py-3">Revisión</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Archivo</th>
                        <th className="px-4 py-3">Notas</th>
                        <th className="px-4 py-3">Creado Por</th>
                        <th className="px-4 py-3">Fecha</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {revisions.map((rev) => (
                        <tr key={rev.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md font-mono font-bold text-xs">
                                    {rev.rev_code}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <StatusBadge status={rev.status} />
                            </td>
                            <td className="px-4 py-3">
                                {rev.file_url ? (
                                    <a
                                        href={rev.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group"
                                    >
                                        <FileText size={16} />
                                        <span className="underline decoration-blue-500/30 group-hover:decoration-blue-400">
                                            {rev.file_name || 'Descargar'}
                                        </span>
                                        <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                ) : (
                                    <span className="text-slate-600 text-xs italic">Sin archivo</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <span className="line-clamp-2" title={rev.notes || ''}>
                                    {rev.notes || '-'}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-slate-700/50 rounded-full">
                                        <User size={12} />
                                    </div>
                                    <span className="truncate max-w-[150px]">
                                        {rev.creator ? (rev.creator.full_name || rev.creator.email) : 'Sistema'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {formatDate(rev.created_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        'DRAFT': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        'UNDER_REVIEW': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'APPROVED': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'REJECTED': 'bg-red-500/20 text-red-400 border-red-500/30',
        'SUPERSEDED': 'bg-slate-800 text-slate-500 border-slate-700'
    }

    const labels: Record<string, string> = {
        'DRAFT': 'Borrador',
        'UNDER_REVIEW': 'En Revisión',
        'APPROVED': 'Aprobado',
        'REJECTED': 'Rechazado',
        'SUPERSEDED': 'Superseded'
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles['DRAFT']}`}>
            {labels[status] || status}
        </span>
    )
}
