'use client'

import { Check, X } from 'lucide-react'

interface JointCompactCardProps {
    joint: {
        id: string
        flanged_joint_number: string
        bolt_size: string | null
        rating: string | null
        material: string | null
        nps: string | null
        execution_status?: string | null
    }
    onClick?: () => void
}

export default function JointCompactCard({ joint, onClick }: JointCompactCardProps) {
    // Determine Status Color Logic (Matching WeldCompactCard)
    const getStatusColor = () => {
        const s = joint.execution_status || 'PENDING'
        switch (s) {
            case 'EXECUTED': return { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80', border: '#22c55e', fill: '#22c55e' }
            case 'REWORK': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', border: '#10b981', fill: '#10b981' }
            case 'DELETED': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444', fill: '#ef4444' }
            default: return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6', fill: '#3b82f6' } // Pending (Blueish default)
        }
    }

    const statusColor = getStatusColor()
    const isExecuted = joint.execution_status === 'EXECUTED' || joint.execution_status === 'REWORK'
    const isDeleted = joint.execution_status === 'DELETED'

    // Icon for Joint
    const jointIcon = '🔧' // Wrench

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-2 bg-slate-900/50 rounded-md border border-slate-700 transition-all duration-150 text-sm mb-1 ${onClick ? 'cursor-pointer hover:bg-blue-500/10 hover:border-blue-500 group' : 'cursor-default'}`}
        >
            {/* Joint Icon */}
            <span className="text-lg">{jointIcon}</span>

            {/* Joint Number */}
            <span className="font-bold text-slate-200 text-sm">
                {joint.flanged_joint_number}
            </span>

            {/* Rating */}
            {joint.rating && (
                <span className="text-slate-400 text-xs font-mono">
                    {joint.rating}
                </span>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Status Button Indicator */}
            <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-slate-900"
                style={{
                    backgroundColor: statusColor.fill,
                    boxShadow: `0 0 8px ${statusColor.text}40`,
                }}
            >
                {isExecuted && <Check size={12} strokeWidth={4} />}
                {isDeleted && <X size={12} strokeWidth={4} />}
            </div>
        </div>
    )
}
