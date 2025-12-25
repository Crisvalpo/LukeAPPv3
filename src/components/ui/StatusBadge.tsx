import React from 'react'

type StatusType = 'active' | 'inactive' | 'pending' | 'maintenance' | 'error' | string

interface StatusBadgeProps {
    status: StatusType
    label?: string // Optional override
    showDot?: boolean
}

const getStyles = (status: StatusType) => {
    const s = status.toLowerCase()
    if (s === 'active' || s === 'completed' || s === 'present') {
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }
    if (s === 'inactive' || s === 'archived' || s === 'absent') {
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
    if (s === 'pending' || s === 'paused' || s === 'maintenance') {
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
    if (s === 'error' || s === 'blocked' || s === 'critical') {
        return 'bg-red-500/10 text-red-400 border-red-500/20'
    }
    // Default (Blue)
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}

export function StatusBadge({ status, label, showDot = true }: StatusBadgeProps) {
    const styles = getStyles(status)

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
            {showDot && (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            )}
            {label || status}
        </span>
    )
}
