'use client'

import { ArrowRight } from 'lucide-react'
import '@/styles/dashboard.css'

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
        <div className="companies-list-container" style={{ marginBottom: '2rem' }}>
            <div className="companies-list-header">
                <h2 className="companies-list-title">{title}</h2>
                {onAction && (
                    <button
                        onClick={onAction}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.5rem',
                            color: '#60a5fa',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
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
