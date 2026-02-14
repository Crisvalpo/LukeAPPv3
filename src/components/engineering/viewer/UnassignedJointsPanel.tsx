'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import JointCompactCard from './JointCompactCard'
import { X, Search } from 'lucide-react'

interface Props {
    revisionId: string
    onClose: () => void
    refreshTrigger: number
}

export default function UnassignedJointsPanel({ revisionId, onClose, refreshTrigger }: Props) {
    const [joints, setJoints] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function fetchUnassignedJoints() {
            setLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('spools_joints')
                .select('*')
                .eq('revision_id', revisionId)
                .is('spool_id', null) // Only unassigned
                .order('iso_number', { ascending: true })
                .order('flanged_joint_number', { ascending: true })

            if (!error && data) {
                setJoints(data)
            } else {
                console.error('Error fetching unassigned joints:', error)
            }
            setLoading(false)
        }

        fetchUnassignedJoints()
    }, [revisionId, refreshTrigger])

    const filteredJoints = joints.filter(joint =>
        joint.iso_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        joint.flanged_joint_number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDragStart = (e: React.DragEvent, joint: any) => {
        e.dataTransfer.setData('jointId', joint.id)
        e.dataTransfer.setData('jointNumber', joint.flanged_joint_number)
        e.dataTransfer.effectAllowed = 'move'
    }

    return (
        <div className="w-[280px] bg-slate-800 border-r border-slate-700 flex flex-col z-40">
            {/* Header */}
            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🔩</span>
                    <span className="font-bold text-slate-200 text-sm">
                        Juntas ({joints.length})
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="bg-transparent border-none text-slate-400 cursor-pointer p-1 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Config/Filter */}
            <div className="p-2 border-b border-slate-700 bg-slate-800">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2 py-1">
                    <Search size={14} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-white text-xs outline-none w-full ml-1.5 placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-slate-500 text-sm py-4">Cargando...</div>
                ) : filteredJoints.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-4">
                        {searchTerm ? 'Sin resultados' : 'No hay juntas sin asignar'}
                    </div>
                ) : (
                    filteredJoints.map(joint => (
                        <div
                            key={joint.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, joint)}
                            className="cursor-grab active:cursor-grabbing mb-2"
                        >
                            <JointCompactCard joint={joint} />
                        </div>
                    ))
                )}
            </div>

            <div className="p-2 bg-slate-700 text-xs text-slate-200 text-center font-medium">
                Arrastra una junta hacia un Spool para asignarla
            </div>
        </div>
    )
}
