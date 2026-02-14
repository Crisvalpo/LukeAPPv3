import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
    const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold leading-none uppercase tracking-wider border border-transparent transition-all duration-200"

    const variants = {
        default: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        secondary: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        destructive: "bg-red-500/10 text-red-400 border-red-500/20",
        outline: "bg-transparent text-white border-white/10",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    }

    return (
        <span
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        />
    )
}
