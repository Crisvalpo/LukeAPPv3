'use client'

import { useState, useEffect } from 'react'
import { getProjectLocations, createProjectLocation, updateProjectLocation, deactivateLocation, type ProjectLocation } from '@/services/project-locations'
import { MapPin, Plus, Building2, Package, Wrench, Truck, CheckCircle, Edit, Trash2, ArrowLeft } from 'lucide-react'

// Using lucid-react icons consistent with the project
const LOCATION_TYPE_ICONS = {
    workshop: Wrench,
    storage: Package,
    field: Building2,
    transit: Truck,
    other: MapPin
}

const LOCATION_TYPE_LABELS = {
    workshop: 'Maestranza',
    storage: 'Bodega/Acopio',
    field: 'Terreno',
    transit: 'En Tránsito',
    other: 'Otro'
}

interface Props {
    projectId: string
    onBack?: () => void
}

export default function ProjectLocationsManager({ projectId, onBack }: Props) {
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
            <div className="loading-container glass-panel">
                <div className="spinner"></div>
                <p>Cargando ubicaciones...</p>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 300px;
                        color: var(--color-text-muted);
                        padding: 2rem;
                    }
                    .spinner {
                        border: 3px solid rgba(255,255,255,0.1);
                        border-top: 3px solid var(--color-primary);
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        animation: spin 1s linear infinite;
                        margin-bottom: 1rem;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        )
    }

    return (
        <div className="locations-manager animate-in">
            {/* Header Integrated */}
            <div className="manager-header">
                <div className="header-left">
                    {onBack && (
                        <button onClick={onBack} className="btn-back" title="Volver al menú">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2>Ubicaciones del Proyecto</h2>
                        <p>Gestiona sitios de montaje, bodegas y talleres</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingLocation(null)
                        setShowForm(true)
                    }}
                    className="btn-primary"
                >
                    <Plus size={18} />
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
            <div className="locations-content">
                {Object.entries(locationsByType).length > 0 ? (
                    Object.entries(locationsByType).map(([type, locs]) => {
                        const Icon = LOCATION_TYPE_ICONS[type as keyof typeof LOCATION_TYPE_ICONS] || MapPin
                        const label = LOCATION_TYPE_LABELS[type as keyof typeof LOCATION_TYPE_LABELS] || type

                        return (
                            <div key={type} className="type-section glass-panel">
                                <div className="section-header">
                                    <span className="section-icon">
                                        <Icon size={18} />
                                    </span>
                                    <h3>{label}</h3>
                                    <span className="count-pill">{locs.length}</span>
                                </div>

                                <div className="locations-grid">
                                    {locs.map(location => (
                                        <div key={location.id} className="location-card">
                                            <div className="card-top">
                                                <div className="card-title">
                                                    <h4>{location.name}</h4>
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

                                            <div className="card-meta">
                                                <Package size={14} />
                                                <span>Capacidad: {location.capacity || 'Ilimitada'}</span>
                                            </div>

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
                            <MapPin size={40} strokeWidth={1} />
                        </div>
                        <h3>No hay ubicaciones {filter === 'active' ? 'activas' : filter === 'inactive' ? 'inactivas' : ''}</h3>
                        {filter === 'active' && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-primary text-center"
                                style={{ marginTop: '1rem', width: 'auto', margin: '1rem auto' }}
                            >
                                <Plus size={18} /> Crear Primera Ubicación
                            </button>
                        )}
                    </div>
                )}
            </div>

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
                .locations-manager {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .animate-in {
                    animation: fadeIn 0.3s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Header */
                .manager-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .btn-back {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--color-text-main);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-back:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateX(-2px);
                }

                .manager-header h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    color: white;
                    line-height: 1.2;
                }

                .manager-header p {
                    margin: 0;
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                }

                .btn-primary {
                    background: linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    font-size: 0.9rem;
                    backdrop-filter: blur(4px);
                }

                .btn-primary:hover {
                    background: rgba(30, 41, 59, 1);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
                }

                /* Active state or Primary action highlight */
                .btn-primary:active {
                    transform: translateY(0);
                }

                /* Filters */
                .filters-bar {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .filter-group {
                    display: flex;
                    gap: 8px;
                }

                .filter-btn {
                    padding: 6px 14px;
                    border-radius: 8px;
                    border: 1px solid transparent;
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-text-muted);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                }

                .filter-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .filter-btn.active {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: rgba(59, 130, 246, 0.3);
                    color: #93c5fd;
                }

                /* Sections */
                .locations-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .type-section {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 16px;
                    padding: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 1rem;
                }

                .section-icon {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--color-primary);
                    padding: 6px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .section-header h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                    margin: 0;
                }

                .count-pill {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text-muted);
                    padding: 1px 8px;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                /* Grid */
                .locations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                }

                /* Card */
                .location-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 1.25rem;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                }

                .location-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }

                .card-title h4 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: white;
                }

                .code-badge {
                    display: inline-block;
                    background: rgba(59, 130, 246, 0.15);
                    color: #93c5fd;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 1px 5px;
                    border-radius: 4px;
                    margin-top: 2px;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .inactive-badge {
                    background: rgba(239, 68, 68, 0.15);
                    color: #fca5a5;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 1px 6px;
                    border-radius: 4px;
                }

                .card-desc {
                    font-size: 0.85rem;
                    color: var(--color-text-muted);
                    margin: 0 0 0.75rem 0;
                    line-height: 1.4;
                    flex-grow: 1;
                }

                .card-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    color: var(--color-text-dim);
                    margin-bottom: 1rem;
                    background: rgba(0,0,0,0.1);
                    padding: 4px 8px;
                    border-radius: 6px;
                    width: fit-content;
                }

                .card-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: auto;
                }

                .btn-action {
                    flex: 1;
                    padding: 6px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    transition: all 0.2s;
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
                    padding: 3rem;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    border: 2px dashed rgba(255, 255, 255, 0.05);
                    color: var(--color-text-muted);
                }
                .empty-icon {
                    color: var(--color-text-dim);
                    margin-bottom: 1rem;
                }
                .empty-state h3 {
                    font-size: 1.1rem;
                    color: white;
                    margin-bottom: 0.5rem;
                }
            `}</style>
        </div>
    )
}

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
    const [form, setForm] = useState<{
        name: string
        code: string
        type: 'workshop' | 'storage' | 'field' | 'transit' | 'other'
        description: string
        capacity: string
    }>({
        name: location?.name || '',
        code: location?.code || '',
        type: (location?.type as any) || 'other',
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
            type: form.type as 'workshop' | 'storage' | 'field' | 'transit' | 'other',
            description: form.description || null,
            capacity: form.capacity ? parseInt(form.capacity) : null,
            gps_coords: null,
            custom_metadata: {},
            is_active: true,
            parent_location_id: null
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

                    <div className="form-row">
                        <div className="form-group half">
                            <label>Código</label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder="Ej. BDP"
                            />
                        </div>

                        <div className="form-group half">
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
                                <option value="other">Otro</option>
                            </select>
                        </div>
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
                    z-index: 999;
                    padding: 20px;
                    backdrop-filter: blur(4px);
                }

                .modal-content {
                    background: #0f172a;
                    background: linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 500px;
                    padding: 2rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
                    color: white;
                }

                .modal-content h2 {
                    margin: 0 0 1.5rem 0;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                }

                .form-group {
                    margin-bottom: 1rem;
                }
                
                .form-row {
                    display: flex;
                    gap: 1rem;
                }
                
                .half { flex: 1; }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--color-text-muted);
                    margin-bottom: 0.4rem;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.6rem 0.8rem;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    font-size: 0.9rem;
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

                .form-group select option {
                    background: #0f172a;
                    color: white;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 0.7rem;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.9rem;
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
            `}</style>
        </div>
    )
}
