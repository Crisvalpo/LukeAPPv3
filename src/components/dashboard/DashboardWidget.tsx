'use client'

import { ArrowRight } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/staff-dashboard.css'

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
        <div className="companies-list-container dashboard-widget">
            <div className="companies-list-header">
                <h2 className="companies-list-title">{title}</h2>
                {onAction && (
                    <button
                        onClick={onAction}
                        className="dashboard-widget__action"
                    >
                        {actionLabel} <ArrowRight size={16} />
                    </button>
                )}
            </div>

            {isEmpty ? (
                <div className="companies-empty">
                    <p className="companies-empty-text">{emptyMessage}</p>
                </div>
            ) : (
                children
            )}
        </div>
    )
}
