'use client'

import React from 'react'
import { Plus, Eye, Pencil, Trash2, HelpCircle, FileX } from 'lucide-react'
// Styles migrated to Tailwind v4
import { ViewSchema } from '@/schemas/company' // We can move interface to a shared type file later

import { StatusBadge } from '@/components/ui/StatusBadge'

interface ListViewProps<T> {
    schema: ViewSchema<T>
    data: T[]
    isLoading?: boolean
    onCreate?: () => void
    onAction?: (action: string, item: T) => void
    customActions?: Array<{
        id: string
        label: string
        icon: any
        color?: string
    }>
    hideHeader?: boolean
}

export function ListView<T extends Record<string, any>>({
    schema,
    data,
    isLoading,
    onCreate,
    onAction,
    customActions,
    hideHeader = false
}: ListViewProps<T>) {

    // Derived Values
    const columns = schema.views.list.columns
    const Icon = schema.icon

    if (isLoading) {
        return (
            <div className="view-container">
                <div className="view-loading">
                    <p>Cargando {schema.label.plural}...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            {/* Header - Optional */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                            <Icon size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{schema.label.plural}</h1>
                    </div>

                    {onCreate && (
                        <button
                            onClick={onCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95 shrink-0"
                        >
                            <Plus size={18} />
                            <span>Nueva {schema.label.singular}</span>
                        </button>
                    )}
                </div>
            )}

            {/* List */}
            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-slate-500">
                    <div className="p-4 bg-white/[0.03] rounded-full mb-4">
                        <FileX size={48} className="opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-slate-400">No hay {schema.label.plural.toLowerCase()} registradas</p>
                    {onCreate && (
                        <button
                            onClick={onCreate}
                            className="mt-6 flex items-center gap-2 px-6 py-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                            <Plus size={18} />
                            Crear primera {schema.label.singular}
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-[#1e293b]/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    {columns.map((colKey) => (
                                        <th
                                            key={String(colKey)}
                                            className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500"
                                        >
                                            {schema.fields[colKey as string]?.label || String(colKey)}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {data.map((item, idx) => (
                                    <tr
                                        key={item.id || idx}
                                        onClick={() => {
                                            if (!schema.views.list.actions || schema.views.list.actions.length === 0) {
                                                onAction && onAction('view', item)
                                            }
                                        }}
                                        className={`
                                            group transition-all duration-150 hover:bg-white/[0.02]
                                            ${(!schema.views.list.actions || schema.views.list.actions.length === 0) ? 'cursor-pointer' : ''}
                                        `}
                                    >
                                        {columns.map((colKey) => (
                                            <td key={String(colKey)} className="px-6 py-4 text-sm text-slate-300">
                                                {renderCell(item, colKey as string, schema.fields[colKey as string])}
                                            </td>
                                        ))}

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {schema.views.list.actions?.map(action => (
                                                    <button
                                                        key={action}
                                                        className={`
                                                            p-2 rounded-md transition-all
                                                            ${action === 'delete' ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
                                                        `}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onAction && onAction(action, item)
                                                        }}
                                                        title={action}
                                                    >
                                                        {action === 'view' ? <Eye size={18} /> :
                                                            action === 'edit' ? <Pencil size={18} /> :
                                                                action === 'delete' ? <Trash2 size={18} /> : <HelpCircle size={18} />}
                                                    </button>
                                                ))}
                                                {customActions?.map(action => {
                                                    const ActionIcon = action.icon
                                                    return (
                                                        <button
                                                            key={action.id}
                                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-all"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onAction && onAction(action.id, item)
                                                            }}
                                                            style={{ color: action.color }}
                                                            title={action.label}
                                                        >
                                                            <ActionIcon size={18} />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function renderCell(item: any, key: string, fieldDef: any) {
    const value = item[key]

    // Special handling for current_week field
    if (key === 'current_week') {
        if (!value) {
            return <StatusBadge status="inactive" label="Sin configurar" showDot={false} />
        }
        return <StatusBadge status="active" label={value} showDot={false} />
    }

    if (value === undefined || value === null || value === '') {
        return <span className="text-slate-600 italic">No asignado</span>
    }

    switch (fieldDef?.type) {
        case 'date':
            return (
                <span className="font-medium text-slate-400">
                    {new Date(value).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </span>
            )
        case 'status':
            return <StatusBadge status={value} />
        default:
            return <span className="font-semibold text-slate-200">{value}</span>
    }
}
