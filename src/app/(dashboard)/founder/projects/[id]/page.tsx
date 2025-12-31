'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectById, updateProject, deleteProject, type Project } from '@/services/projects'
import { getPendingInvitations, createInvitation, revokeInvitation, type Invitation } from '@/services/invitations'
import { Building2, Calendar, FileText, Check, X, Shield, Users, Trash2 } from 'lucide-react'
import InvitationManager from '@/components/invitations/InvitationManager'
import EngineeringManager from '@/components/engineering/EngineeringManager'
import ProcurementManager from '@/components/procurement/ProcurementManager'
import ProjectLocationsManager from '@/components/projects/ProjectLocationsManager'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

interface ProjectDetails extends Project {
    contract_number?: string
    client_name?: string
}

export default function ProjectDetailPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [project, setProject] = useState<ProjectDetails | null>(null)
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [activeTab, setActiveTab] = useState<'details' | 'team' | 'engineering' | 'procurement' | 'settings'>('details')
    const [settingsView, setSettingsView] = useState<'menu' | 'locations'>('menu')

    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        client_name: '',
        contract_number: '',
        status: ''
    })

    useEffect(() => {
        loadProject()
    }, [projectId])

    async function loadProject() {
        if (!projectId) return

        const data = await getProjectById(projectId)
        if (data) {
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

    async function handleSave() {
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
            setIsEditing(false)
        } else {
            setError(result.message)
        }

        setIsSaving(false)
    }

    async function handleDelete() {
        if (!window.confirm('¿Estás seguro de eliminar este proyecto?')) {
            return
        }

        setIsSaving(true)

        const result = await deleteProject(projectId)

        if (result.success) {
            router.push('/founder/projects')
        } else if (result.requiresForce) {
            const confirmSpy = window.confirm(
                `⚠️ EXTINCIÓN TOTAL DETECTADA\n\n` +
                `Este proyecto tiene ${result.memberCount} usuarios activos asignados.\n` +
                `Si eliminas el proyecto, estos usuarios serán BORRADOS TOTALMENTE del sistema (Auth + Datos).\n\n` +
                `¿Confirmas la ELIMINACIÓN MASIVA de usuarios y proyecto?`
            )

            if (confirmSpy) {
                const deepResult = await deleteProject(projectId, true)
                if (deepResult.success) {
                    alert('Proyecto y todos sus usuarios han sido eliminados.')
                    router.push('/founder/projects')
                } else {
                    alert('Error en borrado profundo: ' + deepResult.message)
                    setIsSaving(false)
                }
            } else {
                setIsSaving(false)
            }
        } else {
            alert(result.message)
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p></div>
    }

    if (!project) {
        return <div className="dashboard-page"><p style={{ color: 'white', textAlign: 'center' }}>Proyecto no encontrado</p></div>
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">
                        {isEditing ? 'Editar Proyecto' : project.name}
                    </h1>
                </div>
                {!isEditing && (
                    <p className="dashboard-subtitle">
                        {project.code} • <span style={{ textTransform: 'capitalize' }}>{project.status.replace('_', ' ')}</span>
                    </p>
                )}
            </div>

            <div className="company-form-container">
                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {isEditing ? (
                    <div className="company-form" style={{ width: '100%' }}>
                        <div className="company-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                            <div className="form-field">
                                <label className="form-label">Nombre del Proyecto</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="form-input"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-field">
                                    <label className="form-label">Cliente Principal</label>
                                    <input
                                        type="text"
                                        value={editForm.client_name}
                                        onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">N° Contrato</label>
                                    <input
                                        type="text"
                                        value={editForm.contract_number}
                                        onChange={(e) => setEditForm({ ...editForm, contract_number: e.target.value })}
                                        className="form-input"
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="form-input"
                                    rows={4}
                                />
                            </div>

                            <div className="form-field">
                                <label className="form-label">Estado</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="planning">Planificación</option>
                                    <option value="active">Activo</option>
                                    <option value="on_hold">En Pausa</option>
                                    <option value="completed">Completado</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={handleSave} className="form-button" disabled={isSaving}>
                                Guardar Cambios
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="form-button"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
                            <button
                                onClick={() => setActiveTab('details')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'details' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'details' ? 'white' : '#94a3b8',
                                    fontWeight: activeTab === 'details' ? 600 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Detalles
                            </button>
                            <button
                                onClick={() => setActiveTab('team')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'team' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'team' ? 'white' : '#94a3b8',
                                    fontWeight: activeTab === 'team' ? 600 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Equipo & Invitaciones
                            </button>
                            <button
                                onClick={() => setActiveTab('engineering')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'engineering' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'engineering' ? 'white' : '#94a3b8',
                                    fontWeight: activeTab === 'engineering' ? 600 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Ingeniería
                            </button>
                            <button
                                onClick={() => setActiveTab('procurement')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'procurement' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'procurement' ? 'white' : '#94a3b8',
                                    fontWeight: activeTab === 'procurement' ? 600 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Abastecimiento
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'settings' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'settings' ? 'white' : '#94a3b8',
                                    fontWeight: activeTab === 'settings' ? 600 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Configuración
                            </button>
                        </div>

                        {activeTab === 'details' && (
                            <div style={{ padding: '1rem' }} className="fade-in">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                            Cliente
                                        </h3>
                                        <div style={{ fontSize: '1.125rem', color: 'white', fontWeight: '500' }}>
                                            {project.client_name || <span style={{ color: '#475569', fontStyle: 'italic' }}>No especificado</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                            Contrato
                                        </h3>
                                        <div style={{ fontSize: '1.125rem', color: 'white', fontWeight: '500', fontFamily: 'monospace' }}>
                                            {project.contract_number || <span style={{ color: '#475569', fontStyle: 'italic', fontFamily: 'sans-serif' }}>No especificado</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: '600' }}>
                                            Descripción
                                        </h3>
                                        <div style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                            {project.description || <span style={{ color: '#475569', fontStyle: 'italic' }}>Sin descripción</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="action-button"
                                        style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
                                    >
                                        <FileText size={18} />
                                        Editar Proyecto
                                    </button>

                                    <button
                                        onClick={handleDelete}
                                        className="action-button delete"
                                        style={{ width: 'auto', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
                                    >
                                        <Trash2 size={18} />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="fade-in">
                                <InvitationManager
                                    companyId={project.company_id}
                                    companyName="Este Proyecto"
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
                        )}

                        {activeTab === 'engineering' && (
                            <div className="fade-in">
                                <EngineeringManager
                                    projectId={project.id}
                                    companyId={project.company_id}
                                />
                            </div>
                        )}

                        {activeTab === 'procurement' && (
                            <div className="fade-in">
                                <ProcurementManager
                                    projectId={project.id}
                                    companyId={project.company_id}
                                />
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="fade-in" style={{ padding: '1rem' }}>
                                {settingsView === 'menu' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        <div
                                            onClick={() => setSettingsView('locations')}
                                            style={{
                                                background: '#1e293b',
                                                borderRadius: '1rem',
                                                padding: '1.5rem',
                                                border: '1px solid #334155',
                                                cursor: 'pointer',
                                                flex: 1,
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)'
                                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                                e.currentTarget.style.borderColor = '#8b5cf6'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none'
                                                e.currentTarget.style.boxShadow = 'none'
                                                e.currentTarget.style.borderColor = '#334155'
                                            }}
                                        >
                                            <div style={{
                                                background: 'rgba(139, 92, 246, 0.2)',
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '1rem'
                                            }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Ubicaciones</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                Gestiona bodegas, talleres, áreas de acopio y sitios de montaje para el control de spools.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <ProjectLocationsManager
                                        projectId={projectId}
                                        onBack={() => setSettingsView('menu')}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    )
}
