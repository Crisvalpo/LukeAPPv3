'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wrench } from 'lucide-react'

interface Joint {
    id: string
    iso_number: string
    flanged_joint_number: string
    nps: string | null
    rating: string | null
    material: string | null
    piping_class: string | null
}

interface Props {
    revisionId: string
    projectId: string
}

export default function RevisionJointsList({ revisionId }: Props) {
    const [joints, setJoints] = useState<Joint[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadJoints() {
            setIsLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('spools_joints')
                .select('id, iso_number, flanged_joint_number, nps, rating, material, piping_class')
                .eq('revision_id', revisionId)
                .order('iso_number', { ascending: true })
                .order('flanged_joint_number', { ascending: true })

            if (!error && data) {
                setJoints(data as Joint[])
            }
            setIsLoading(false)
        }

        loadJoints()
    }, [revisionId])

    if (isLoading) return <div className="p-4 text-center text-gray-400">Cargando juntas...</div>
    if (joints.length === 0) return <div className="p-4 text-center text-gray-500">No hay juntas registradas.</div>

    return (
        <div className="p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4 px-2">
                <h5 className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-wider">
                    <span className="p-1.5 rounded-md bg-blue-500/20 text-blue-400">
                        <Wrench size={16} />
                    </span>
                    Lista de Juntas
                </h5>
                <span className="text-xs font-medium text-text-dim bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    Total: {joints.length} juntas
                </span>
            </div>

            <div className="bg-bg-surface-1 border border-glass-border rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white/5 text-xs text-text-muted uppercase tracking-wider font-semibold border-b border-glass-border">
                            <tr>
                                <th className="px-5 py-3">Isométrico</th>
                                <th className="px-5 py-3">Número Junta</th>
                                <th className="px-5 py-3">NPS</th>
                                <th className="px-5 py-3">Rating</th>
                                <th className="px-5 py-3">Material</th>
                                <th className="px-5 py-3">Clase</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/30">
                            {joints.map(joint => (
                                <tr key={joint.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3 font-medium text-text-muted">{joint.iso_number}</td>
                                    <td className="px-5 py-3 font-mono text-blue-300">{joint.flanged_joint_number}</td>
                                    <td className="px-5 py-3 text-white font-medium">{joint.nps || '-'}</td>
                                    <td className="px-5 py-3 text-text-muted">{joint.rating || '-'}</td>
                                    <td className="px-5 py-3 text-sm text-text-dim">{joint.material || '-'}</td>
                                    <td className="px-5 py-3 text-sm text-text-dim">{joint.piping_class || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
