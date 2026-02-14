import React from 'react'

type StatusType = 'active' | 'inactive' | 'pending' | 'maintenance' | 'error' | string

interface StatusBadgeProps {
    status: StatusType
    label?: string // Optional override
    showDot?: boolean
}

const getBadgeStyles = (status: StatusType) => {
    const s = status.toLowerCase()

    const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold leading-none uppercase tracking-wider border transition-all duration-200"

    // Logic Mapping
    if (['active', 'completed', 'present'].includes(s)) {
        return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]`
    }
    if (['inactive', 'archived', 'absent'].includes(s)) {
        return `${base} bg-slate-500/10 text-slate-400 border-slate-500/20`
    }
    if (['pending', 'paused', 'maintenance'].includes(s)) {
        return `${base} bg-orange-500/10 text-orange-400 border-orange-500/20`
    }
    if (['error', 'blocked', 'critical'].includes(s)) {
        return `${base} bg-red-500/10 text-red-400 border-red-500/20`
    }

    return `${base} bg-blue-500/10 text-blue-400 border-blue-500/20`
}

export function StatusBadge({ status, label, showDot = true }: StatusBadgeProps) {
    const styles = getBadgeStyles(status)

    return (
        <span className={styles}>
            {showDot && (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            )}
            {label || status}
        </span>
    )
}
