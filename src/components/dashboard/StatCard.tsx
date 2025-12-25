'use client'

import { LucideIcon } from 'lucide-react'
import '@/styles/dashboard.css'

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
        <div className="company-form-container" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: theme.iconBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon size={24} color={theme.text} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', lineHeight: 1 }}>
                        {value}
                    </div>
                </div>
            </div>

            {onClick && (
                <button
                    onClick={!disabled ? onClick : undefined}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: disabled ? `${theme.bg.replace('0.1', '0.05')}` : theme.bg,
                        border: `1px solid ${disabled ? theme.border.replace('0.3', '0.1') : theme.border}`,
                        borderRadius: '0.5rem',
                        color: disabled ? '#64748b' : theme.text,
                        fontSize: '0.875rem',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                    }}
                >
                    {disabled ? 'Próximamente' : buttonText}
                </button>
            )}
        </div>
    )
}
