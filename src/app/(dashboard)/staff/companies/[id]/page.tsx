'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCompanyById, updateCompany, deleteCompany, getCompanyStats, type Company } from '@/services/companies'
import { Building2, Users, FolderKanban, ArrowLeft, Trash2 } from 'lucide-react'
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
        slug: ''
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
            setFormData({ name: companyData.name, slug: companyData.slug })
            setStats(statsData)
        }

        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        const result = await updateCompany(resolvedParams.id, formData)

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
        if (!confirm(`¿Eliminar "${company?.name}"?\n\nEsta acción no se puede deshacer.`)) {
            return
        }

        setDeleting(true)
        setError('')

        const result = await deleteCompany(resolvedParams.id)

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
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="action-button delete"
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                    title="Eliminar empresa"
                                >
                                    {deleting ? '...' : '🗑️ Eliminar'}
                                </button>
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

                    {isEditing && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" disabled={submitting} className="form-button">
                                {submitting ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    setFormData({ name: company.name, slug: company.slug })
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
