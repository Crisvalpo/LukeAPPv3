'use client'

import { useState, useEffect } from 'react'
import { getProjectLocations, createProjectLocation, updateProjectLocation, deactivateLocation, deleteLocation, type ProjectLocation } from '@/services/project-locations'
import { MapPin, Plus, Building2, Package, Wrench, Truck, CheckCircle, Edit, Trash2, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge' // Assuming this exists, based on file list
import { Heading, Text } from '@/components/ui/Typography'
import { InputField } from '@/components/ui/InputField'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/Textarea' // Check casing "Textarea.tsx"


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
        if (!confirm('¿Desactivar esta ubicación? Los spools asignados seguirán apuntando a ella pero se mostrará como inactiva.')) {
            return
        }

        const { error } = await deactivateLocation(locationId)
        if (!error) {
            await loadLocations()
        } else {
            alert('Error al desactivar ubicación')
        }
    }

    async function handleReactivate(locationId: string) {
        const { error } = await updateProjectLocation(locationId, { is_active: true })
        if (!error) {
            await loadLocations()
        } else {
            alert('Error al reactivar ubicación')
        }
    }

    async function handleHardDelete(locationId: string) {
        if (!confirm('¿ELIMINAR PERMANENTEMENTE?\n\nEsta acción no se puede deshacer. Si hay spools en esta ubicación, quedarán sin ubicación asignada.')) {
            return
        }

        const { error } = await deleteLocation(locationId)
        if (!error) {
            await loadLocations()
        } else {
            alert('Error al eliminar ubicación. Es posible que tenga registros dependientes.')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-text-muted p-8 border border-white/5 rounded-xl bg-white/5 backdrop-blur-sm">
                <div className="w-8 h-8 border-3 border-white/10 border-t-brand-primary rounded-full animate-spin mb-4" />
                <Text>Cargando ubicaciones...</Text>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Integrated */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            title="Volver al menú"
                            className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                    )}
                    <div>
                        <Heading level={2}>Ubicaciones del Proyecto</Heading>
                        <Text variant="muted">Gestiona sitios de montaje, bodegas y talleres</Text>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        setEditingLocation(null)
                        setShowForm(true)
                    }}
                    className="gap-2 shadow-lg hover:shadow-brand-primary/20"
                >
                    <Plus size={18} />
                    Nueva Ubicación
                </Button>
            </div>

            {/* Filters */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex gap-2 w-fit">
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'active'
                            ? "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                        }`}
                >
                    Activas ({locations.filter(l => l.is_active).length})
                </button>
                <button
                    onClick={() => setFilter('inactive')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'inactive'
                            ? "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                        }`}
                >
                    Inactivas ({locations.filter(l => !l.is_active).length})
                </button>
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'all'
                            ? "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20"
                            : "text-text-muted hover:text-white hover:bg-white/5"
                        }`}
                >
                    Todas ({locations.length})
                </button>
            </div>

            {/* Locations by Type */}
            <div className="flex flex-col gap-6">
                {Object.entries(locationsByType).length > 0 ? (
                    Object.entries(locationsByType).map(([type, locs]) => {
                        const Icon = LOCATION_TYPE_ICONS[type as keyof typeof LOCATION_TYPE_ICONS] || MapPin
                        const label = LOCATION_TYPE_LABELS[type as keyof typeof LOCATION_TYPE_LABELS] || type

                        return (
                            <div key={type} className="bg-bg-surface-1 border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                        <Icon size={20} />
                                    </div>
                                    <Heading level={3} size="lg" className="m-0 text-lg">{label}</Heading>
                                    <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-semibold text-text-muted">{locs.length}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {locs.map(location => (
                                        <div key={location.id}
                                            className="group relative flex flex-col p-5 rounded-xl border border-white/5 bg-white/5 hover:border-brand-primary/30 hover:bg-white/[0.07] transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-white text-base mb-1">{location.name}</h4>
                                                    {location.code && (
                                                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            {location.code}
                                                        </span>
                                                    )}
                                                </div>
                                                {!location.is_active && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                        Inactiva
                                                    </span>
                                                )}
                                            </div>

                                            {location.description && (
                                                <p className="text-sm text-text-muted mb-4 line-clamp-2 flex-grow">{location.description}</p>
                                            )}

                                            <div className="flex items-center gap-2 text-xs text-text-dim mb-4 bg-black/20 w-fit px-2 py-1 rounded">
                                                <Package size={12} />
                                                <span>Capacidad: {location.capacity || 'Ilimitada'}</span>
                                            </div>

                                            <div className="flex gap-2 mt-auto pt-2 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingLocation(location)
                                                        setShowForm(true)
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                                                >
                                                    <Edit size={12} /> Editar
                                                </button>
                                                {location.is_active ? (
                                                    <button
                                                        onClick={() => handleDelete(location.id)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-colors"
                                                        title="Desactivar"
                                                    >
                                                        <Trash2 size={12} /> Desactivar
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleReactivate(location.id)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium bg-green-500/5 hover:bg-green-500/10 text-green-400 transition-colors"
                                                            title="Reactivar"
                                                        >
                                                            <RotateCcw size={12} /> Activar
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDelete(location.id)}
                                                            className="w-8 flex items-center justify-center py-1.5 rounded text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                                            title="Eliminar Permanentemente"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        <div className="p-4 bg-white/5 rounded-full text-text-dim mb-4">
                            <MapPin size={32} strokeWidth={1.5} />
                        </div>
                        <Heading level={3} className="mb-2">No hay ubicaciones {filter === 'active' ? 'activas' : filter === 'inactive' ? 'inactivas' : ''}</Heading>
                        <Text variant="muted" className="mb-6">
                            Comienza creando las ubicaciones donde se gestionarán los materiales y spools.
                        </Text>
                        {filter === 'active' && (
                            <Button
                                onClick={() => setShowForm(true)}
                                className="gap-2"
                            >
                                <Plus size={18} /> Crear Primera Ubicación
                            </Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-bg-surface-1 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5">
                    <Heading level={3} className="m-0">{location ? 'Editar Ubicación' : 'Nueva Ubicación'}</Heading>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <InputField
                        label="Nombre *"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Ej. Bodega Principal"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Código"
                            value={form.code}
                            onChange={e => setForm({ ...form, code: e.target.value })}
                            placeholder="Ej. BDP"
                        />

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-muted">Tipo *</label>
                            <Select
                                value={form.type}
                                onValueChange={(val: any) => setForm({ ...form, type: val })}
                            >
                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 focus:ring-brand-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-bg-surface-1 border-white/10 text-white">
                                    <SelectItem value="workshop">Maestranza</SelectItem>
                                    <SelectItem value="storage">Bodega/Acopio</SelectItem>
                                    <SelectItem value="field">Terreno</SelectItem>
                                    <SelectItem value="transit">En Tránsito</SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-muted">Descripción</label>
                        <Textarea
                            value={form.description}
                            onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:ring-brand-primary scrollbar-hide"
                        />
                    </div>

                    <InputField
                        label="Capacidad (spools)"
                        type="number"
                        value={form.capacity}
                        onChange={e => setForm({ ...form, capacity: e.target.value })}
                    />

                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 hover:bg-white/5 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-lg shadow-brand-primary/20"
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
