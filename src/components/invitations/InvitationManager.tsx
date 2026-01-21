'use client'

import { useState, useEffect } from 'react'
import { Copy, Mail, MessageCircle, Trash2, UserPlus, Shield } from 'lucide-react'
import { Project, CompanyRole } from '@/types'
import { Invitation } from '@/services/invitations'
import { getCompanyRoles } from '@/services/roles'
import Confetti from '@/components/onboarding/Confetti'
import Toast from '@/components/onboarding/Toast'
import { CELEBRATION_MESSAGES } from '@/config/onboarding-messages'

interface InvitationManagerProps {
    companyId: string  // Required to fetch functional roles
    projects?: Project[]
    invitations: Invitation[]
    companyName?: string
    requireProject?: boolean
    fixedProjectId?: string // NEW: Lock to specific project
    roleOptions?: { value: string; label: string; description: string }[]
    onInvite: (data: {
        email: string
        project_id?: string
        role_id: string
        functional_role_id?: string
        job_title: string
    }) => Promise<{ success: boolean; message?: string; data?: { link: string } }>
    onRevoke: (id: string) => Promise<void>
}

export default function InvitationManager({
    companyId,
    projects = [],
    invitations,
    companyName,
    requireProject = true,
    fixedProjectId, // NEW
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

    // Functional Roles State
    const [functionalRoles, setFunctionalRoles] = useState<CompanyRole[]>([])
    const [loadingRoles, setLoadingRoles] = useState(true)

    // Celebration state
    const [showConfetti, setShowConfetti] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        project_id: fixedProjectId || '', // Initialize with fixed ID if present
        role_id: roleOptions[0].value,
        functional_role_id: '',
        job_title: ''
    })

    // Update form if fixedProjectId changes
    useEffect(() => {
        if (fixedProjectId) {
            setFormData(prev => ({ ...prev, project_id: fixedProjectId }))
        }
    }, [fixedProjectId])

    // Fetch functional roles on mount
    useEffect(() => {
        async function loadFunctionalRoles() {
            setLoadingRoles(true)
            const result = await getCompanyRoles(companyId)
            if (result.success && result.data) {
                // Filter roles to only show those with base_role matching allowed system roles
                const allowedBaseRoles = roleOptions.map(r => r.value)
                const filteredRoles = result.data.filter(role =>
                    allowedBaseRoles.includes(role.base_role)
                )
                setFunctionalRoles(filteredRoles)
            }
            setLoadingRoles(false)
        }
        loadFunctionalRoles()
    }, [companyId, roleOptions])

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
                project_id: formData.project_id || undefined,
                functional_role_id: formData.functional_role_id || undefined,  // NEW
                job_title: formData.job_title
            })

            if (result.success && result.data) {
                setSuccess(true)
                setInvitationLink(result.data.link)
                setFormData(prev => ({ ...prev, email: '', job_title: '' }))

                setFormData(prev => ({ ...prev, email: '', job_title: '' }))

                // Trigger celebration ONLY for the first invitation (Task Complete)
                if (invitations.length === 0) {
                    setShowConfetti(true)
                    setToastMessage(CELEBRATION_MESSAGES.invitations)
                    setTimeout(() => setShowConfetti(false), 5000)
                } else {
                    // Quiet success for subsequent
                    setToastMessage('Invitación enviada correctamente')
                }

                window.dispatchEvent(new Event('onboarding-updated'))

                // Hide confetti after animation
                setTimeout(() => setShowConfetti(false), 5000)
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

    const waMessage = (() => {
        const contextName = fixedProjectId
            ? projects.find(p => p.id === fixedProjectId)?.name
            : (formData.project_id
                ? projects.find(p => p.id === formData.project_id)?.name
                : companyName || 'nuestro equipo')

        return `🚀 Hola! Te estoy invitando a colaborar en *${contextName}* usando LukeAPP.\n\nPara aceptar la invitación y crear tu cuenta, entra aquí:\n👉 ${invitationLink}`
    })()

    const waLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`

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
                        <UserPlus size={20} style={{ color: '#c084fc' }} />
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
                                href={waLink}
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

                        {/* 1. Email (First Step) */}
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

                        {/* 2. Functional Role Selector (Main Decision) */}
                        <div className="form-field">
                            <label className="form-label">
                                Rol Funcional
                                <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '0.5rem' }}>- Define qué hará el usuario</span>
                            </label>
                            {loadingRoles ? (
                                <div className="form-input disabled" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                    Cargando roles...
                                </div>
                            ) : functionalRoles.length > 0 ? (
                                <select
                                    value={formData.functional_role_id}
                                    onChange={(e) => {
                                        const selectedRoleId = e.target.value
                                        const selectedRole = functionalRoles.find(r => r.id === selectedRoleId)

                                        if (selectedRole) {
                                            // Auto-fill System Role and Job Title based on Functional Role
                                            setFormData({
                                                ...formData,
                                                functional_role_id: selectedRoleId,
                                                role_id: selectedRole.base_role, // AUTO-SELECT SYSTEM ROLE
                                                job_title: selectedRole.name     // AUTO-FILL JOB TITLE
                                            })
                                        } else {
                                            // Reset if "No Functional Role" selected
                                            setFormData({
                                                ...formData,
                                                functional_role_id: '',
                                                job_title: ''
                                            })
                                        }
                                    }}
                                    className="form-select"
                                >
                                    <option value="">Seleccionar un rol de la lista...</option>
                                    {functionalRoles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                    <option value="" style={{ color: '#fbbf24' }}>-- Otro / Personalizado --</option>
                                </select>
                            ) : (
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'rgba(234, 179, 8, 0.1)',
                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                    borderRadius: '0.5rem',
                                    color: '#fbbf24',
                                    fontSize: '0.875rem'
                                }}>
                                    No hay roles funcionales definidos.
                                </div>
                            )}

                            {/* Show selected functional role preview color */}
                            {formData.functional_role_id && (() => {
                                const selected = functionalRoles.find(r => r.id === formData.functional_role_id)
                                if (!selected) return null

                                return (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.8rem',
                                        color: selected.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: selected.color }} />
                                        {selected.description}
                                    </div>
                                )
                            })()}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* 3. System Role (Auto-filled but visible) */}
                            <div className="form-field">
                                <label className="form-label">Permisos de Sistema</label>
                                {functionalRoles.length > 0 && formData.functional_role_id ? (
                                    // READ ONLY MODE (Locked by Functional Role)
                                    <div className="form-input disabled" style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        {roleOptions.find(r => r.value === formData.role_id)?.label}
                                        <Shield size={14} />
                                    </div>
                                ) : (
                                    // MANUAL MODE (If no functional role selected)
                                    <select
                                        value={formData.role_id}
                                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                        className="form-select"
                                    >
                                        {roleOptions.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* 4. Job Title (Editable) */}
                            <div className="form-field">
                                <label className="form-label">Cargo / Título</label>
                                <input
                                    type="text"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    className="form-input"
                                    placeholder="Ej: Jefe de Area"
                                />
                            </div>
                        </div>

                        {/* 5. Project (Last Step - Context) */}
                        {requireProject && (
                            <div className="form-field">
                                <label className="form-label">Proyecto Asignado</label>
                                {fixedProjectId ? (
                                    <div className="form-input disabled" style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        {projects.find(p => p.id === fixedProjectId)?.name || 'Proyecto Actual'}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                                            <Shield size={14} />
                                            Bloqueado por Contexto
                                        </div>
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} className="form-button" style={{ width: '100%', marginTop: '1rem' }}>
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
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(168, 85, 247, 0.1)',
                                                    color: '#c084fc',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                                    textTransform: 'uppercase',
                                                    width: 'fit-content'
                                                }}>
                                                    {roleOptions.find(r => r.value === inv.role_id)?.label || inv.role_id}
                                                </span>
                                                {/* Show Project Code if not in project context (optional, but good context) */}
                                                {!requireProject && (inv as any).project && (
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                                                        {(inv as any).project.code}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Show Job Title if available */}
                                            {/* We need to update Invitation interface to include job_title to show it here properly, but for now just showing basic role tag */}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={async () => {
                                                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                                                        const link = `${baseUrl}/invitations/accept/${inv.token}`
                                                        await navigator.clipboard.writeText(link)
                                                        alert('Link copiado al portapapeles')
                                                    }}
                                                    className="action-button"
                                                    title="Copiar link de invitación"
                                                    style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onRevoke(inv.id)}
                                                    className="action-button btn-danger"
                                                    title="Revocar invitación"
                                                    style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Celebration Components */}
            <Confetti show={showConfetti} />
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setToastMessage(null)}
                />
            )}
        </div >
    )
}
