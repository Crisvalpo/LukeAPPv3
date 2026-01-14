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
        <div style={{
            width: '280px',
            backgroundColor: '#1e1e2e',
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40
        }}>
            {/* Header */}
            <div style={{
                padding: '12px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0f172a'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔩</span>
                    <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '0.9rem' }}>
                        Juntas ({joints.length})
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Config/Filter */}
            <div style={{ padding: '8px', borderBottom: '1px solid #334155' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    padding: '4px 8px'
                }}>
                    <Search size={14} color="#64748b" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.8rem',
                            outline: 'none',
                            width: '100%',
                            marginLeft: '6px'
                        }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
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
                            style={{ cursor: 'grab' }}
                        >
                            <JointCompactCard joint={joint} />
                        </div>
                    ))
                )}
            </div>

            <div style={{
                padding: '8px',
                backgroundColor: '#334155',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                textAlign: 'center'
            }}>
                Arrastra una junta hacia un Spool para asignarla
            </div>
        </div>
    )
}
