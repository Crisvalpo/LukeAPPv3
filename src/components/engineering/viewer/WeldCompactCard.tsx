'use client'

import { Check, X } from 'lucide-react'

interface WeldCompactCardProps {
    weld: {
        id: string
        weld_number: string
        type_weld: string | null
        nps: string | null
        sch: string | null
        destination: string | null
    }
    weldTypeConfig?: {
        requires_welder: boolean
        icon: string
        color: string
        type_name_es: string
    }
    onClick: () => void
}

export default function WeldCompactCard({ weld, weldTypeConfig, onClick }: WeldCompactCardProps) {
    // Determine icon based on weld type config
    const getWeldIcon = () => {
        if (weldTypeConfig?.icon) {
            return weldTypeConfig.icon
        }
        // Fallback: if requires_welder is explicitly false, use link icon
        if (weldTypeConfig?.requires_welder === false) {
            return '🔗'
        }
        // Default to fire for welded types
        return '🔥'
    }

    // Determine badge color based on destination
    const getDestinationColor = () => {
        if (weld.destination === 'F' || weld.destination?.toUpperCase() === 'FIELD') {
            return {
                bg: 'rgba(249, 115, 22, 0.15)',
                border: '#f97316',
                text: '#fb923c'
            }
        }
        // Default to Shop (S)
        return {
            bg: 'rgba(59, 130, 246, 0.15)',
            border: '#3b82f6',
            text: '#60a5fa'
        }
    }

    const destColor = getDestinationColor()
    const destLabel = weld.destination?.toUpperCase() || 'S'
    const weldIcon = getWeldIcon()

    // Determine Status Color
    const getStatusColor = () => {
        const s = (weld as any).execution_status || 'PENDING'
        switch (s) {
            case 'EXECUTED': return { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80', border: '#22c55e', fill: '#22c55e' }
            case 'REWORK': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', border: '#10b981', fill: '#10b981' }
            case 'DELETED': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444', fill: '#ef4444' }
            default: return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6', fill: '#3b82f6' } // Pending (Blueish default)
        }
    }
    const statusColor = getStatusColor()
    const statusLabel = ((weld as any).execution_status || 'PENDIENTE').substring(0, 3)

    const isExecuted = (weld as any).execution_status === 'EXECUTED' || (weld as any).execution_status === 'REWORK'
    const isDeleted = (weld as any).execution_status === 'DELETED'

    return (
        <div
            onClick={(e) => {
                e.stopPropagation() // Prevent event from bubbling to parent spool card
                onClick()
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                backgroundColor: '#1a1d2e',
                borderRadius: '6px',
                border: '1px solid #334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontSize: '0.85rem',
                marginBottom: '4px'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1d2e'
                e.currentTarget.style.borderColor = '#334155'
            }}
        >
            {/* Dynamic Icon */}
            <span style={{ fontSize: '1.1rem' }}>{weldIcon}</span>

            {/* Weld Number */}
            <span style={{
                fontWeight: 'bold',
                color: '#e2e8f0',
                fontSize: '0.9rem'
            }}>
                {weld.weld_number}
            </span>

            {/* NPS */}
            {weld.nps && (
                <span style={{
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                }}>
                    {weld.nps.endsWith('"') ? weld.nps : `${weld.nps}"`}
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
                color: '#1a1d2e' // Dark icon color for contrast against bright fill
            }}>
                {isExecuted && <Check size={12} strokeWidth={4} />}
                {isDeleted && <X size={12} strokeWidth={4} />}
            </div>
        </div>
    )
}
