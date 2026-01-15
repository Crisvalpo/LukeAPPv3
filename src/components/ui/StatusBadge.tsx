import React from 'react'

type StatusType = 'active' | 'inactive' | 'pending' | 'maintenance' | 'error' | string

interface StatusBadgeProps {
    status: StatusType
    label?: string // Optional override
    showDot?: boolean
}

import '@/components/ui/badge.css' // Import the CSS file

const getBadgeVariant = (status: StatusType) => {
    const s = status.toLowerCase()

    // Logic Mapping
    if (['active', 'completed', 'present'].includes(s)) return 'badge--active'
    if (['inactive', 'archived', 'absent'].includes(s)) return 'badge--inactive'
    if (['pending', 'paused', 'maintenance'].includes(s)) return 'badge--pending'
    if (['error', 'blocked', 'critical'].includes(s)) return 'badge--error'

    return 'badge--default'
}

export function StatusBadge({ status, label, showDot = true }: StatusBadgeProps) {
    const variantClass = getBadgeVariant(status)

    return (
        <span className={`badge ${variantClass}`}>
            {showDot && (
                <span className="badge__dot" />
            )}
            {label || status}
        </span>
    )
}
