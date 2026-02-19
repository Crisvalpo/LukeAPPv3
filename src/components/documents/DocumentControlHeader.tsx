'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileText, Send, ChevronRight, RefreshCw, Plus, ArrowDownCircle } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'

interface DocumentControlHeaderProps {
    title?: string
    subtitle?: string
    onRefresh?: () => void
    isLoading?: boolean
    primaryAction?: {
        label: string
        icon: React.ReactNode
        onClick: () => void
    }
    secondaryAction?: {
        label: string
        icon: React.ReactNode
        onClick: () => void
    }
}

export default function DocumentControlHeader({
    title,
    subtitle,
    onRefresh,
    isLoading,
    primaryAction,
    secondaryAction
}: DocumentControlHeaderProps) {
    const pathname = usePathname()

    const tabs = [
        {
            label: 'Listado Maestro',
            href: '/admin/documents',
            icon: <FileText size={16} />,
            active: pathname === '/admin/documents'
        },
        {
            label: 'Transmittals',
            href: '/admin/documents/transmittals',
            icon: <Send size={16} />,
            active: pathname.startsWith('/admin/documents/transmittals')
        }
    ]

    return (
        <div className="space-y-6 mb-6">
            {/* Top Bar: Title & Global Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1 uppercase tracking-widest font-bold">
                        <span>Control Documental</span>
                        {pathname !== '/admin/documents' && (
                            <>
                                <ChevronRight size={12} />
                                <span className="text-slate-400">
                                    {pathname.includes('transmittals') ? 'Transmittals' : ''}
                                </span>
                            </>
                        )}
                    </div>
                    <Heading level={1} className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {title || 'Control Documental'}
                    </Heading>
                    {subtitle && <Text className="text-slate-400 text-sm mt-1">{subtitle}</Text>}
                </div>

                <div className="flex items-center gap-3">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all active:scale-95"
                            title="Actualizar datos"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    )}

                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl font-medium text-sm transition-all active:scale-95"
                        >
                            {secondaryAction.icon}
                            {secondaryAction.label}
                        </button>
                    )}

                    {primaryAction && (
                        <button
                            onClick={primaryAction.onClick}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            {primaryAction.icon}
                            {primaryAction.label}
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/50 border border-white/5 rounded-2xl w-fit backdrop-blur-md">
                {tabs.map((tab) => (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className={`
                            flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200
                            ${tab.active
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </Link>
                ))}
            </div>
        </div>
    )
}
