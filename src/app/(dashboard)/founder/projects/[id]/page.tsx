'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProjectById, updateProject, deleteProject, type Project } from '@/services/projects'
import { ArrowLeft, Building2, Calendar, FileText, Check, X, Shield, Users, Trash2 } from 'lucide-react'
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
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    // Edit form state
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
        }
        setIsLoading(false)
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

        // 1. Attempt standard delete
        const result = await deleteProject(projectId)

        if (result.success) {
            router.push('/founder/projects')
        } else if (result.requiresForce) {
            // 2. Ask for Force Delete
            const confirmSpy = window.confirm(
                `⚠️ EXTINCIÓN TOTAL DETECTADA\n\n` +
                `Este proyecto tiene ${result.memberCount} usuarios activos asignados.\n` +
                `Si eliminas el proyecto, estos usuarios serán BORRADOS TOTALMENTE del sistema (Auth + Datos).\n\n` +
                `¿Confirmas la ELIMINACIÓN MASIVA de usuarios y proyecto?`
            )

            if (confirmSpy) {
                const deepResult = await deleteProject(projectId, true) // Force = true
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
            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => router.push('/founder/projects')}
                        className="action-button"
                        style={{ padding: '0.5rem', width: 'auto' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="dashboard-header-content">
                        <div className="dashboard-accent-line" />
                        <h1 className="dashboard-title">
                            {isEditing ? 'Editar Proyecto' : project.name}
                        </h1>
                    </div>
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
                    <div style={{ padding: '1rem' }}>
                        {/* Info Grid */}
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

                        {/* Actions */}
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
            </div>
        </div>
    )
}
