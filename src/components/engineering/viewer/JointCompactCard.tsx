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
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#1a1d2e',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '0.85rem',
                marginBottom: '4px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                    e.currentTarget.style.borderColor = '#3b82f6'
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.backgroundColor = '#1a1d2e'
                    e.currentTarget.style.borderColor = '#334155'
                }
            }}
        >
            {/* Joint Icon */}
            <span style={{ fontSize: '1.1rem' }}>{jointIcon}</span>

            {/* Joint Number */}
            <span style={{
                fontWeight: 'bold',
                color: '#e2e8f0',
                fontSize: '0.9rem'
            }}>
                {joint.flanged_joint_number}
            </span>

            {/* Rating */}
            {joint.rating && (
                <span style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                }}>
                    {joint.rating}
                </span>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Status Button Indicator */}
            <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: statusColor.fill,
                boxShadow: `0 0 8px ${statusColor.text}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a1d2e' // Dark icon color
            }}>
                {isExecuted && <Check size={12} strokeWidth={4} />}
                {isDeleted && <X size={12} strokeWidth={4} />}
            </div>
        </div>
    )
}
