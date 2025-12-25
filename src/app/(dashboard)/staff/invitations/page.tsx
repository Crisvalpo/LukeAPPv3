'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createInvitation, getPendingInvitations, revokeInvitation, generateInvitationLink, type Invitation } from '@/services/invitations'
import { getAllCompanies, type Company } from '@/services/companies'
import { Copy, Mail, MessageCircle, Trash2 } from 'lucide-react'
import '@/styles/invitations.css'

export default function InvitationsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [invitationLink, setInvitationLink] = useState('')
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [companies, setCompanies] = useState<Company[]>([])

    const [formData, setFormData] = useState({
        email: '',
        company_id: '',
        role_id: 'founder' as 'founder' | 'admin'
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const [invitationsData, companiesData] = await Promise.all([
            getPendingInvitations(),
            getAllCompanies()
        ])
        setInvitations(invitationsData)
        setCompanies(companiesData)
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess(false)

        if (!formData.company_id) {
            setError('Debes seleccionar una empresa')
            setSubmitting(false)
            return
        }

        const result = await createInvitation(formData)

        if (result.success && result.data) {
            setSuccess(true)
            setInvitationLink(result.data.link)
            setFormData({ email: '', company_id: '', role_id: 'founder' })
            loadData()
        } else {
            setError(result.message)
        }

        setSubmitting(false)
    }

    async function handleRevoke(id: string) {
        if (!confirm('¿Revocar esta invitación? El link dejará de funcionar.')) return

        const result = await revokeInvitation(id)
        if (result.success) {
            loadData()
        } else {
            alert('Error: ' + result.message)
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(invitationLink)
        alert('¡Link copiado!')
    }

    if (loading) {
        return (
            <div className="dashboard-page">
                <p style={{ color: 'white', textAlign: 'center' }}>Cargando...</p>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-accent-line" />
                    <h1 className="dashboard-title">Invitar Fundadores</h1>
                </div>
                <p className="dashboard-subtitle">Crea invitaciones para que Founders gestionen empresas y proyectos</p>
            </div>

            {/* Form Section */}
            <div className="invitation-form-container">
                <div className="invitation-form-header">
                    <h2 className="invitation-form-title">Nueva Invitación</h2>
                    <p className="invitation-form-description">Genera un link de invitación para un nuevo Founder</p>
                </div>

                {/* Success Message */}
                {success && invitationLink && (
                    <div className="invitation-success">
                        <h3 className="invitation-success-title">✅ Invitación creada exitosamente</h3>
                        <p className="invitation-success-label">Comparte este link:</p>

                        <div className="invitation-link-wrapper">
                            <input
                                type="text"
                                readOnly
                                value={invitationLink}
                                className="invitation-link-input"
                            />
                            <button onClick={copyToClipboard} className="copy-button">
                                <Copy size={16} />
                            </button>
                        </div>

                        <div className="share-actions">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Te invito a LukeAPP.\n\nRegistrate aquí:\n${invitationLink}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="share-button share-button-whatsapp"
                            >
                                <MessageCircle size={18} />
                                WhatsApp
                            </a>
                            <a
                                href={`mailto:?subject=${encodeURIComponent('Invitación a LukeAPP')}&body=${encodeURIComponent(`Hola,\n\nTe han invitado a LukeAPP.\n\nPuedes registrarte aquí:\n${invitationLink}`)}`}
                                className="share-button share-button-email"
                            >
                                <Mail size={18} />
                                Email
                            </a>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="invitation-form">
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <div className="form-field">
                        <label htmlFor="company" className="form-label">
                            Empresa *
                        </label>
                        <select
                            id="company"
                            required
                            value={formData.company_id}
                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                            className="form-select"
                        >
                            <option value="">Seleccionar empresa</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        <span className="form-hint">El founder gestionará proyectos de esta empresa</span>
                    </div>

                    <div className="form-field">
                        <label htmlFor="email" className="form-label">
                            Email del Founder *
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-input"
                            placeholder="founder@company.com"
                        />
                        <span className="form-hint">El usuario recibirá un link de invitación</span>
                    </div>

                    <div className="form-field">
                        <label htmlFor="role" className="form-label">
                            Rol Asignado *
                        </label>
                        <select
                            id="role"
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value as 'founder' | 'admin' })}
                            className="form-select"
                        >
                            <option value="founder">Founder</option>
                            <option value="admin">Admin</option>
                        </select>
                        <span className="form-hint">El usuario tendrá este rol al aceptar</span>
                    </div>

                    <button type="submit" disabled={submitting} className="form-button">
                        {submitting ? (
                            <span className="form-button-loading">
                                <span>Generando...</span>
                            </span>
                        ) : (
                            '📧 Generar Link de Invitación'
                        )}
                    </button>
                </form>
            </div>

            {/* Invitations List */}
            <div className="invitations-list-container">
                <div className="invitations-list-header">
                    <h2 className="invitations-list-title">Invitaciones Pendientes</h2>
                </div>

                {invitations.length === 0 ? (
                    <div className="invitations-empty">
                        <p className="invitations-empty-text">No hay invitaciones pendientes</p>
                    </div>
                ) : (
                    <div className="invitations-table-wrapper">
                        <table className="invitations-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Empresa</th>
                                    <th>Fecha</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="invitation-email">{inv.email}</td>
                                        <td>
                                            <span className="invitation-role-badge">{inv.role_id}</span>
                                        </td>
                                        <td className="invitation-date">{inv.company?.name || 'N/A'}</td>
                                        <td className="invitation-date">
                                            {new Date(inv.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="invitation-actions">
                                                <button
                                                    onClick={() => {
                                                        const link = generateInvitationLink(inv.token)
                                                        navigator.clipboard.writeText(link)
                                                        alert('Link copiado')
                                                    }}
                                                    className="action-button"
                                                    title="Copiar Link"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRevoke(inv.id)}
                                                    className="action-button delete"
                                                    title="Revocar"
                                                >
                                                    <Trash2 size={16} />
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
