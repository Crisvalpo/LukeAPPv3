'use client'

import React from 'react'
import { Plus, Eye, Pencil, Trash2, HelpCircle, FileX } from 'lucide-react'
import '@/styles/views/list-view.css'
import '@/styles/tables.css'
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
        <div className="view-container">
            {/* Header - Optional */}
            {!hideHeader && (
                <div className="view-header">
                    <div className="view-header-content">
                        <div className="view-title-wrapper">
                            <Icon size={32} className="view-icon" />
                            <h1 className="view-title">{schema.label.plural}</h1>
                        </div>
                    </div>

                    {onCreate && (
                        <button onClick={onCreate} className="btn btn-primary">
                            <Plus size={18} />
                            Nueva {schema.label.singular}
                        </button>
                    )}
                </div>
            )}

            {/* List */}
            {data.length === 0 ? (
                <div className="view-empty">
                    <FileX size={48} className="view-empty-icon" />
                    <p>No hay {schema.label.plural.toLowerCase()} registradas</p>
                    {onCreate && (
                        <button onClick={onCreate} className="btn btn-primary mt-4">
                            <Plus size={18} />
                            Crear primera {schema.label.singular}
                        </button>
                    )}
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}> {/* Modern Glass Wrapper */}
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {columns.map((colKey) => (
                                        <th key={String(colKey)}>
                                            {schema.fields[colKey as string]?.label || String(colKey)}
                                        </th>
                                    ))}
                                    {/* Action Header always present for consistency if needed, or check actions length */}
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => (
                                    <tr
                                        key={item.id || idx}
                                        onClick={() => {
                                            if (!schema.views.list.actions || schema.views.list.actions.length === 0) {
                                                onAction && onAction('view', item)
                                            }
                                        }}
                                        style={{
                                            cursor: (!schema.views.list.actions || schema.views.list.actions.length === 0) ? 'pointer' : 'default'
                                        }}
                                    >
                                        {columns.map((colKey) => (
                                            <td key={String(colKey)}>
                                                {renderCell(item, colKey as string, schema.fields[colKey as string])}
                                            </td>
                                        ))}

                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {/* Schema Actions + Custom Actions */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                {schema.views.list.actions?.map(action => (
                                                    <button
                                                        key={action}
                                                        className="action-link"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onAction && onAction(action, item)
                                                        }}
                                                        title={action}
                                                    >
                                                        {action === 'view' ? <Eye size={18} /> :
                                                            action === 'edit' ? <Pencil size={18} /> :
                                                                action === 'delete' ? <Trash2 size={18} className="text-destructive" /> : <HelpCircle size={18} />}
                                                    </button>
                                                ))}
                                                {customActions?.map(action => {
                                                    const ActionIcon = action.icon
                                                    return (
                                                        <button
                                                            key={action.id}
                                                            className="action-link"
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

    if (!value) return <span style={{ opacity: 0.5 }}>-</span>

    switch (fieldDef?.type) {
        case 'date':
            return new Date(value).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        case 'status':
            // Use the standard StatusBadge component
            // Map common statuses if needed, or pass directly
            return <StatusBadge status={value} />
        default:
            return value
    }
}
