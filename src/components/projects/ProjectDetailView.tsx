'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProjectById, updateProject, type Project } from '@/services/projects'
import { getPendingInvitations, createInvitation, revokeInvitation, type Invitation } from '@/services/invitations'
import { Building2, Calendar, FileText, Check, X, Shield, Users, Image as ImageIcon } from 'lucide-react'
import InvitationManager from '@/components/invitations/InvitationManager'
import EngineeringManager from '@/components/engineering/EngineeringManager'
import ProcurementManager from '@/components/procurement/ProcurementManager'
import ProjectLocationsManager from '@/components/projects/ProjectLocationsManager'
import WeldTypesManager from '@/components/engineering/WeldTypesManager'
import StructureModelsManager from '@/components/project/StructureModelsManager'
import ProjectWeekConfigModal from '@/components/project/ProjectWeekConfigModal'
import ProjectLogosManager from '@/components/common/ProjectLogosManager'

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

import '@/styles/dashboard.css'
import '@/styles/companies.css'
import '@/styles/company-profile.css' // Reusing profile styles for consistent look
import '@/styles/views/project-details.css' // New specific styles for this view

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

    useEffect(() => {
        loadProject()

        // Handle tab selection via URL
        const tabParam = searchParams.get('tab')
        if (tabParam && ['details', 'team', 'engineering', 'procurement', 'settings'].includes(tabParam)) {
            setActiveTab(tabParam as any)
        }

        // Handle action param
        const actionParam = searchParams.get('action')
        if (actionParam === 'edit' && canEdit) {
            setIsEditing(true)
        }
    }, [projectId, searchParams, canEdit])

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
        await revokeInvitation(id)
        loadProject()
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
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <Heading level={1} className="dashboard-title">
                        {isEditing ? 'Editar Proyecto' : project.name}
                    </Heading>
                </div>
                {!isEditing && (
                    <Text size="base" className="dashboard-subtitle">
                        {project.code} • <span style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                    </Text>
                )}
            </div>

            <div className={`company-profile-container ${isEditing ? 'max-w-3xl mx-auto' : ''}`}>
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
                            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/5">
                                {/* Work Modules (Left) */}
                                <TabsList variant="underline" className="w-full md:w-auto">
                                    {!(role === 'admin' && activeTab === 'team') && (
                                        <>
                                            <TabsTrigger variant="underline" value="engineering">Ingeniería</TabsTrigger>
                                            <TabsTrigger variant="underline" value="procurement">Abastecimiento</TabsTrigger>
                                        </>
                                    )}
                                </TabsList>

                                {/* Management (Right) */}
                                <TabsList variant="underline" className="w-full md:w-auto justify-end">
                                    {(role === 'founder' || activeTab === 'details') && (
                                        <TabsTrigger variant="underline" value="details">Detalles</TabsTrigger>
                                    )}
                                    {(role === 'founder' || activeTab === 'team') && (
                                        <TabsTrigger variant="underline" value="team">Equipo & Invitaciones</TabsTrigger>
                                    )}
                                    {(role === 'founder') && (
                                        <TabsTrigger variant="underline" value="settings">Configuración</TabsTrigger>
                                    )}
                                </TabsList>
                            </div>
                        )}

                        <TabsContent value="details">
                            <div className="fade-in p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    <div>
                                        <Text size="xs" variant="muted" className="mb-2 uppercase font-semibold tracking-wider">
                                            Cliente
                                        </Text>
                                        <Text size="lg" className="font-medium">
                                            {project.client_name || <span className="text-slate-500 italic">No especificado</span>}
                                        </Text>
                                    </div>

                                    <div>
                                        <Text size="xs" variant="muted" className="mb-2 uppercase font-semibold tracking-wider">
                                            Contrato
                                        </Text>
                                        <Text size="lg" className="font-medium font-mono">
                                            {project.contract_number || <span className="text-slate-500 italic font-sans">No especificado</span>}
                                        </Text>
                                    </div>

                                    <div>
                                        <Text size="xs" variant="muted" className="mb-2 uppercase font-semibold tracking-wider">
                                            Descripción
                                        </Text>
                                        <Text className="leading-relaxed">
                                            {project.description || <span className="text-slate-500 italic">Sin descripción</span>}
                                        </Text>
                                    </div>
                                </div>

                                {canEdit && (
                                    <div className="flex gap-4 pt-8 border-t border-white/5">
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            variant="secondary"
                                            className="gap-2"
                                        >
                                            <Icons.Edit size={18} />
                                            Editar Proyecto
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="team">
                            <div className="fade-in">
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
                            </div>
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
                                    <div className="settings-grid">
                                        <div
                                            onClick={() => setSettingsView('locations')}
                                            className="settings-card settings-card--locations group"
                                        >
                                            <div className="settings-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current stroke-2">
                                                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <Heading level={3} size="lg" className="mb-2">Ubicaciones</Heading>
                                            <Text variant="muted" size="sm">
                                                Gestiona bodegas, talleres, áreas de acopio y sitios de montaje.
                                            </Text>
                                        </div>

                                        <div
                                            onClick={() => setSettingsView('weld-types')}
                                            className="settings-card settings-card--weld group"
                                        >
                                            <div className="settings-icon">
                                                🔥
                                            </div>
                                            <Heading level={3} size="lg" className="mb-2">Tipos de Unión</Heading>
                                            <Text variant="muted" size="sm">
                                                Marca las excepciones que NO requieren soldador.
                                            </Text>
                                        </div>

                                        <div
                                            onClick={() => setIsWeekConfigOpen(true)}
                                            className="settings-card settings-card--week group"
                                        >
                                            <div className="settings-icon">
                                                <Calendar size={24} />
                                            </div>
                                            <Heading level={3} size="lg" className="mb-2">Configuración de Semanas</Heading>
                                            <Text variant="muted" size="sm">
                                                Define la fecha de inicio del proyecto y el ciclo semanal.
                                            </Text>
                                        </div>

                                        <div
                                            onClick={() => setSettingsView('logo')}
                                            className="settings-card settings-card--logo group"
                                        >
                                            <div className="settings-icon">
                                                <ImageIcon size={24} />
                                            </div>
                                            <Heading level={3} size="lg" className="mb-2">Logo del Proyecto</Heading>
                                            <Text variant="muted" size="sm">
                                                Sube el logo del proyecto para incluirlo en reportes PDF.
                                            </Text>
                                        </div>

                                        <div
                                            onClick={() => setSettingsView('structure-models')}
                                            className="settings-card settings-card--bim group"
                                        >
                                            <div className="settings-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                                </svg>
                                            </div>
                                            <Heading level={3} size="lg" className="mb-2">Modelos Estructurales (BIM)</Heading>
                                            <Text variant="muted" size="sm">
                                                Carga modelos 3D de contexto.
                                            </Text>
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
