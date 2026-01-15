'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import '@/styles/dashboard.css'
import '@/styles/staff-dashboard.css'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    color: string // hex code or 'blue', 'purple', 'green', 'orange'
    onClick?: () => void
    buttonText?: string
    disabled?: boolean
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    color,
    onClick,
    buttonText = 'Ver detalles',
    disabled = false
}: StatCardProps) {

    // Map standard colors to RGBA/Hex for consistent design system
    const colorMap: Record<string, { bg: string, border: string, iconBg: string, text: string }> = {
        blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', iconBg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa' },
        purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', iconBg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa' },
        green: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', iconBg: 'rgba(34, 197, 94, 0.1)', text: '#4ade80' },
        orange: { bg: 'rgba(251, 146, 60, 0.1)', border: 'rgba(251, 146, 60, 0.3)', iconBg: 'rgba(251, 146, 60, 0.1)', text: '#fb923c' },
        red: { bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.3)', iconBg: 'rgba(248, 113, 113, 0.1)', text: '#f87171' },
    }

    const theme = colorMap[color] || colorMap['blue']

    return (
        <div className="company-form-container stat-card">
            <div className="stat-card__header">
                <div className="stat-card__content">
                    <div className="stat-card__title">
                        {title}
                    </div>
                    <div className="stat-card__value">
                        {value}
                    </div>
                </div>
                <div className={`stat-card__icon stat-card__icon--${color}`}>
                    <Icon size={24} color={theme.text} />
                </div>
            </div>

            {onClick && (
                <Button
                    onClick={!disabled ? onClick : undefined}
                    disabled={disabled}
                    variant="ghost"
                    size="sm"
                    className={`stat-card__button stat-card__button--${color}`}
                >
                    {disabled ? 'Próximamente' : buttonText}
                </Button>
            )}
        </div>
    )
}
