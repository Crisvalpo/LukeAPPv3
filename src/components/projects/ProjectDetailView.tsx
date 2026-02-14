'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProjectById, updateProject, type Project } from '@/services/projects'
import { getPendingInvitations, createInvitation, revokeInvitation, type Invitation } from '@/services/invitations'
import { Building2, Calendar, FileText, Check, X, Shield, Users, Image as ImageIcon, MapPin, Flame, Box } from 'lucide-react'
import InvitationManager from '@/components/invitations/InvitationManager'
import EngineeringManager from '@/components/engineering/EngineeringManager'
import ProcurementManager from '@/components/procurement/ProcurementManager'
import ProjectLocationsManager from '@/components/projects/ProjectLocationsManager'
import WeldTypesManager from '@/components/engineering/WeldTypesManager'
import StructureModelsManager from '@/components/project/StructureModelsManager'
import ProjectWeekConfigModal from '@/components/project/ProjectWeekConfigModal'
import ProjectLogosManager from '@/components/common/ProjectLogosManager'
import PersonnelManager from '@/components/personnel/PersonnelManager'

// Design System Imports
import { Button } from '@/components/ui/button'
import { InputField } from '@/components/ui/InputField'
import { Heading, Text } from '@/components/ui/Typography'
import { Icons } from '@/components/ui/Icons'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/components/ui/tabs'

// Styles migrated to Tailwind v4
// Styles migrated to Tailwind v4

interface ProjectDetails extends Project {
    contract_number?: string
    client_name?: string
    logo_primary_url?: string | null
    logo_secondary_url?: string | null
    logo_primary_crop?: any
    logo_secondary_crop?: any
}

interface ProjectDetailViewProps {
    projectId: string
    role: string
}

export default function ProjectDetailView({ projectId, role }: ProjectDetailViewProps) {
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [project, setProject] = useState<ProjectDetails | null>(null)
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'engineering' | 'procurement' | 'settings'>('engineering')
    const [settingsView, setSettingsView] = useState<'menu' | 'locations' | 'weld-types' | 'logo' | 'structure-models'>('menu')

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [isWeekConfigOpen, setIsWeekConfigOpen] = useState(false)

    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        client_name: '',
        contract_number: '',
        status: ''
    })

    const canEdit = ['founder', 'admin'].includes(role)

    const searchParams = useSearchParams()

    // Extract primitive values for dependency stability
    const tabParam = searchParams.get('tab')
    const actionParam = searchParams.get('action')

    useEffect(() => {
        loadProject()

        // Handle tab selection via URL
        if (tabParam && ['details', 'team', 'engineering', 'procurement', 'settings'].includes(tabParam)) {
            setActiveTab(tabParam as any)
        }

        // Handle action param
        if (actionParam === 'edit' && canEdit) {
            setIsEditing(true)
        }
    }, [projectId, tabParam, actionParam, canEdit])

    async function loadProject() {
        if (!projectId) return

        const data = await getProjectById(projectId)
        if (data) {
            console.log('Project loaded:', data.name, { primary: data.logo_primary_url, secondary: data.logo_secondary_url })
            setProject(data)
            setEditForm({
                name: data.name,
                description: data.description || '',
                client_name: (data as any).client_name || '',
                contract_number: (data as any).contract_number || '',
                status: data.status
            })

            const invs = await getPendingInvitations(undefined, projectId)
            setInvitations(invs)
        }
        setIsLoading(false)
    }

    // Refresh project when entering logo view to ensure consistency
    useEffect(() => {
        if (settingsView === 'logo') {
            loadProject()
        }
    }, [settingsView])

    async function handleInvite(data: any) {
        if (!project) return { success: false, message: 'Proyecto no cargado' }

        const result = await createInvitation({
            ...data,
            company_id: project.company_id,
            project_id: project.id
        })

        if (result.success) {
            loadProject()
        }
        return result
    }

    async function handleRevoke(id: string) {
        if (!window.confirm('¿Revocar invitación?')) return
        const result = await revokeInvitation(id)
        if (result.success) {
            loadProject()
        } else {
            alert('Error al revocar: ' + (result.message || 'Desconocido'))
        }
    }

    function exitEditMode() {
        if (role === 'admin') {
            router.push('/admin')
        } else {
            setIsEditing(false)
        }
    }

    async function handleSave() {
        if (!canEdit) return
        setIsSaving(true)
        setError('')

        const result = await updateProject(projectId, {
            name: editForm.name,
            description: editForm.description,
            client_name: editForm.client_name,
            contract_number: editForm.contract_number,
            status: editForm.status as any
        } as any)

        if (result.success) {
            setProject(result.data as any)
            exitEditMode()
        } else {
            setError(result.message)
        }

        setIsSaving(false)
    }

    if (isLoading) {
        return (
            <div className="dashboard-page center-message">
                <Text>Cargando proyecto...</Text>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="dashboard-page center-message">
                <Text className="text-error">Proyecto no encontrado</Text>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                    <Heading level={1}>
                        {isEditing ? 'Editar Proyecto' : project.name}
                    </Heading>
                </div>
                {!isEditing && (
                    <Text size="base" className="text-text-muted font-medium ml-4.5">
                        {/* Only show code if different from name */}
                        {project.code !== project.name && (
                            <>
                                {project.code} • {' '}
                            </>
                        )}
                        <span className="capitalize">
                            {project.status.replace('_', ' ')}
                        </span>
                    </Text>
                )}
            </div>

            <div className={`${isEditing ? 'max-w-3xl mx-auto' : ''}`}>
                {error && (
                    <div className="error-banner">
                        {error}
                    </div>
                )}

                {isEditing ? (
                    <div className="profile-header-card">
                        <div className="profile-header-glow" />

                        <div className="flex flex-col gap-6 relative z-10">
                            <InputField
                                label="Nombre del Proyecto"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                disabled={!canEdit}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Cliente Principal"
                                    value={editForm.client_name}
                                    onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                                    disabled={!canEdit}
                                />
                                <InputField
                                    label="N° Contrato"
                                    value={editForm.contract_number}
                                    onChange={(e) => setEditForm({ ...editForm, contract_number: e.target.value })}
                                    disabled={!canEdit}
                                    style={{ fontFamily: 'var(--font-family-mono)' }}
                                />
                            </div>

                            <div className="inputfield">
                                <label className="inputfield__label">Descripción</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="input min-h-[120px] resize-y"
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="inputfield">
                                <label className="inputfield__label">Estado</label>
                                <Select
                                    value={editForm.status}
                                    onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                                    disabled={!canEdit}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planning">Planificación</SelectItem>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="on_hold">En Pausa</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-4 mt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving || !canEdit}
                                    className="flex-1"
                                >
                                    Guardar Cambios
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={exitEditMode}
                                    disabled={isSaving}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (

                    <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
                        {/* Navbar */}
                        {!(role === 'admin' && activeTab === 'settings') && (
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 w-full">
                                {/* Work Modules (Left) */}
                                <TabsList variant="underline" className="shrink-0 border-b-0 space-x-0">
                                    {!(role === 'admin' && activeTab === 'team') && (
                                        <>
                                            <TabsTrigger variant="underline" value="engineering">Ingeniería</TabsTrigger>
                                            <TabsTrigger variant="underline" value="procurement">Abastecimiento</TabsTrigger>
                                        </>
                                    )}
                                </TabsList>

                                {/* Management (Right) */}
                                <TabsList variant="underline" className="shrink-0 border-b-0 space-x-0">
                                    {(role === 'founder' || activeTab === 'details') && (
                                        <TabsTrigger variant="underline" value="details">Detalles</TabsTrigger>
                                    )}
                                    {(role === 'founder' || activeTab === 'team') && (
                                        <TabsTrigger variant="underline" value="team">Equipo</TabsTrigger>
                                    )}
                                    {(role === 'founder') && (
                                        <TabsTrigger variant="underline" value="settings">Configuración</TabsTrigger>
                                    )}
                                </TabsList>
                            </div>
                        )}

                        <TabsContent value="details">
                            <div className="fade-in p-4">
                                {/* Info Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {/* Client Card */}
                                    <div className="group relative bg-bg-surface-1 border border-glass-border rounded-xl p-6 hover:border-brand-primary/30 transition-all duration-300 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-300">
                                                    <Building2 size={20} />
                                                </div>
                                                <Text size="xs" variant="muted" className="uppercase font-bold tracking-wider">
                                                    Cliente
                                                </Text>
                                            </div>
                                            <Text size="lg" className="font-semibold text-white">
                                                {project.client_name || <span className="text-text-dim italic font-normal">No especificado</span>}
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Contract Card */}
                                    <div className="group relative bg-bg-surface-1 border border-glass-border rounded-xl p-6 hover:border-brand-primary/30 transition-all duration-300 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-300">
                                                    <FileText size={20} />
                                                </div>
                                                <Text size="xs" variant="muted" className="uppercase font-bold tracking-wider">
                                                    Contrato
                                                </Text>
                                            </div>
                                            <Text size="lg" className="font-semibold font-mono text-white">
                                                {project.contract_number || <span className="text-text-dim italic font-sans font-normal">No especificado</span>}
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Status Card */}
                                    <div className="group relative bg-bg-surface-1 border border-glass-border rounded-xl p-6 hover:border-brand-primary/30 transition-all duration-300 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-300">
                                                    <Check size={20} />
                                                </div>
                                                <Text size="xs" variant="muted" className="uppercase font-bold tracking-wider">
                                                    Estado
                                                </Text>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500' :
                                                    project.status === 'planning' ? 'bg-blue-500' :
                                                        project.status === 'on_hold' ? 'bg-yellow-500' :
                                                            project.status === 'completed' ? 'bg-purple-500' :
                                                                'bg-gray-500'
                                                    }`} />
                                                <Text size="lg" className="font-semibold text-white capitalize">
                                                    {project.status.replace('_', ' ')}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description Card */}
                                {(project.description || canEdit) && (
                                    <div className="bg-bg-surface-1 border border-glass-border rounded-xl p-6 mb-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                                                <FileText size={20} />
                                            </div>
                                            <Text size="sm" variant="muted" className="uppercase font-bold tracking-wider">
                                                Descripción del Proyecto
                                            </Text>
                                        </div>
                                        <Text className="leading-relaxed text-text-main">
                                            {project.description || <span className="text-text-dim italic">Sin descripción disponible</span>}
                                        </Text>
                                    </div>
                                )}

                                {/* Project Metadata */}
                                <div className="bg-bg-surface-1 border border-glass-border rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                                            <Calendar size={20} />
                                        </div>
                                        <Text size="sm" variant="muted" className="uppercase font-bold tracking-wider">
                                            Información del Sistema
                                        </Text>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Text size="xs" variant="muted" className="mb-1">
                                                Código del Proyecto
                                            </Text>
                                            <Text className="font-mono text-brand-primary font-medium">
                                                {project.code}
                                            </Text>
                                        </div>
                                        <div>
                                            <Text size="xs" variant="muted" className="mb-1">
                                                Fecha de Creación
                                            </Text>
                                            <Text className="font-medium">
                                                {new Date(project.created_at).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </div>
                                    </div>
                                </div>

                                {canEdit && (
                                    <div className="flex gap-4 pt-8">
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            className="gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white"
                                        >
                                            <Icons.Edit size={18} />
                                            Editar Proyecto
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="team">
                            <Tabs defaultValue="workforce" className="fade-in">
                                {/* Sub-navigation for Team */}
                                <TabsList variant="underline" className="mb-8 justify-end">
                                    <TabsTrigger variant="underline" value="workforce">Dotación</TabsTrigger>
                                    <TabsTrigger variant="underline" value="staff">Administradores</TabsTrigger>
                                </TabsList>

                                <TabsContent value="workforce">
                                    {project && (
                                        <PersonnelManager
                                            projectId={project.id}
                                            isAdmin={['admin', 'founder'].includes(role)}
                                        />
                                    )}
                                </TabsContent>
                                <TabsContent value="staff">
                                    {project && (
                                        <InvitationManager
                                            companyId={project.company_id}
                                            companyName={project.name}
                                            projects={[project]}
                                            invitations={invitations}
                                            requireProject={true}
                                            fixedProjectId={project.id}
                                            onInvite={handleInvite}
                                            onRevoke={handleRevoke}
                                            roleOptions={[
                                                { value: 'admin', label: 'Admin Proyecto', description: 'Control total de ingeniería y construcción.' },
                                                { value: 'supervisor', label: 'Supervisor', description: 'Gestión de terreno, bodega o calidad.' },
                                                { value: 'worker', label: 'Operativo', description: 'Visualización de tareas y reportes simples.' }
                                            ]}
                                        />
                                    )}
                                </TabsContent>
                            </Tabs>
                        </TabsContent>

                        <TabsContent value="engineering">
                            <div className="fade-in">
                                <EngineeringManager
                                    projectId={project.id}
                                    companyId={project.company_id}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="procurement">
                            <div className="fade-in">
                                <ProcurementManager
                                    projectId={project.id}
                                    companyId={project.company_id}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="settings">
                            <div className="fade-in p-4">
                                {settingsView === 'menu' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div
                                            onClick={() => setSettingsView('locations')}
                                            className="group relative flex flex-col p-6 rounded-xl border border-white/5 bg-white/5 hover:border-brand-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-brand-primary/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="mb-4 p-3 rounded-lg bg-brand-primary/10 text-brand-primary w-fit group-hover:scale-110 transition-transform duration-300 z-10">
                                                <MapPin size={24} />
                                            </div>
                                            <div className="z-10">
                                                <Heading level={3} size="lg" className="mb-2 group-hover:text-brand-primary transition-colors">Ubicaciones</Heading>
                                                <Text variant="muted" size="sm">
                                                    Gestiona bodegas, talleres, áreas de acopio y sitios de montaje.
                                                </Text>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSettingsView('weld-types')}
                                            className="group relative flex flex-col p-6 rounded-xl border border-white/5 bg-white/5 hover:border-brand-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-brand-primary/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="mb-4 p-3 rounded-lg bg-brand-primary/10 text-brand-primary w-fit group-hover:scale-110 transition-transform duration-300 z-10">
                                                <Flame size={24} />
                                            </div>
                                            <div className="z-10">
                                                <Heading level={3} size="lg" className="mb-2 group-hover:text-brand-primary transition-colors">Tipos de Unión</Heading>
                                                <Text variant="muted" size="sm">
                                                    Marca las excepciones que NO requieren soldador.
                                                </Text>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setIsWeekConfigOpen(true)}
                                            className="group relative flex flex-col p-6 rounded-xl border border-white/5 bg-white/5 hover:border-brand-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-brand-primary/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="mb-4 p-3 rounded-lg bg-brand-primary/10 text-brand-primary w-fit group-hover:scale-110 transition-transform duration-300 z-10">
                                                <Calendar size={24} />
                                            </div>
                                            <div className="z-10">
                                                <Heading level={3} size="lg" className="mb-2 group-hover:text-brand-primary transition-colors">Configuración de Semanas</Heading>
                                                <Text variant="muted" size="sm">
                                                    Define la fecha de inicio del proyecto y el ciclo semanal.
                                                </Text>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSettingsView('logo')}
                                            className="group relative flex flex-col p-6 rounded-xl border border-white/5 bg-white/5 hover:border-brand-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-brand-primary/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="mb-4 p-3 rounded-lg bg-brand-primary/10 text-brand-primary w-fit group-hover:scale-110 transition-transform duration-300 z-10">
                                                <ImageIcon size={24} />
                                            </div>
                                            <div className="z-10">
                                                <Heading level={3} size="lg" className="mb-2 group-hover:text-brand-primary transition-colors">Logo del Proyecto</Heading>
                                                <Text variant="muted" size="sm">
                                                    Sube el logo del proyecto para incluirlo en reportes PDF.
                                                </Text>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSettingsView('structure-models')}
                                            className="group relative flex flex-col p-6 rounded-xl border border-white/5 bg-white/5 hover:border-brand-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-brand-primary/10"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="mb-4 p-3 rounded-lg bg-brand-primary/10 text-brand-primary w-fit group-hover:scale-110 transition-transform duration-300 z-10">
                                                <Box size={24} />
                                            </div>
                                            <div className="z-10">
                                                <Heading level={3} size="lg" className="mb-2 group-hover:text-brand-primary transition-colors">Modelos Estructurales (BIM)</Heading>
                                                <Text variant="muted" size="sm">
                                                    Carga modelos 3D de contexto.
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                ) : settingsView === 'locations' ? (
                                    <ProjectLocationsManager
                                        projectId={projectId}
                                        onBack={() => setSettingsView('menu')}
                                    />
                                ) : settingsView === 'weld-types' ? (
                                    <WeldTypesManager
                                        projectId={projectId}
                                        onBack={() => setSettingsView('menu')}
                                    />
                                ) : settingsView === 'logo' ? (
                                    <div style={{ maxWidth: '800px' }}>
                                        <ProjectLogosManager
                                            projectId={projectId}
                                            companyId={project.company_id}
                                            primaryLogoUrl={project.logo_primary_url}
                                            secondaryLogoUrl={project.logo_secondary_url}
                                            onUpdate={() => loadProject()}
                                            onBack={() => setSettingsView('menu')}
                                        />
                                    </div>
                                ) : settingsView === 'structure-models' ? (
                                    <div className="fade-in" style={{ maxWidth: '800px' }}>
                                        <StructureModelsManager
                                            projectId={projectId}
                                            onBack={() => setSettingsView('menu')}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <ProjectWeekConfigModal
                isOpen={isWeekConfigOpen}
                onClose={() => setIsWeekConfigOpen(false)}
                projectId={projectId}
                onSave={() => {
                    setIsWeekConfigOpen(false)
                }}
            />
        </div >
    )
}
