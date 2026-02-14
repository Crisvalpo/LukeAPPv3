'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Styles migrated to Tailwind v4

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

    // Map standard colors to Tailwind classes
    const colorClasses: Record<string, { bg: string, border: string, text: string, iconBg: string }> = {
        blue: { bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', text: 'text-brand-primary', iconBg: 'bg-brand-primary/10' },
        purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', iconBg: 'bg-purple-500/10' },
        green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', iconBg: 'bg-green-500/10' },
        orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', iconBg: 'bg-orange-500/10' },
        red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', iconBg: 'bg-red-500/10' },
    }

    const theme = colorClasses[color] || colorClasses['blue']

    return (
        <div className={`glass-panel p-6 flex flex-col gap-4 group transition-all hover:bg-white/5 ${theme.border}`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                        {title}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-text-main">
                        {value}
                    </p>
                </div>
                <div className={`p-3 rounded-xl ${theme.iconBg} ${theme.text}`}>
                    <Icon size={24} />
                </div>
            </div>

            {onClick && (
                <Button
                    onClick={!disabled ? onClick : undefined}
                    disabled={disabled}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-between hover:${theme.bg} ${theme.text} border border-transparent hover:${theme.border}`}
                >
                    {disabled ? 'Próximamente' : buttonText}
                    <Icon size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            )}
        </div>
    )
}
