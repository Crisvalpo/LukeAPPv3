'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        <div className="table-wrapper glass-panel m-4">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-white/5">
                    <tr>
                        <th className="px-4 py-3">Isométrico</th>
                        <th className="px-4 py-3">Número Junta</th>
                        <th className="px-4 py-3">NPS</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Clase</th>
                    </tr>
                </thead>
                <tbody>
                    {joints.map(joint => (
                        <tr key={joint.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-2 font-medium text-gray-400">{joint.iso_number}</td>
                            <td className="px-4 py-2 text-purple-300 font-mono">{joint.flanged_joint_number}</td>
                            <td className="px-4 py-2">{joint.nps || '-'}</td>
                            <td className="px-4 py-2">{joint.rating || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-400">{joint.material || '-'}</td>
                            <td className="px-4 py-2 text-sm">{joint.piping_class || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
