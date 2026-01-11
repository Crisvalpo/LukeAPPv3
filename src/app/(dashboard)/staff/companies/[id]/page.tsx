'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanyById, updateCompany, deleteCompanyCascade, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, ArrowLeft, Trash2 } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [company, setCompany] = useState<Company | null>(null)
    const [stats, setStats] = useState({ projects: 0, members: 0 })
    const [isEditing, setIsEditing] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        custom_users_limit: '' as string | number,
        custom_projects_limit: '' as string | number
    })

    useEffect(() => {
        loadCompanyData()
    }, [])

    async function loadCompanyData() {
        setLoading(true)
        const [companyData, statsData] = await Promise.all([
            getCompanyById(resolvedParams.id),
            getCompanyStats(resolvedParams.id)
        ])

        if (companyData) {
            setCompany(companyData)
            setFormData({
                name: companyData.name,
                slug: companyData.slug,
                custom_users_limit: companyData.custom_users_limit ?? '',
                custom_projects_limit: companyData.custom_projects_limit ?? ''
            })
            setStats(statsData)
        }

        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        const updatePayload = {
            ...formData,
            custom_users_limit: formData.custom_users_limit === '' ? null : Number(formData.custom_users_limit),
            custom_projects_limit: formData.custom_projects_limit === '' ? null : Number(formData.custom_projects_limit)
        }

        const result = await updateCompany(resolvedParams.id, updatePayload)

        if (result.success) {
            setSuccess(true)
            setIsEditing(false)
            loadCompanyData()
        } else {
            setError(result.message)
        }

        setSubmitting(false)
    }

    async function handleDelete() {
        if (!confirm(`¿Eliminar "${company?.name}"?\n\nEsta acción intentará eliminar todos los datos de la empresa.\nSolo es posible si la empresa ha estado suspendida por más de 15 días.`)) {
            return
        }

        setDeleting(true)
        setError('')

        const result = await deleteCompanyCascade(resolvedParams.id)

        if (result.success) {
            alert('Empresa eliminada exitosamente')
            router.push('/staff/companies')
        } else {
            alert(result.message)
            setError(result.message)
        }

        setDeleting(false)
    }

    function generateSlug(name: string) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }

    function handleNameChange(name: string) {
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name)
        })
    }

    if (loading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Empresa no encontrada</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page companies-page">
            {/* Header */}
            <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => router.push('/staff/companies')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="dashboard-header-content">
                        <div className="dashboard-accent-line" />
                        <h1 className="dashboard-title">{company.name}</h1>
                    </div>
                </div>
                <p className="dashboard-subtitle">Detalles y configuración de la empresa</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="company-form-container" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <FolderKanban size={32} color="#60a5fa" />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Proyectos
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                {stats.projects}
                                {formData.custom_projects_limit ? <span style={{ fontSize: '1rem', color: '#60a5fa', marginLeft: '0.5rem' }}>/ {formData.custom_projects_limit} (Custom)</span> : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="company-form-container" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Users size={32} color="#4ade80" />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Miembros
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                {stats.members}
                                {formData.custom_users_limit ? <span style={{ fontSize: '1rem', color: '#4ade80', marginLeft: '0.5rem' }}>/ {formData.custom_users_limit} (Custom)</span> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Form */}
            <div className="company-form-container">
                <div className="company-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 className="company-form-title">Información de la Empresa</h2>
                        <p className="company-form-description">
                            {isEditing ? 'Editando detalles de la empresa' : 'Detalles de la empresa'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="action-button"
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                >
                                    ✏️ Editar
                                </button>
                                {/* Ocultar botón eliminar para empresa genesis */}
                                {company.slug !== 'lukeapp-hq' && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="action-button delete"
                                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                        title="Eliminar empresa"
                                    >
                                        {deleting ? '...' : '🗑️ Eliminar'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {success && (
                    <div className="company-success">
                        <h3 className="company-success-title">✅ Cambios guardados</h3>
                        <p className="company-success-text">La información se actualizó correctamente</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="company-form">
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <div className="company-form-grid">
                        <div className="form-field">
                            <label htmlFor="name" className="form-label">
                                Nombre de la Empresa *
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                disabled={!isEditing}
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="form-input"
                                placeholder="Minera Candelaria"
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="slug" className="form-label">
                                Slug (URL) *
                            </label>
                            <input
                                id="slug"
                                type="text"
                                required
                                disabled={!isEditing}
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="form-input"
                                placeholder="minera-candelaria"
                            />
                        </div>
                    </div>

                    {/* Custom Limits Section */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f59e0b', marginBottom: '1rem' }}>⚡ Límites Personalizados (Overrides)</h3>
                        <div className="company-form-grid">
                            <div className="form-field">
                                <label htmlFor="custom_users_limit" className="form-label" style={{ color: '#fbbf24' }}>
                                    Máximo Usuarios
                                </label>
                                <input
                                    id="custom_users_limit"
                                    type="number"
                                    min="0"
                                    disabled={!isEditing}
                                    value={formData.custom_users_limit}
                                    onChange={(e) => setFormData({ ...formData, custom_users_limit: e.target.value })}
                                    className="form-input"
                                    style={{ borderColor: formData.custom_users_limit ? '#f59e0b' : '' }}
                                    placeholder="Dejar vacío para usar límite del plan"
                                />
                                <p className="form-hint">Sobreescribe el límite del Plan</p>
                            </div>

                            <div className="form-field">
                                <label htmlFor="custom_projects_limit" className="form-label" style={{ color: '#fbbf24' }}>
                                    Máximo Proyectos
                                </label>
                                <input
                                    id="custom_projects_limit"
                                    type="number"
                                    min="0"
                                    disabled={!isEditing}
                                    value={formData.custom_projects_limit}
                                    onChange={(e) => setFormData({ ...formData, custom_projects_limit: e.target.value })}
                                    className="form-input"
                                    style={{ borderColor: formData.custom_projects_limit ? '#f59e0b' : '' }}
                                    placeholder="Dejar vacío para usar límite del plan"
                                />
                                <p className="form-hint">Sobreescribe el límite del Plan</p>
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" disabled={submitting} className="form-button">
                                {submitting ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    setFormData({
                                        name: company.name,
                                        slug: company.slug,
                                        custom_users_limit: company.custom_users_limit ?? '',
                                        custom_projects_limit: company.custom_projects_limit ?? ''
                                    })
                                    setError('')
                                }}
                                className="form-button"
                                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}
