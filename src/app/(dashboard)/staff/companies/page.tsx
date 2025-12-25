'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCompanies, createCompany, type Company } from '@/services/companies'
import { Building2 } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

export default function CompaniesPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])

    const [formData, setFormData] = useState({
        name: '',
        slug: ''
    })

    useEffect(() => {
        loadCompanies()
    }, [])

    async function loadCompanies() {
        setLoading(true)
        const data = await getAllCompanies()
        setCompanies(data)
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        const result = await createCompany(formData)

        if (result.success) {
            setSuccess(true)
            setFormData({ name: '', slug: '' })
            loadCompanies()
        } else {
            setError(result.message)
        }

        setSubmitting(false)
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

    return (
        <div className="dashboard-page companies-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Gestión de Empresas</h1>
                </div>
                <p className="dashboard-subtitle">Administra las empresas que utilizan la plataforma</p>
            </div>

            {/* Form Section */}
            <div className="company-form-container">
                <div className="company-form-header">
                    <h2 className="company-form-title">Nueva Empresa</h2>
                    <p className="company-form-description">Registra una nueva empresa en el sistema</p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="company-success">
                        <h3 className="company-success-title">✅ Empresa creada exitosamente</h3>
                        <p className="company-success-text">Ahora puedes invitar founders para esta empresa</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="company-form">
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <div className="company-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                        <div className="form-field">
                            <label htmlFor="name" className="form-label">
                                Nombre de la Empresa *
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="form-input"
                                placeholder="Minera Candelaria"
                            />
                            <span className="form-hint">Nombre oficial de la empresa</span>
                        </div>

                        <div className="form-field">
                            <label htmlFor="slug" className="form-label">
                                Slug (URL) *
                            </label>
                            <input
                                id="slug"
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="form-input"
                                placeholder="minera-candelaria"
                            />
                            <span className="form-hint">Se genera automáticamente del nombre</span>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting} className="form-button">
                        {submitting ? (
                            <span className="form-button-loading">
                                <span>Creando...</span>
                            </span>
                        ) : (
                            '🏢 Crear Empresa'
                        )}
                    </button>
                </form>
            </div>

            {/* Companies List */}
            <div className="companies-list-container">
                <div className="companies-list-header">
                    <h2 className="companies-list-title">Empresas Registradas</h2>
                </div>

                {companies.length === 0 ? (
                    <div className="companies-empty">
                        <p className="companies-empty-text">No hay empresas registradas</p>
                    </div>
                ) : (
                    <div className="companies-table-wrapper">
                        <table className="companies-table">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>Slug</th>
                                    <th>Fecha Registro</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr key={company.id}>
                                        <td className="company-name">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <Building2 size={20} color="#60a5fa" />
                                                {company.name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="company-slug">{company.slug}</span>
                                        </td>
                                        <td className="company-date">
                                            {new Date(company.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="company-actions">
                                                <button
                                                    onClick={() => router.push(`/staff/companies/${company.id}`)}
                                                    className="action-button"
                                                    title="Ver detalles"
                                                >
                                                    👁️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
