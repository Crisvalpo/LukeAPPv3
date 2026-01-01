'use client'

import { useState, useEffect, useRef } from 'react'
import {
    getMaterialCatalog,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    parseMaterialCatalogFromArray,
    bulkUploadMaterials,
    exportCatalogToExcel,
    getCatalogRawFilterData,
    getCatalogFilterOptions, // Keep for fallback if needed, or remove if fully replaced. Component uses it in error case? No, effectively replacing logic.
    deleteAllMaterials,
    type MaterialCatalogItem,
    type CreateMaterialParams
} from '@/services/material-catalog'
import { useMemo } from 'react'
import * as XLSX from 'xlsx'
import { createPortal } from 'react-dom'
import { Search, Plus, Upload, Download, Settings, Trash2, Edit2, X, AlertCircle, FileSpreadsheet } from 'lucide-react'

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface Props {
    projectId: string
    companyId: string
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function MaterialCatalogManager({ projectId, companyId }: Props) {
    // State
    const [items, setItems] = useState<MaterialCatalogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Pagination & Filters State
    const [page, setPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [filters, setFilters] = useState({
        partGroup: '',
        specCode: '',
        input1: '',
        input2: '',
        input3: '',
        input4: ''
    })

    const [showFilters, setShowFilters] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const ITEMS_PER_PAGE = 50

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MaterialCatalogItem | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [progress, setProgress] = useState<{ current: number, total: number } | null>(null)

    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadStats, setUploadStats] = useState<{ inserted: number, updated: number, skipped: number, errors: string[] } | null>(null)

    // Raw data for compounding intelligent filters
    const [rawFilterData, setRawFilterData] = useState<Pick<MaterialCatalogItem, 'part_group' | 'spec_code' | 'custom_fields'>[]>([])

    // Computed Intelligent Filters using useMemo
    const filterOptions = useMemo(() => {
        const result = {
            partGroups: new Set<string>(),
            specCodes: new Set<string>(),
            input1: new Set<string>(),
            input2: new Set<string>(),
            input3: new Set<string>(),
            input4: new Set<string>()
        }

        // Helper to check if an item passes a specific subset of filters
        const passes = (item: any, currentKeyToCheck: string) => {
            if (currentKeyToCheck !== 'partGroup' && filters.partGroup && item.part_group !== filters.partGroup) return false
            if (currentKeyToCheck !== 'specCode' && filters.specCode && item.spec_code !== filters.specCode) return false
            const custom = item.custom_fields || {}
            if (currentKeyToCheck !== 'input1' && filters.input1 && custom['Input 1'] !== filters.input1) return false
            if (currentKeyToCheck !== 'input2' && filters.input2 && custom['Input 2'] !== filters.input2) return false
            if (currentKeyToCheck !== 'input3' && filters.input3 && custom['Input 3'] !== filters.input3) return false
            if (currentKeyToCheck !== 'input4' && filters.input4 && custom['Input 4'] !== filters.input4) return false
            return true
        }

        rawFilterData.forEach(item => {
            const custom = item.custom_fields || {} as any

            // For Part Group
            if (passes(item, 'partGroup')) {
                if (item.part_group) result.partGroups.add(item.part_group)
            }

            // For Spec Code
            if (passes(item, 'specCode')) {
                if (item.spec_code) result.specCodes.add(item.spec_code)
            }

            // For Input 1
            if (passes(item, 'input1')) {
                if (custom['Input 1']) result.input1.add(custom['Input 1'])
            }

            // For Input 2
            if (passes(item, 'input2')) {
                if (custom['Input 2']) result.input2.add(custom['Input 2'])
            }

            // For Input 3
            if (passes(item, 'input3')) {
                if (custom['Input 3']) result.input3.add(custom['Input 3'])
            }

            // For Input 4
            if (passes(item, 'input4')) {
                if (custom['Input 4']) result.input4.add(custom['Input 4'])
            }
        })

        return {
            partGroups: Array.from(result.partGroups).sort(),
            specCodes: Array.from(result.specCodes).sort(),
            input1: Array.from(result.input1).sort(),
            input2: Array.from(result.input2).sort(),
            input3: Array.from(result.input3).sort(),
            input4: Array.from(result.input4).sort(),
        }

    }, [rawFilterData, filters])

    // Initial Load
    useEffect(() => {
        loadCatalog()
        // We only need to load raw filter data ONCE or when upload happens
        if (rawFilterData.length === 0) loadFilterOptions()
    }, [projectId, page, searchTerm, filters]) // Re-fetch catalog on params

    // Debounce search effect could be added here for better UX, but relying on enter or blur is also fine for now

    async function loadCatalog() {
        setLoading(true)
        try {
            const inputFilters: Record<string, string> = {}
            if (filters.input1) inputFilters['Input 1'] = filters.input1
            if (filters.input2) inputFilters['Input 2'] = filters.input2
            if (filters.input3) inputFilters['Input 3'] = filters.input3
            if (filters.input4) inputFilters['Input 4'] = filters.input4

            const { data, count } = await getMaterialCatalog(projectId, {
                page,
                limit: ITEMS_PER_PAGE,
                search: searchTerm,
                partGroup: filters.partGroup || undefined,
                specCode: filters.specCode || undefined,
                inputFilters: Object.keys(inputFilters).length > 0 ? inputFilters : undefined
            })
            setItems(data)
            setTotalItems(count)
        } catch (error) {
            console.error('Error loading catalog:', error)
            alert('Error cargando catálogo')
        } finally {
            setLoading(false)
        }
    }

    async function loadFilterOptions() {
        try {
            const data = await getCatalogRawFilterData(projectId)
            setRawFilterData(data)
        } catch (error) {
            console.error('Error loading filter options:', error)
        }
    }

    // Handlers
    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este material?')) return
        try {
            await deleteMaterial(id)
            loadCatalog() // Refresh current page
        } catch (error) {
            alert('Error eliminando material')
        }
    }

    async function handleClearCatalog() {
        if (!confirm('⚠️ PELIGRO: ¿Estás seguro de VACIAR todo el catálogo?\n\nEsta acción eliminará TODOS los materiales de este proyecto. No se puede deshacer.')) return

        if (!confirm('Confirmación final: ¿Realmente deseas eliminar todos los registros?')) return

        setLoading(true)
        try {
            await deleteAllMaterials(projectId)
            alert('Catálogo vaciado correctamente')
            loadCatalog()
            setFilters({ ...filters, partGroup: '', specCode: '', input1: '', input2: '', input3: '', input4: '' })
            loadFilterOptions()
        } catch (error) {
            console.error(error)
            alert('Error vaciando el catálogo')
        } finally {
            setLoading(false)
        }
    }

    function handleExport() {
        exportCatalogToExcel(projectId)
    }

    function handleDownloadTemplate() {
        const headers = [
            'Ident', 'Ident code', 'Unit Weight', 'Input 1', 'Input 2', 'Input 3', 'Input 4',
            'Commodity Code', 'Spec Code', 'Short Desc', 'Short Code', 'Sap Mat Grp',
            'Commodity Group', 'Part Group'
        ]
        // Add an example row
        const exampleRow = [
            '123456', 'ALT-123', '10.5', 'X', 'Y', 'Z', 'W',
            'CC-100', 'SPE-01', 'Tubo 4" Sch 40 Carbon Steel', 'T4S40', 'MAT-99',
            'Piping', 'Pipes'
        ]

        const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Carga')
        XLSX.writeFile(wb, 'plantilla_catalogo.xlsx')
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                const parsedItems = parseMaterialCatalogFromArray(data)

                if (parsedItems.length === 0) {
                    alert('No se encontraron items válidos en el archivo')
                    return
                }

                if (confirm(`Se encontraron ${parsedItems.length} items.\n\n¿Proceder con la carga?`)) {
                    setIsImporting(true)
                    setUploadStats(null)

                    try {
                        const result = await bulkUploadMaterials(
                            projectId,
                            companyId,
                            parsedItems,
                            (current, total) => {
                                setProgress({ current, total })
                            }
                        )
                        setUploadStats(result)
                        loadFilterOptions() // Refresh filters after upload
                    } catch (error) {
                        console.error(error)
                        alert('Hubo un error interrumpido durante la carga')
                    } finally {
                        setIsImporting(false)
                        setProgress(null)
                        loadCatalog() // Refresh after upload
                    }
                }
            } catch (error) {
                console.error('Error importing:', error)
                alert('Error procesando archivo Excel')
                setIsImporting(false)
            }
        }
        reader.readAsBinaryString(file)

        // Reset input
        e.target.value = ''
    }

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    return (
        <div className="material-catalog-container fade-in">
            {/* Header / Toolbar */}
            <div className="catalog-toolbar">
                {/* Left: Search */}
                <div className="search-section">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por Ident, Descripción..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPage(1)
                            }}
                            className="search-input"
                        />
                    </div>
                    <button
                        className={`filter-toggle ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Filtros
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="actions-wrapper">


                    {/* Settings Menu (includes dangerous Vaciar) */}
                    <div className="settings-menu">
                        <button
                            className="btn-secondary settings-btn"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Configuración"
                        >
                            <Settings size={16} />
                        </button>
                        {showSettings && (
                            <div className="settings-dropdown">
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowSettings(false)
                                        setEditingItem(null)
                                        setIsModalOpen(true)
                                    }}
                                >
                                    <Plus size={14} /> Nuevo Item
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowSettings(false)
                                        handleDownloadTemplate()
                                    }}
                                >
                                    <FileSpreadsheet size={14} /> Descargar Plantilla
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowSettings(false)
                                        fileInputRef.current?.click()
                                    }}
                                >
                                    <Upload size={14} /> Importar (Excel)
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowSettings(false)
                                        handleExport()
                                    }}
                                >
                                    <Download size={14} /> Exportar (Excel)
                                </button>
                                <div className="dropdown-divider" />
                                <button
                                    className="dropdown-item danger"
                                    onClick={() => {
                                        setShowSettings(false)
                                        handleClearCatalog()
                                    }}
                                >
                                    <Trash2 size={14} /> Vaciar Catálogo
                                </button>
                            </div>
                        )}
                        {/* Hidden File Input for Import */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="filters-panel animate-slide-down">
                    <div className="filter-group">
                        <label>Spec Code</label>
                        <select
                            value={filters.specCode}
                            onChange={e => { setFilters({ ...filters, specCode: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos</option>
                            {filterOptions.specCodes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Part Group</label>
                        <select
                            value={filters.partGroup}
                            onChange={e => { setFilters({ ...filters, partGroup: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos</option>
                            {filterOptions.partGroups.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Input 1</label>
                        <select
                            value={filters.input1}
                            onChange={e => { setFilters({ ...filters, input1: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos</option>
                            {filterOptions.input1.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Input 2</label>
                        <select
                            value={filters.input2}
                            onChange={e => { setFilters({ ...filters, input2: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos</option>
                            {filterOptions.input2.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Input 3</label>
                        <select
                            value={filters.input3}
                            onChange={e => { setFilters({ ...filters, input3: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos</option>
                            {filterOptions.input3.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Input 4</label>
                        <select
                            value={filters.input4}
                            onChange={e => { setFilters({ ...filters, input4: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos</option>
                            {filterOptions.input4.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Upload Stats Banner */}
            {uploadStats && (
                <div className="upload-stats-banner animate-slide-in">
                    <div className="stats-header">
                        <span className="success-icon">✅</span>
                        <span>Carga Completada:</span>
                        <strong className="text-green">{uploadStats.inserted} Insertados</strong>
                        <span className="divider">•</span>
                        <strong className="text-yellow">{uploadStats.skipped} Omitidos (Existentes)</strong>
                        <button className="close-stats" onClick={() => setUploadStats(null)}><X size={14} /></button>
                    </div>
                    {uploadStats.errors.length > 0 && (
                        <div className="stats-errors">
                            <strong>Errores ({uploadStats.errors.length}):</strong>
                            <div className="error-list">
                                {uploadStats.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                                {uploadStats.errors.length > 5 && <div>...y {uploadStats.errors.length - 5} más</div>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Data Table */}
            <div className="catalog-table-wrapper">
                {loading ? (
                    <div className="loading-state">Cargando catálogo...</div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>No hay materiales encontrados</h3>
                        <p>{searchTerm || showFilters ? 'Intenta ajustar los filtros' : 'Comienza importando una lista maestra o agregando items manualmente'}</p>
                    </div>
                ) : (
                    <table className="catalog-table">
                        <thead>
                            <tr style={{ height: '45px' }}>
                                <th rowSpan={2} style={{ width: '110px', verticalAlign: 'middle', top: 0, zIndex: 20, padding: 0, background: '#0f172a', borderBottom: '2px solid #334155' }}><div style={{ padding: '0 12px' }}>IDENT CODE</div></th>
                                <th colSpan={4} style={{ textAlign: 'center', borderBottom: '1px solid #334155', padding: 0, height: '45px', top: 0, zIndex: 20, background: '#0f172a' }}>INPUTS</th>
                                <th rowSpan={2} style={{ width: '70px', verticalAlign: 'middle', top: 0, zIndex: 20, padding: 0, background: '#0f172a', borderBottom: '2px solid #334155' }}><div style={{ padding: '0 12px' }}>SPEC</div></th>
                                <th rowSpan={2} style={{ verticalAlign: 'middle', top: 0, zIndex: 20, padding: 0, background: '#0f172a', borderBottom: '2px solid #334155' }}><div style={{ padding: '0 12px' }}>DESCRIPCIÓN CORTA</div></th>
                                <th rowSpan={2} style={{ width: '80px', verticalAlign: 'middle', top: 0, zIndex: 20, padding: 0, background: '#0f172a', borderBottom: '2px solid #334155' }}><div style={{ padding: '0 12px' }}>ACCIONES</div></th>
                            </tr>
                            <tr style={{ height: '30px' }}>
                                <th style={{ width: '70px', top: '45px', height: '30px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', background: '#0f172a', zIndex: 19, borderBottom: '2px solid #334155', padding: 0 }}>1</th>
                                <th style={{ width: '70px', top: '45px', height: '30px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', background: '#0f172a', zIndex: 19, borderBottom: '2px solid #334155', padding: 0 }}>2</th>
                                <th style={{ width: '70px', top: '45px', height: '30px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', background: '#0f172a', zIndex: 19, borderBottom: '2px solid #334155', padding: 0 }}>3</th>
                                <th style={{ width: '70px', top: '45px', height: '30px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--accent)', background: '#0f172a', zIndex: 19, borderBottom: '2px solid #334155', padding: 0 }}>4</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const custom = item.custom_fields as any || {}
                                return (
                                    <tr key={item.id}>
                                        <td className="font-mono">{item.ident_code}</td>
                                        <td className="text-center">{custom['Input 1'] || '-'}</td>
                                        <td className="text-center">{custom['Input 2'] || '-'}</td>
                                        <td className="text-center">{custom['Input 3'] || '-'}</td>
                                        <td className="text-center">{custom['Input 4'] || '-'}</td>
                                        <td>{item.spec_code || '-'}</td>
                                        <td>
                                            <div className="desc-text" title={item.short_desc}>{item.short_desc}</div>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="action-icon edit"
                                                onClick={() => { setEditingItem(item); setIsModalOpen(true) }}
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="action-icon delete"
                                                onClick={() => handleDelete(item.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Footer */}
            <div className="footer-info">
                <div className="pagination-controls">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="page-btn"
                    >
                        Anterior
                    </button>
                    <span>Página {page} de {totalPages || 1} ({totalItems} items)</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="page-btn"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Modal Portal */}
            {isModalOpen && createPortal(
                <MaterialModal
                    item={editingItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={async () => {
                        setIsModalOpen(false)
                        loadCatalog()
                    }}
                    projectId={projectId}
                    companyId={companyId}
                />,
                document.body
            )}

            {/* Progress Overlay */}
            {isImporting && progress && createPortal(
                <div className="progress-overlay">
                    <div className="progress-box animate-pop">
                        <h3>Importando Materiales...</h3>
                        <div className="progress-info">
                            <span>Procesando {progress.current} de {progress.total}</span>
                            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                        <p className="wait-text">Por favor no cierres esta ventana</p>
                    </div>
                </div>,
                document.body
            )}

            <style jsx>{`
                .material-catalog-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    gap: 1rem;
                    overflow: hidden; /* Critical: prevents outer scroll */
                }

                .progress-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10000;
                }
                .progress-box {
                    background: #1e293b; padding: 2rem; border-radius: 12px;
                    width: 400px; text-align: center; border: 1px solid #334155;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .progress-info {
                    display: flex; justify-content: space-between; margin-bottom: 0.5rem;
                    color: #e2e8f0; font-size: 0.9rem;
                }
                .progress-bar-bg {
                    height: 8px; background: #334155; border-radius: 4px; overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%; background: var(--accent); transition: width 0.3s ease;
                }
                .wait-text { font-size: 0.8rem; color: #94a3b8; margin-top: 1rem; }

                .catalog-toolbar {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    background: rgba(255,255,255,0.03);
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    flex-wrap: wrap;
                }

                .search-section {
                    display: flex; gap: 0.5rem; flex: 1; max-width: 500px;
                    align-items: stretch; /* Stretch to match heights */
                }
                
                .search-wrapper { 
                    flex: 1;
                    display: flex;
                    align-items: center;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    padding-left: 12px;
                    transition: border-color 0.2s;
                }
                
                .search-wrapper:focus-within {
                    border-color: var(--accent);
                }
                
                .filter-toggle {
                    background: transparent; border: 1px solid #334155; color: #94a3b8;
                    padding: 0 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;
                    transition: all 0.2s;
                    display: flex; align-items: center;
                    white-space: nowrap;
                }
                .filter-toggle:hover, .filter-toggle.active {
                    background: rgba(255,255,255,0.05); color: white; border-color: #475569;
                }

                .filters-panel {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;
                    background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px;
                    border: 1px solid #334155; margin-bottom: 0.5rem;
                }
                .filter-group { display: flex; flex-direction: column; gap: 0.25rem; }
                .filter-group input, .filter-group select {
                    background: #1e293b; border: 1px solid #334155; padding: 6px; border-radius: 4px;
                    color: white; font-size: 0.85rem; width: 100%;
                }
                .filter-group input:focus, .filter-group select:focus { border-color: var(--accent); outline: none; }

                .search-icon {
                    color: #64748b;
                    flex-shrink: 0;
                }

                .search-input {
                    width: 100%;
                    padding: 10px;
                    background: transparent;
                    border: none;
                    color: white;
                    outline: none;
                    font-size: 0.9rem;
                }
                .search-input::placeholder { color: #475569; }

                .actions-wrapper {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                }

                .action-divider {
                    width: 1px;
                    height: 24px;
                    background: #334155;
                    margin: 0 0.25rem;
                }

                .settings-menu {
                    position: relative;
                }

                .settings-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    min-width: 180px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    z-index: 100;
                    overflow: hidden;
                }

                .dropdown-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: transparent;
                    border: none;
                    color: #cbd5e1;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    text-align: left;
                }

                .dropdown-item:hover {
                    background: rgba(255,255,255,0.05);
                }

                .dropdown-item.danger {
                    color: #ef4444;
                }

                .dropdown-item.danger:hover {
                    background: rgba(239,68,68,0.1);
                }

                .dropdown-divider {
                    height: 1px;
                    background: #334155;
                    margin: 6px 0;
                }


                .btn-primary, .btn-secondary {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: var(--accent);
                    color: white;
                    border: none;
                }
                .btn-primary:hover { filter: brightness(1.1); }

                .btn-secondary {
                    background: transparent;
                    color: #cbd5e1;
                    border: 1px solid #334155;
                }
                .btn-secondary:hover { background: rgba(255,255,255,0.05); color: white; }
                .btn-secondary.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
                .btn-secondary.danger:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }

                .footer-info {
                    flex-shrink: 0;
                    padding: 1rem;
                    background: rgba(15, 23, 42, 0.8);
                    border-top: 1px solid #334155;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .catalog-table-wrapper {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: auto;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    background: #1e293b;
                    min-height: 0;
                    max-height: 520px; /* ~8 rows (header + 8 data rows) */
                }

                .catalog-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .catalog-table th {
                    background: #0f172a;
                    padding: 12px;
                    text-align: left;
                    font-size: 0.8rem;
                    color: #94a3b8;
                    position: sticky;
                    top: 0;
                    border-bottom: 2px solid #334155;
                }

                .catalog-table td {
                    padding: 12px;
                    border-bottom: 1px solid #334155;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                }

                .catalog-table tr:hover { background: rgba(255,255,255,0.02); }

                .font-mono { font-family: monospace; color: var(--accent); }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .sub-text { font-size: 0.75rem; color: #64748b; margin-top: 2px; }

                .upload-stats-banner {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 0.9rem;
                }
                .stats-header { display: flex; align-items: center; gap: 10px; color: #ecfdf5; }
                .text-green { color: #34d399; }
                .text-yellow { color: #fbbf24; }
                .divider { color: #64748b; }
                .close-stats { margin-left: auto; background: none; border: none; color: #64748b; cursor: pointer; }

                .action-icon {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                .action-icon:hover { background: rgba(255,255,255,0.1); color: white; }
                .action-icon.delete:hover { color: #ef4444; }

                .pagination-controls {
                    display: flex; align-items: center; justify-content: center; gap: 1rem;
                    color: #94a3b8; font-size: 0.9rem; margin: 0 auto;
                }
                .page-btn {
                    background: #1e293b; border: 1px solid #334155; color: white;
                    padding: 6px 16px; border-radius: 6px; cursor: pointer; transition: all 0.2s;
                }
                .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .page-btn:not(:disabled):hover { border-color: var(--accent); }
            `}</style>
        </div>
    )
}

// ==========================================
// FORM MODAL COMPONENT (Internal)
// ==========================================

function MaterialModal({ item, onClose, onSave, projectId, companyId }: {
    item: MaterialCatalogItem | null,
    onClose: () => void,
    onSave: () => void,
    projectId: string,
    companyId: string
}) {
    // Helper to extract initial custom fields
    const getCustom = (key: string) => (item?.custom_fields as any)?.[key] || ''

    const [formData, setFormData] = useState<CreateMaterialParams>({
        ident_code: item?.ident_code || '',
        short_desc: item?.short_desc || '',
        long_desc: item?.long_desc || '',
        short_code: (item as any)?.short_code || '',
        commodity_code: item?.commodity_code || '',
        spec_code: item?.spec_code || '',
        unit_weight: item?.unit_weight || undefined,
        part_group: item?.part_group || '',
        sap_mat_grp: item?.sap_mat_grp || '',
        commodity_group: item?.commodity_group || '',
        custom_fields: {
            ...item?.custom_fields,
            'alt_ident_code': getCustom('alt_ident_code'),
            'Input 1': getCustom('Input 1'),
            'Input 2': getCustom('Input 2'),
            'Input 3': getCustom('Input 3'),
            'Input 4': getCustom('Input 4'),
        }
    })

    const [saving, setSaving] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            if (item) {
                await updateMaterial(item.id, formData)
            } else {
                await createMaterial(projectId, companyId, formData)
            }
            onSave()
        } catch (error) {
            console.error(error)
            alert('Error guardando material')
        } finally {
            setSaving(false)
        }
    }

    const updateCustom = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            custom_fields: {
                ...prev.custom_fields,
                [key]: value
            }
        }))
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-pop">
                <div className="modal-header">
                    <h3>{item ? 'Editar Material' : 'Nuevo Material'}</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        {/* Core Identity */}
                        <div className="field">
                            <label>Ident (Primary) *</label>
                            <input
                                required
                                value={formData.ident_code}
                                onChange={e => setFormData({ ...formData, ident_code: e.target.value })}
                                placeholder="Unique ID"
                                disabled={item !== null}
                            />
                        </div>
                        <div className="field">
                            <label>Ident Code (Alt)</label>
                            <input
                                value={formData.custom_fields?.['alt_ident_code'] || ''}
                                onChange={e => updateCustom('alt_ident_code', e.target.value)}
                                placeholder="Legacy / Alt Code"
                            />
                        </div>

                        <div className="field full">
                            <label>Short Description *</label>
                            <input
                                required
                                value={formData.short_desc}
                                onChange={e => setFormData({ ...formData, short_desc: e.target.value })}
                                placeholder="Breve descripción del material"
                            />
                        </div>

                        {/* Codes & Groups */}
                        <div className="field">
                            <label>Short Code</label>
                            <input
                                value={formData.short_code || ''}
                                onChange={e => setFormData({ ...formData, short_code: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>Part Group</label>
                            <input
                                value={formData.part_group || ''}
                                onChange={e => setFormData({ ...formData, part_group: e.target.value })}
                            />
                        </div>

                        <div className="field">
                            <label>Commodity Code</label>
                            <input
                                value={formData.commodity_code || ''}
                                onChange={e => setFormData({ ...formData, commodity_code: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>Commodity Group</label>
                            <input
                                value={formData.commodity_group || ''}
                                onChange={e => setFormData({ ...formData, commodity_group: e.target.value })}
                            />
                        </div>

                        <div className="field">
                            <label>Spec Code</label>
                            <input
                                value={formData.spec_code || ''}
                                onChange={e => setFormData({ ...formData, spec_code: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>SAP Mat Grp</label>
                            <input
                                value={formData.sap_mat_grp || ''}
                                onChange={e => setFormData({ ...formData, sap_mat_grp: e.target.value })}
                            />
                        </div>

                        <div className="field">
                            <label>Unit Weight (kg)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={formData.unit_weight || ''}
                                onChange={e => setFormData({ ...formData, unit_weight: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="field"></div> {/* Spacer */}

                        {/* Custom Inputs */}
                        <div className="section-label full">
                            <span>CUSTOM FIELDS</span>
                        </div>
                        <div className="field">
                            <label>Input 1</label>
                            <input
                                value={formData.custom_fields?.['Input 1'] || ''}
                                onChange={e => updateCustom('Input 1', e.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Input 2</label>
                            <input
                                value={formData.custom_fields?.['Input 2'] || ''}
                                onChange={e => updateCustom('Input 2', e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Input 3</label>
                            <input
                                value={formData.custom_fields?.['Input 3'] || ''}
                                onChange={e => updateCustom('Input 3', e.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Input 4</label>
                            <input
                                value={formData.custom_fields?.['Input 4'] || ''}
                                onChange={e => updateCustom('Input 4', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn-save">
                            {saving ? 'Guardando...' : 'Guardar Material'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 9999;
                }
                .modal-content {
                    background: #1e293b; border: 1px solid #334155;
                    border-radius: 12px; width: 800px; max-width: 95vw;
                    max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
                }
                .modal-header {
                    padding: 1.5rem; border-bottom: 1px solid #334155;
                    display: flex; justify-content: space-between; align-items: center;
                    position: sticky; top: 0; background: #1e293b; z-index: 10;
                }
                .modal-header h3 { margin: 0; color: white; font-size: 1.25rem; }
                .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
                .close-btn:hover { color: white; }

                .modal-form { padding: 1.5rem; }
                .form-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .field { display: flex; flex-direction: column; gap: 0.5rem; }
                .field.full { grid-column: span 2; }
                
                .section-label { 
                    display: flex; align-items: center; 
                    border-bottom: 1px solid #334155; 
                    margin-top: 1rem;
                    height: 100%;
                }
                .section-label.full { grid-column: span 2; }
                .section-label span {
                    font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
                    color: white; font-weight: 700;
                }

                label { font-size: 0.875rem; color: #94a3b8; font-weight: 500; }
                input, textarea {
                    background: #0f172a; border: 1px solid #334155;
                    border-radius: 6px; padding: 0.75rem; color: white;
                    outline: none; font-size: 0.9rem;
                }
                input:focus, textarea:focus { border-color: var(--accent); }
                input:disabled { opacity: 0.5; cursor: not-allowed; }

                .modal-actions {
                    display: flex; justify-content: flex-end; gap: 1rem;
                    padding-top: 1rem; border-top: 1px solid #334155;
                    position: sticky; bottom: 0; background: #1e293b;
                    margin: -1.5rem; padding: 1.5rem; margin-top: 0;
                }
                .btn-cancel {
                    background: transparent; border: 1px solid #475569; color: #cbd5e1;
                    padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;
                }
                .btn-save {
                    background: var(--accent); color: white; border: none;
                    padding: 0.5rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer;
                }
                .btn-save:hover { filter: brightness(1.1); }
                .btn-save:disabled { opacity: 0.7; cursor: wait; }
            `}</style>
        </div>
    )
}
