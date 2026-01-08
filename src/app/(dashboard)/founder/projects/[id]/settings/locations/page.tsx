'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getProjectLocations, createProjectLocation, updateProjectLocation, deactivateLocation, type ProjectLocation } from '@/services/project-locations'
import { MapPin, Plus, Building2, Package, Wrench, Truck, CheckCircle, Edit, Trash2 } from 'lucide-react'

// Using lucid-react icons consistent with the project
const LOCATION_TYPE_ICONS = {
    workshop: Wrench,
    storage: Package,
    field: Building2,
    transit: Truck,
    installed: CheckCircle,
    other: MapPin
}

const LOCATION_TYPE_LABELS = {
    workshop: 'Maestranza',
    storage: 'Bodega/Acopio',
    field: 'Terreno',
    transit: 'En Tránsito',
    installed: 'Instalado',
    other: 'Otro'
}

export default function ProjectLocationsPage() {
    const params = useParams()
    const projectId = params.id as string

    const [locations, setLocations] = useState<ProjectLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')
    const [showForm, setShowForm] = useState(false)
    const [editingLocation, setEditingLocation] = useState<ProjectLocation | null>(null)

    useEffect(() => {
        loadLocations()
    }, [projectId])

    async function loadLocations() {
        setLoading(true)
        const { data } = await getProjectLocations(projectId)
        if (data) {
            setLocations(data)
        }
        setLoading(false)
    }

    const filteredLocations = locations.filter(loc => {
        if (filter === 'active') return loc.is_active
        if (filter === 'inactive') return !loc.is_active
        return true
    })

    const locationsByType = filteredLocations.reduce((acc, loc) => {
        if (!acc[loc.type]) acc[loc.type] = []
        acc[loc.type].push(loc)
        return acc
    }, {} as Record<string, ProjectLocation[]>)

    async function handleDelete(locationId: string) {
        if (!confirm('¿Desactivar esta ubicación? Los spools asignados a ella quedarán sin ubicación.')) {
            return
        }

        const { error } = await deactivateLocation(locationId)
        if (!error) {
            await loadLocations()
        } else {
            alert('Error al desactivar ubicación')
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando ubicaciones...</p>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 400px;
                        color: var(--color-text-muted);
                    }
                    .spinner {
                        border: 3px solid rgba(255,255,255,0.1);
                        border-top: 3px solid var(--color-primary);
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin-bottom: 20px;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        )
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header glass-panel">
                <div className="header-content">
                    <div className="header-icon">
                        <MapPin size={32} color="white" />
                    </div>
                    <div>
                        <h1>Ubicaciones del Proyecto</h1>
                        <p>Gestiona las ubicaciones donde se almacenan y fabrican los spools</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingLocation(null)
                        setShowForm(true)
                    }}
                    className="btn-primary"
                >
                    <Plus size={20} />
                    Nueva Ubicación
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar glass-panel">
                <div className="filter-group">
                    <button
                        onClick={() => setFilter('active')}
                        className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    >
                        Activas ({locations.filter(l => l.is_active).length})
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
                    >
                        Inactivas ({locations.filter(l => !l.is_active).length})
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    >
                        Todas ({locations.length})
                    </button>
                </div>
            </div>

            {/* Locations by Type */}
            {Object.entries(locationsByType).length > 0 ? (
                Object.entries(locationsByType).map(([type, locs]) => {
                    const Icon = LOCATION_TYPE_ICONS[type as keyof typeof LOCATION_TYPE_ICONS]
                    const label = LOCATION_TYPE_LABELS[type as keyof typeof LOCATION_TYPE_LABELS]

                    return (
                        <div key={type} className="type-section glass-panel">
                            <div className="section-header">
                                <span className="section-icon">
                                    <Icon size={20} />
                                </span>
                                <h2>{label}</h2>
                                <span className="count-pill">{locs.length}</span>
                            </div>

                            <div className="locations-grid">
                                {locs.map(location => (
                                    <div key={location.id} className="location-card">
                                        <div className="card-top">
                                            <div className="card-title">
                                                <h3>{location.name}</h3>
                                                {location.code && (
                                                    <span className="code-badge">{location.code}</span>
                                                )}
                                            </div>
                                            {!location.is_active && (
                                                <span className="inactive-badge">Inactiva</span>
                                            )}
                                        </div>

                                        {location.description && (
                                            <p className="card-desc">{location.description}</p>
                                        )}

                                        {location.capacity && (
                                            <div className="card-meta">
                                                <Package size={14} />
                                                Capacidad: {location.capacity} spools
                                            </div>
                                        )}

                                        <div className="card-actions">
                                            <button
                                                onClick={() => {
                                                    setEditingLocation(location)
                                                    setShowForm(true)
                                                }}
                                                className="btn-action btn-edit"
                                            >
                                                <Edit size={14} /> Editar
                                            </button>
                                            {location.is_active && (
                                                <button
                                                    onClick={() => handleDelete(location.id)}
                                                    className="btn-action btn-delete"
                                                >
                                                    <Trash2 size={14} /> Desactivar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="empty-state glass-panel">
                    <div className="empty-icon">
                        <MapPin size={48} strokeWidth={1} />
                    </div>
                    <h3>No hay ubicaciones {filter === 'active' ? 'activas' : filter === 'inactive' ? 'inactivas' : ''}</h3>
                    <p>
                        {filter === 'active'
                            ? 'Crea tu primera ubicación para organizar tus spools'
                            : 'No hay ubicaciones con este filtro'}
                    </p>
                    {filter === 'active' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary"
                            style={{ marginTop: '20px' }}
                        >
                            <Plus size={20} />
                            Crear Primera Ubicación
                        </button>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <LocationFormModal
                    projectId={projectId}
                    location={editingLocation}
                    onClose={() => {
                        setShowForm(false)
                        setEditingLocation(null)
                    }}
                    onSuccess={() => {
                        loadLocations()
                        setShowForm(false)
                        setEditingLocation(null)
                    }}
                />
            )}

            <style jsx>{`
                .page-container {
                    padding: 24px;
                    max-width: 1280px;
                    margin: 0 auto;
                    color: var(--color-text-main);
                }

                /* Header */
                .page-header {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%);
                    border-radius: 16px;
                    padding: 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .header-content h1 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin: 0 0 4px 0;
                    line-height: 1.2;
                    color: white;
                }

                .header-content p {
                    margin: 0;
                    color: var(--color-text-muted);
                    font-size: 1rem;
                }

                .btn-primary {
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                }

                .btn-primary:hover {
                    background: var(--color-primary-hover);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                }

                /* Filters */
                .filters-bar {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .filter-group {
                    display: flex;
                    gap: 8px;
                }

                .filter-btn {
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: 1px solid transparent;
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-text-muted);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .filter-btn.active {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.5);
                    color: #93c5fd;
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
                }

                /* Sections */
                .type-section {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .section-icon {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-primary);
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .section-header h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                }

                .count-pill {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text-muted);
                    padding: 2px 10px;
                    border-radius: 99px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                /* Grid */
                .locations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }

                /* Card */
                .location-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                }

                .location-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }

                .card-title h3 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                }

                .code-badge {
                    display: inline-block;
                    background: rgba(59, 130, 246, 0.2);
                    color: #93c5fd;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-top: 4px;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .inactive-badge {
                    background: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 4px;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .card-desc {
                    font-size: 0.875rem;
                    color: var(--color-text-muted);
                    margin: 0 0 12px 0;
                    line-height: 1.4;
                    flex-grow: 1;
                }

                .card-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.875rem;
                    color: var(--color-text-dim);
                    margin-bottom: 16px;
                }

                .card-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: auto;
                }

                .btn-action {
                    flex: 1;
                    padding: 8px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    transition: background 0.2s;
                }

                .btn-edit {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-text-muted);
                }
                .btn-edit:hover { background: rgba(255, 255, 255, 0.1); color: white; }

                .btn-delete {
                    background: rgba(239, 68, 68, 0.1);
                    color: #fca5a5;
                }
                .btn-delete:hover { background: rgba(239, 68, 68, 0.2); }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 48px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    border: 2px dashed rgba(255, 255, 255, 0.1);
                    color: var(--color-text-muted);
                }
                .empty-icon {
                    color: var(--color-text-dim);
                    margin-bottom: 16px;
                }
                .empty-state h3 {
                    font-size: 1.25rem;
                    color: white;
                    margin-bottom: 8px;
                }

            `}</style>
        </div>
    )
}

// Simple inline form modal using CSS
function LocationFormModal({
    projectId,
    location,
    onClose,
    onSuccess
}: {
    projectId: string
    location: ProjectLocation | null
    onClose: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState({
        name: location?.name || '',
        code: location?.code || '',
        type: location?.type || 'other',
        description: location?.description || '',
        capacity: location?.capacity?.toString() || ''
    })
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        // Get company_id from current user context
        const supabase = (await import('@/lib/supabase/client')).createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data: member } = await supabase
            .from('members')
            .select('company_id')
            .eq('user_id', user?.id)
            .single()

        const locationData = {
            project_id: projectId,
            company_id: member?.company_id,
            name: form.name,
            code: form.code || null,
            type: form.type as any,
            description: form.description || null,
            capacity: form.capacity ? parseInt(form.capacity) : null,
            parent_location_id: null,
            gps_coords: null,
            custom_metadata: {},
            is_active: true
        }

        if (location) {
            await updateProjectLocation(location.id, locationData)
        } else {
            await createProjectLocation(locationData)
        }

        setSaving(false)
        onSuccess()
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel">
                <h2>{location ? 'Editar Ubicación' : 'Nueva Ubicación'}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre *</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej. Bodega Principal"
                        />
                    </div>

                    <div className="form-group">
                        <label>Código</label>
                        <input
                            type="text"
                            value={form.code}
                            onChange={e => setForm({ ...form, code: e.target.value })}
                            placeholder="Ej. BDP"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo *</label>
                        <select
                            required
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value as any })}
                        >
                            <option value="workshop">Maestranza</option>
                            <option value="storage">Bodega/Acopio</option>
                            <option value="field">Terreno</option>
                            <option value="transit">En Tránsito</option>
                            <option value="installed">Instalado</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Capacidad (spools)</label>
                        <input
                            type="number"
                            value={form.capacity}
                            onChange={e => setForm({ ...form, capacity: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="btn-save">
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    padding: 20px;
                    backdrop-filter: blur(4px);
                }

                .modal-content {
                    background: #0f172a; /* Fallback */
                    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 500px;
                    padding: 32px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                    animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    color: white;
                }

                .modal-content h2 {
                    margin: 0 0 24px 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-text-muted);
                    margin-bottom: 6px;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    font-size: 0.95rem;
                    color: white;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    background: rgba(0, 0, 0, 0.3);
                }

                /* Dark select options fix */
                .form-group select option {
                    background: #0f172a;
                    color: white;
                }

                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 32px;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.95rem;
                }

                .btn-cancel {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-text-muted);
                }
                .btn-cancel:hover { background: rgba(255, 255, 255, 0.1); color: white; }

                .btn-save {
                    background: var(--color-primary);
                    color: white;
                }
                .btn-save:hover { background: var(--color-primary-hover); }
                .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

                @keyframes popIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
