'use client'

import { ArrowRight } from 'lucide-react'
// Styles migrated to Tailwind v4

interface DashboardWidgetProps {
    title: string
    actionLabel?: string
    onAction?: () => void
    children: React.ReactNode
    emptyMessage?: string
    isEmpty?: boolean
}

export default function DashboardWidget({
    title,
    actionLabel = 'Ver todos',
    onAction,
    children,
    emptyMessage = 'No hay datos disponibles',
    isEmpty = false
}: DashboardWidgetProps) {

    return (
        <div className="glass-panel overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-glass-border bg-white/5">
                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <div className="w-1 h-5 bg-brand-primary rounded-full" />
                    {title}
                </h2>
                {onAction && (
                    <button
                        onClick={onAction}
                        className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors group"
                    >
                        {actionLabel}
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                {isEmpty ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <p className="text-sm text-text-dim italic">{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="min-w-[600px] md:min-w-0">
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}
