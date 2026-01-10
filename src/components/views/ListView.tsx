'use client'

import React from 'react'
import { Plus, Eye, Pencil, Trash2, HelpCircle, FileX } from 'lucide-react'
import '@/styles/views/list-view.css'
import { ViewSchema } from '@/schemas/company' // We can move interface to a shared type file later

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
}

export function ListView<T extends Record<string, any>>({
    schema,
    data,
    isLoading,
    onCreate,
    onAction,
    customActions
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
            {/* Header */}
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

            {/* List */}
            {data.length === 0 ? (
                <div className="view-empty">
                    <FileX size={48} className="view-empty-icon" />
                    <p>No hay {schema.label.plural.toLowerCase()} registradas</p>
                </div>
            ) : (
                <div className="view-table-container">
                    <table className="view-table">
                        <thead>
                            <tr>
                                {columns.map((colKey) => (
                                    <th key={String(colKey)}>
                                        {schema.fields[colKey as string]?.label || String(colKey)}
                                    </th>
                                ))}
                                {schema.views.list.actions && schema.views.list.actions.length > 0 && (
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr
                                    key={item.id || idx}
                                    onClick={() => {
                                        // If no actions defined or actions is empty, make row clickable with 'view'
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

                                    {(schema.views.list.actions && schema.views.list.actions.length > 0) || (customActions && customActions.length > 0) ? (
                                        <td style={{ textAlign: 'right' }}>
                                            {/* Schema-defined actions */}
                                            {schema.views.list.actions?.map(action => (
                                                <button
                                                    key={action}
                                                    className="action-link"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onAction && onAction(action, item)
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        marginLeft: '0.5rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        color: '#94a3b8'
                                                    }}
                                                    title={action}
                                                >
                                                    {action === 'view' ? <Eye size={18} /> :
                                                        action === 'edit' ? <Pencil size={18} /> :
                                                            action === 'delete' ? <Trash2 size={18} color="#ef4444" /> : <HelpCircle size={18} />}
                                                </button>
                                            ))}
                                            {/* Custom actions */}
                                            {customActions?.map(action => {
                                                const Icon = action.icon
                                                return (
                                                    <button
                                                        key={action.id}
                                                        className="action-link"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onAction && onAction(action.id, item)
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            marginLeft: '0.5rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            color: action.color || '#94a3b8'
                                                        }}
                                                        title={action.label}
                                                    >
                                                        <Icon size={18} />
                                                    </button>
                                                )
                                            })}
                                        </td>
                                    ) : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
            return (
                <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: 'rgba(148, 163, 184, 0.1)',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    fontStyle: 'italic'
                }}>
                    Sin configurar
                </span>
            )
        }
        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
                {value}
            </span>
        )
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
            const statusColors: Record<string, string> = {
                active: '#4ade80',
                planning: '#94a3b8',
                on_hold: '#fb923c',
                completed: '#60a5fa',
                cancelled: '#f87171'
            }
            const label = value // Simplified. ideally mapped or capitalized
            return (
                <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: `${statusColors[value] || '#94a3b8'}20`,
                    color: statusColors[value] || '#94a3b8',
                    border: `1px solid ${statusColors[value] || '#94a3b8'}40`,
                    textTransform: 'capitalize'
                }}>
                    {label.replace('_', ' ')}
                </span>
            )
        default:
            return value
    }
}
