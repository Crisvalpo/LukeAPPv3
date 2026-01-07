'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import type { MTOByIsometricWithStats, MTOItemSummary } from '@/services/material-consolidation'

interface Props {
    isoNumber: string
    spools: {
        spool_id: string
        spool_name: string
        spool_tag?: string
        items: MTOItemSummary[]
    }[]
    stats: {
        total_spools: number
        total_items: number
        total_quantity: number
    }
    selectedItems: MTOItemSummary[]
    onToggleItem: (item: MTOItemSummary) => void
    onToggleSpool: (items: MTOItemSummary[]) => void
}

export default function IsometricMTOCard({
    isoNumber,
    spools,
    stats,
    selectedItems,
    onToggleItem,
    onToggleSpool
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="iso-mto-card glass-panel">
            {/* Header */}
            <div
                className="iso-card-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="iso-info">
                    <Package size={20} className="iso-icon" />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 className="iso-number">{isoNumber}</h3>
                            {(() => {
                                // Calculate Status
                                let status = 'PENDING'
                                let statusColor = '#94a3b8' // gray
                                let statusLabel = 'Pendiente'

                                if (stats.total_quantity > 0) {
                                    // We need to sum up requested/received from items to know the iso status
                                    // Since 'stats' prop doesn't have requested/received totals, we iterate spools
                                    const totalRequested = spools.reduce((acc, spool) =>
                                        acc + spool.items.reduce((sAcc, item) => sAcc + item.quantity_requested, 0), 0)
                                    const totalReceived = spools.reduce((acc, spool) =>
                                        acc + spool.items.reduce((sAcc, item) => sAcc + item.quantity_received, 0), 0)

                                    if (totalReceived >= stats.total_quantity) {
                                        status = 'COMPLETE'
                                        statusColor = '#10b981' // green
                                        statusLabel = 'Completo'
                                    } else if (totalRequested >= stats.total_quantity) {
                                        status = 'ORDERED'
                                        statusColor = '#3b82f6' // blue
                                        statusLabel = 'Solicitado'
                                    } else if (totalRequested > 0) {
                                        status = 'PARTIAL'
                                        statusColor = '#f59e0b' // amber
                                        statusLabel = 'Parcial'
                                    }
                                }

                                return (
                                    <span style={{
                                        backgroundColor: `${statusColor}20`,
                                        color: statusColor,
                                        fontSize: '0.7rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        border: `1px solid ${statusColor}40`
                                    }}>
                                        {statusLabel}
                                    </span>
                                )
                            })()}
                        </div>
                        <div className="iso-stats">
                            <span>{stats.total_spools} Spools</span>
                            <span className="separator">•</span>
                            <span>{stats.total_items} Items</span>
                            <span className="separator">•</span>
                            <span className="quantity-badge">{stats.total_quantity} total</span>
                        </div>
                    </div>
                </div>

                <button className="expand-button">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="iso-card-content">
                    {spools.map(spool => (
                        <div key={spool.spool_id} className="spool-section">
                            <div className="spool-header">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={spool.items.every(i => selectedItems.find(s => s.id === i.id))}
                                        onChange={() => onToggleSpool(spool.items)}
                                    />
                                    <span className="spool-name">
                                        {spool.spool_name}
                                        {spool.spool_tag && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '0.85em',
                                                color: '#d8b4fe', // Purple text (matching engineering view)
                                                fontFamily: 'monospace',
                                                backgroundColor: 'rgba(126, 34, 206, 0.15)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(126, 34, 206, 0.3)'
                                            }}>
                                                {spool.spool_tag}
                                            </span>
                                        )}
                                    </span>
                                </label>
                                <span className="spool-item-count">{spool.items.length} items</span>
                            </div>

                            <div className="items-table-wrapper">
                                <table className="items-table">
                                    <thead>
                                        <tr className="header-row-1">
                                            <th rowSpan={2} style={{ width: '30px' }}></th>
                                            <th rowSpan={2} style={{ minWidth: '180px' }}>Item Code</th>
                                            <th rowSpan={2} style={{ minWidth: '150px' }}>Descripción</th>
                                            <th colSpan={4} className="grouped-header">INPUTS</th>
                                            <th rowSpan={2} style={{ width: '80px', textAlign: 'right' }}>Req.</th>
                                            <th rowSpan={2} style={{ width: '80px', textAlign: 'right' }}>Sol.</th>
                                            <th rowSpan={2} style={{ width: '80px', textAlign: 'right' }}>Recep.</th>
                                        </tr>
                                        <tr className="header-row-2">
                                            <th className="input-header">1</th>
                                            <th className="input-header">2</th>
                                            <th className="input-header">3</th>
                                            <th className="input-header">4</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {spool.items.map(item => (
                                            <tr
                                                key={item.id}
                                                className={selectedItems.find(i => i.id === item.id) ? 'selected' : ''}
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selectedItems.find(i => i.id === item.id)}
                                                        onChange={() => onToggleItem(item)}
                                                    />
                                                </td>
                                                <td>
                                                    <span className="item-code">{item.item_code}</span>
                                                </td>
                                                <td>
                                                    <span className="item-desc" title={item.description}>
                                                        {item.description.length > 40
                                                            ? item.description.substring(0, 40) + '...'
                                                            : item.description}
                                                    </span>
                                                </td>
                                                <td className="text-center input-cell">{item.input1 || '-'}</td>
                                                <td className="text-center input-cell">{item.input2 || '-'}</td>
                                                <td className="text-center input-cell">{item.input3 || '-'}</td>
                                                <td className="text-center input-cell">{item.input4 || '-'}</td>
                                                <td className="text-right">
                                                    <span className="quantity-value">{item.quantity_required}</span>
                                                    {item.unit && <span className="quantity-unit">{item.unit}</span>}
                                                </td>
                                                <td className="text-right">
                                                    <span className="quantity-value requested">{item.quantity_requested}</span>
                                                </td>
                                                <td className="text-right">
                                                    <span className="quantity-value received">{item.quantity_received}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .iso-mto-card {
                    margin-bottom: 1rem;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .iso-mto-card:hover {
                    border-color: rgba(99, 102, 241, 0.5);
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
                }

                .iso-card-header {
                    padding: 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .iso-card-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .iso-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .iso-icon {
                    color: var(--color-primary);
                }

                .iso-number {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0 0 0.25rem 0;
                }

                .iso-stats {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--color-text-dim);
                }

                .separator {
                    color: rgba(255, 255, 255, 0.2);
                }

                .quantity-badge {
                    padding: 0.125rem 0.5rem;
                    background: rgba(99, 102, 241, 0.2);
                    border-radius: 12px;
                    color: #a5b4fc;
                    font-weight: 500;
                }

                .expand-button {
                    background: none;
                    border: none;
                    color: var(--color-text-dim);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }

                .expand-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .iso-card-content {
                    padding: 0 1.25rem 1.25rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.2);
                }

                .spool-section {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .spool-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    color: #93c5fd;
                    font-weight: 600;
                }

                .checkbox-label input[type="checkbox"] {
                    cursor: pointer;
                }

                .spool-name {
                    font-size: 0.95rem;
                }

                .spool-item-count {
                    font-size: 0.8rem;
                    color: var(--color-text-dim);
                }

                .items-table-wrapper {
                    overflow-x: auto;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                .items-table thead th {
                    text-align: left;
                    padding: 0.5rem;
                    color: #94a3b8;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .header-row-1 .grouped-header {
                    text-align: center;
                    background: rgba(99, 102, 241, 0.1);
                    border-left: 1px solid rgba(99, 102, 241, 0.3);
                    border-right: 1px solid rgba(99, 102, 241, 0.3);
                    color: #a5b4fc;
                }

                .header-row-2 .input-header {
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #a5b4fc;
                    background: rgba(99, 102, 241, 0.05);
                    padding: 0.375rem 0.25rem;
                    width: 60px;
                }

                .items-table tbody td {
                    padding: 0.625rem 0.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    vertical-align: middle;
                }

                .items-table tbody tr {
                    transition: background 0.2s;
                }

                .items-table tbody tr:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .items-table tbody tr.selected {
                    background: rgba(59, 130, 246, 0.15);
                }

                .items-table input[type="checkbox"] {
                    cursor: pointer;
                }

                .item-code {
                    font-family: 'Courier New', monospace;
                    font-size: 0.85rem;
                    color: #a5b4fc;
                    font-weight: 600;
                }

                .item-desc {
                    font-size: 0.85rem;
                    color: #e2e8f0;
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .input-cell {
                    font-size: 0.8rem;
                    color: #cbd5e1;
                    background: rgba(255, 255, 255, 0.02);
                    font-family: 'Courier New', monospace;
                }

                .text-center {
                    text-align: center;
                }

                .text-right {
                    text-align: right;
                }

                .quantity-value {
                    font-family: 'Courier New', monospace;
                    color: #e2e8f0;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .quantity-value.requested {
                    color: #fbbf24;
                }

                .quantity-value.received {
                    color: #34d399;
                }

                .quantity-unit {
                    margin-left: 0.25rem;
                    font-size: 0.7rem;
                    color: var(--color-text-dim);
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    )
}
