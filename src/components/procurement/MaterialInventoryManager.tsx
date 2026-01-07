import { useState, useEffect } from 'react'
import { Search, Filter, Package, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MaterialInventoryManagerProps {
    projectId: string
    companyId: string
}

interface InventoryItem {
    id: string
    material_spec: string
    quantity_available: number
    quantity_allocated: number
    location: string
    description?: string // from catalog
    category?: string // from catalog
}

export default function MaterialInventoryManager({ projectId, companyId }: MaterialInventoryManagerProps) {
    const supabase = createClient()
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (projectId) {
            loadInventory()
        }
    }, [projectId])

    async function loadInventory() {
        setIsLoading(true)
        try {
            // 1. Fetch Inventory Only
            const { data: invData, error: invError } = await supabase
                .from('material_inventory')
                .select('*')
                .eq('project_id', projectId)
                .order('material_spec', { ascending: true })

            if (invError) throw invError

            const items = (invData || []) as InventoryItem[]

            // 2. Fetch Descriptions separately to avoid huge joins if catalog is large
            // or if we want to be safe with unknown specs.
            const specs = Array.from(new Set(items.map(i => i.material_spec)))

            if (specs.length > 0) {
                const { data: catData } = await supabase
                    .from('material_catalog')
                    .select('ident_code, short_desc, material_cat_name')
                    .in('ident_code', specs)

                const descMap = new Map()
                const catMap = new Map()

                catData?.forEach(c => {
                    descMap.set(c.ident_code, c.short_desc)
                    catMap.set(c.ident_code, c.material_cat_name)
                })

                // Merge
                items.forEach(item => {
                    item.description = descMap.get(item.material_spec) || 'Sin descripción'
                    item.category = catMap.get(item.material_spec) || 'General'
                })
            }

            setInventory(items)

        } catch (error: any) {
            console.error('Error loading inventory:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredInventory = inventory.filter(item =>
        item.material_spec.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="inventory-manager">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por código o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-label">Total Ítems</span>
                        <span className="stat-value">{inventory.length}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="loading-state">Cargando inventario...</div>
            ) : inventory.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3 className="empty-title">Inventario Vacío</h3>
                    <p className="empty-text">Aún no hay materiales en inventario para este proyecto.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Código / Descripción</th>
                                <th>Categoría</th>
                                <th>Ubicación</th>
                                <th className="text-right">Disponible</th>
                                <th className="text-right">Asignado</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-500">
                                        No se encontraron resultados para "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="item-code">{item.material_spec}</div>
                                            <div className="item-desc">{item.description}</div>
                                        </td>
                                        <td>
                                            <span className="category-badge">
                                                {item.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="font-mono text-sm text-gray-400">
                                            {item.location || 'N/A'}
                                        </td>
                                        <td className="text-right font-mono font-bold text-success">
                                            {item.quantity_available}
                                        </td>
                                        <td className="text-right font-mono text-warning">
                                            {item.quantity_allocated}
                                        </td>
                                        <td className="text-right font-mono text-white">
                                            {item.quantity_available + item.quantity_allocated}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                .inventory-manager {
                    animation: fadeIn 0.4s ease-out;
                }

                /* Toolbar */
                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    background: rgba(255, 255, 255, 0.02);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 0.5rem 1rem;
                    width: 350px;
                    transition: border-color 0.2s;
                }
                .search-bar:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                .search-icon { color: #9ca3af; margin-right: 0.75rem; }
                .search-bar input {
                    background: transparent;
                    border: none;
                    color: white;
                    width: 100%;
                    outline: none;
                    font-size: 0.9rem;
                }

                .stats-summary {
                    display: flex;
                    gap: 1.5rem;
                }
                .stat-item {
                    display: flex; flex-direction: column; align-items: flex-end;
                }
                .stat-label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; font-weight: 700; }
                .stat-value { font-size: 1.25rem; font-weight: 700; color: white; font-family: 'JetBrains Mono', monospace; }

                /* Table */
                .table-container {
                    background: rgba(24, 25, 28, 0.6);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .data-table th {
                    text-align: left; padding: 1rem 1.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .data-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                    vertical-align: middle;
                    color: #e5e7eb;
                }
                .data-table tr:hover td { background: rgba(255, 255, 255, 0.04); }

                /* Cell & Text Utilities */
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .text-success { color: #4ade80; }
                .text-warning { color: #fbbf24; }
                .text-white { color: white; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
                
                .item-code {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 700;
                    color: white;
                    font-size: 0.9rem;
                }
                .item-desc {
                    font-size: 0.8rem;
                    color: #9ca3af;
                    margin-top: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 300px;
                }

                .category-badge {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.25rem 0.75rem;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                /* States */
                .loading-state { padding: 4rem; text-align: center; color: #6b7280; }
                .empty-state {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 4rem; text-align: center;
                    background: rgba(24, 25, 28, 0.6); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
                .empty-title { font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
                .empty-text { color: #9ca3af; max-width: 400px; }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )
}
