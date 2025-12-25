'use client'

import React from 'react'
import { MoreHorizontal, Search, Filter } from 'lucide-react'

// Generic definition for a column
export interface Column<T> {
    key: string
    header: string
    render?: (item: T) => React.ReactNode
    width?: string
}

interface DataGridProps<T> {
    data: T[]
    columns: Column<T>[]
    keyField: keyof T
    onRowClick?: (item: T) => void
    loading?: boolean
    emptyMessage?: string
    actions?: (item: T) => React.ReactNode
}

export function DataGrid<T extends Record<string, any>>({
    data,
    columns,
    keyField,
    onRowClick,
    loading = false,
    emptyMessage = 'No items found.',
    actions
}: DataGridProps<T>) {

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Loading data...</div>
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center border border-white/5 rounded-xl bg-white/5 border-dashed">
                <p className="text-slate-400">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden border border-white/10 rounded-xl bg-[#1e293b]/30">
            <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 font-medium uppercase tracking-wider text-xs border-b border-white/10">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-6 py-4" style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="px-6 py-4 w-16"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((item) => (
                        <tr
                            key={String(item[keyField])}
                            className={`hover:bg-white/5 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onRowClick && onRowClick(item)}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className="px-6 py-4 text-slate-300">
                                    {col.render ? col.render(item) : item[col.key]}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-6 py-4 text-right">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                        {actions(item)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// Helper: Common Header with Search (Can be moved to a separate component ContextHeader)
export function ListViewHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-[#0f172a] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64 placeholder:text-slate-600"
                    />
                </div>
                {action}
            </div>
        </div>
    )
}
