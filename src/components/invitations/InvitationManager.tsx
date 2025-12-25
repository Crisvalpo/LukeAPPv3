'use client'

import { useState } from 'react'
import { Copy, Mail, MessageCircle, Trash2, UserPlus, Shield } from 'lucide-react'
import { Project } from '@/types'
import { Invitation } from '@/services/invitations'

interface InvitationManagerProps {
    projects?: Project[]
    invitations: Invitation[]
    companyName?: string
    requireProject?: boolean
    roleOptions?: { value: string; label: string; description: string }[]
    onInvite: (data: { email: string; project_id?: string; role_id: string }) => Promise<{ success: boolean; message?: string; data?: { link: string } }>
    onRevoke: (id: string) => Promise<void>
}

export default function InvitationManager({
    projects = [],
    invitations,
    companyName,
    requireProject = true,
    roleOptions = [
        { value: 'admin', label: 'Administrador de Proyecto', description: 'Gestión total de spools, personal y reportes.' }
    ],
    onInvite,
    onRevoke
}: InvitationManagerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [invitationLink, setInvitationLink] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        project_id: '',
        role_id: roleOptions[0].value
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (requireProject && !formData.project_id) {
            setError('Debes seleccionar un proyecto')
            return
        }

        setIsSubmitting(true)
        setError('')
        setSuccess(false)

        try {
            const result = await onInvite({
                email: formData.email,
                role_id: formData.role_id,
                // Only send project_id if it's required or selected
                project_id: formData.project_id || undefined
            })

            if (result.success && result.data) {
                setSuccess(true)
                setInvitationLink(result.data.link)
                setFormData(prev => ({ ...prev, email: '' }))
            } else {
                setError(result.message || 'Error al crear invitación')
            }
        } catch (err) {
            setError('Error inesperado al procesar la solicitud')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function copyToClipboard() {
        await navigator.clipboard.writeText(invitationLink)
        alert('Link copiado al portapapeles')
    }

    return (
        <div className="invitations-split-view" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
        }}>
            {/* LEFT COLUMN: FORM */}
            <div className="company-form-container">
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={20} className="kpi-icon purple" />
                        Nueva Invitación
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {requireProject
                            ? 'Genera un acceso seguro para un nuevo administrador.'
                            : 'Genera un acceso para un nuevo miembro de la empresa.'}
                    </p>
                </div>

                {success && invitationLink ? (
                    <div className="invitation-success">
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#34d399', marginBottom: '0.5rem' }}>
                            ✅ Invitación Creada
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6ee7b7', marginBottom: '0.5rem' }}>
                            Comparte este enlace con el usuario:
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                readOnly
                                value={invitationLink}
                                className="form-input"
                                style={{ fontFamily: 'monospace', color: '#34d399', borderColor: '#34d399' }}
                            />
                            <button onClick={copyToClipboard} className="action-button" style={{ color: 'white', background: '#10b981' }}>
                                <Copy size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Te invito a unirte a ${companyName || 'nuestro equipo'}.\n\nRegistrate aquí:\n${invitationLink}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="form-button"
                                style={{ background: '#25D366', fontSize: '0.875rem', padding: '0.5rem' }}
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </a>
                            <a
                                href={`mailto:?subject=${encodeURIComponent('Invitación a LukeAPP')}&body=${encodeURIComponent(`Hola,\n\nTe han invitado a unirte.\n\nPuedes registrarte aquí:\n${invitationLink}`)}`}
                                className="form-button"
                                style={{ background: '#4b5563', fontSize: '0.875rem', padding: '0.5rem' }}
                            >
                                <Mail size={16} /> Email
                            </a>
                        </div>

                        <button
                            onClick={() => { setSuccess(false); setInvitationLink('') }}
                            className="action-button"
                            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                        >
                            Crear otra invitación
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="company-form">
                        {error && (
                            <div className="error-alert" style={{ marginBottom: '1rem' }}>{error}</div>
                        )}

                        {requireProject && (
                            <div className="form-field">
                                <label className="form-label">Proyecto Destino</label>
                                <select
                                    required={requireProject}
                                    value={formData.project_id}
                                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="">Seleccionar proyecto...</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-field">
                            <label className="form-label">Email del Usuario</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="form-input"
                                placeholder="usuario@empresa.com"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Rol Asignado</label>
                            {roleOptions.length > 1 ? (
                                <select
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                    className="form-select"
                                    style={{ marginBottom: '0.5rem' }}
                                >
                                    {roleOptions.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            ) : null}

                            {/* Role Description Card */}
                            {(() => {
                                const selectedRole = roleOptions.find(r => r.value === formData.role_id) || roleOptions[0]
                                return (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(34, 197, 94, 0.05)',
                                        border: '1px solid rgba(34, 197, 94, 0.2)',
                                        borderRadius: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <Shield size={20} color="#4ade80" />
                                        <div>
                                            <div style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.9rem' }}>{selectedRole.label}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{selectedRole.description}</div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>

                        <button type="submit" disabled={isSubmitting} className="form-button" style={{ width: '100%', marginTop: '0.5rem' }}>
                            {isSubmitting ? 'Generando...' : 'Generar Link de Invitación'}
                        </button>
                    </form>
                )}
            </div>

            {/* RIGHT COLUMN: LIST */}
            <div className="company-header-card" style={{ padding: '0', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white' }}>
                        Invitaciones Pendientes
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        Usuarios que aún no han aceptado el acceso.
                    </p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                    {invitations.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <Mail size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>No hay invitaciones pendientes</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Rol</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map((inv) => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', color: 'white', fontWeight: '500' }}>
                                            {inv.email}
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '400' }}>
                                                {new Date(inv.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {requireProject ? (
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    color: '#60a5fa',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                                }}>
                                                    {(inv as any).project?.code || 'PROJECT'}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(168, 85, 247, 0.1)',
                                                    color: '#c084fc',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {inv.role_id}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => onRevoke(inv.id)}
                                                className="action-button delete"
                                                title="Revocar invitación"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
