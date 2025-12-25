'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateInvitationToken, acceptInvitation } from '@/services/invitations'
import { createBrowserClient } from '@supabase/ssr'
import { UserPlus } from 'lucide-react'
import '@/styles/invitations.css'

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState(false)
    const [invitation, setInvitation] = useState<any>(null)
    const [error, setError] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        checkAuthAndValidate()
    }, [])

    async function checkAuthAndValidate() {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)

        const result = await validateInvitationToken(resolvedParams.token)

        if (result.success && result.data) {
            setInvitation(result.data)
        } else {
            setError(result.message)
        }

        setLoading(false)
    }

    async function handleAccept() {
        setError('')

        // User not authenticated - need to create account first
        if (!isAuthenticated) {
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres')
                return
            }

            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden')
                return
            }

            setAccepting(true)

            // 1. Create auth user
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: invitation.email,
                password: password,
            })

            if (signUpError) {
                setError(signUpError.message)
                setAccepting(false)
                return
            }

            // 2. Accept invitation (creates member)
            const result = await acceptInvitation(resolvedParams.token)

            if (result.success) {
                alert('¡Cuenta creada e invitación aceptada! Redirigiendo...')
                router.push('/founder')
            } else {
                setError('Cuenta creada pero error al aceptar invitación: ' + result.message)
                setAccepting(false)
            }
        } else {
            // User already authenticated - just accept
            setAccepting(true)
            const result = await acceptInvitation(resolvedParams.token)

            if (result.success) {
                alert('¡Invitación aceptada! Redirigiendo...')
                router.push('/founder')
            } else {
                setError(result.message)
                setAccepting(false)
            }
        }
    }

    if (loading) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <p style={{ color: 'white' }}>Validando invitación...</p>
                </div>
            </div>
        )
    }

    if (error && !invitation) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <div className="accept-invitation-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        <span style={{ fontSize: '2rem' }}>❌</span>
                    </div>
                    <h1 className="accept-invitation-title">Invitación Inválida</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                        {error}
                    </p>
                    <button onClick={() => router.push('/')} className="accept-button">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="accept-invitation-container">
            <div className="accept-invitation-card">
                <div className="accept-invitation-icon">
                    <UserPlus size={32} color="#60a5fa" />
                </div>

                <h1 className="accept-invitation-title">Has sido invitado</h1>
                <p className="accept-invitation-company">{invitation?.company?.name || 'LukeAPP'}</p>

                <div className="accept-invitation-details">
                    <div className="accept-invitation-detail">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{invitation?.email}</span>
                    </div>
                    <div className="accept-invitation-detail">
                        <span className="detail-label">Rol:</span>
                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                            {invitation?.role_id}
                        </span>
                    </div>
                    {invitation?.project && (
                        <div className="accept-invitation-detail">
                            <span className="detail-label">Proyecto:</span>
                            <span className="detail-value">{invitation.project.name}</span>
                        </div>
                    )}
                </div>

                {/* Password form for non-authenticated users */}
                {!isAuthenticated && (
                    <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                            Crea tu contraseña para activar tu cuenta
                        </p>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="Mínimo 6 caracteres"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="form-input"
                                placeholder="Repite tu contraseña"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.875rem', marginTop: '1rem' }}>
                        {error}
                    </div>
                )}

                <div className="accept-invitation-actions" style={{ marginTop: '1.5rem' }}>
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="accept-button"
                    >
                        {accepting ? 'Procesando...' : (isAuthenticated ? 'Aceptar Invitación' : 'Crear Cuenta y Aceptar')}
                    </button>
                    <button onClick={() => router.push('/')} className="decline-button">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}
