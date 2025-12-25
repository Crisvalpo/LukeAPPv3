'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateInvitationToken, acceptInvitation } from '@/services/invitations'
import { createBrowserClient } from '@supabase/ssr'
import { UserPlus, X } from 'lucide-react'
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
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

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
        if (user && user.email) setCurrentUserEmail(user.email)

        const result = await validateInvitationToken(resolvedParams.token)

        if (result.success && result.data) {
            setInvitation(result.data)
        } else {
            setError(result.message)
        }

        setLoading(false)
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        window.location.reload()
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
                options: {
                    data: {
                        full_name: invitation.email.split('@')[0]
                    },
                    // CRITICAL FOR PRODUCTION: Redirect back here after email confirmation
                    emailRedirectTo: window.location.href
                }
            })

            if (signUpError) {
                if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
                    // Try to sign in instead
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: invitation.email,
                        password: password,
                    })

                    if (signInError) {
                        setError('El usuario ya existe pero la contraseña no coincide. Si ya tienes cuenta, inicia sesión primero.')
                        setAccepting(false)
                        return
                    }
                } else {
                    setError('Error al crear cuenta: ' + signUpError.message)
                    setAccepting(false)
                    return
                }
            } else {
                // SignUp successful
                // CASE A: Session created immediately (Dev / No Email Confirm)
                if (authData.session) {
                    // Proceed to accept invitation immediately
                }
                // CASE B: Session null (Production / Email Confirm Required)
                else if (authData.user && !authData.session) {
                    setAccepting(false)
                    alert('✨ Cuenta creada correctamente.\n\nHemos enviado un correo de confirmación. Por favor, revísalo y haz clic en el enlace para activar tu cuenta y completar la invitación.')
                    return
                }
            }

            console.log('Cuenta lista, procesando invitación...')
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        // 2. Accept invitation (User is now authenticated or was already)
        const result = await acceptInvitation(resolvedParams.token)

        if (result.success) {
            // Determine redirect
            const role = invitation.role_id
            let path = '/founder' // default
            if (role === 'admin') path = '/admin/workforce'
            if (role === 'founder') path = '/founder'

            alert('¡Invitación aceptada correctamente! Bienvenido a LukeAPP.')
            router.push(path)
        } else {
            setError(result.message)
            setAccepting(false)
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
                    <div className="accept-invitation-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={32} color="#f87171" strokeWidth={2.5} />
                    </div>
                    <h1 className="accept-invitation-title">Invitación Inválida</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{error}</p>
                    <button onClick={() => router.push('/')} className="accept-button">Volver al Inicio</button>
                </div>
            </div>
        )
    }

    // CHECK EMAIL MISMATCH
    if (isAuthenticated && currentUserEmail && invitation && currentUserEmail.toLowerCase() !== invitation.email.toLowerCase()) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <div className="accept-invitation-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserPlus size={32} color="#fbbf24" strokeWidth={2.5} />
                    </div>
                    <h1 className="accept-invitation-title" style={{ color: '#fbbf24' }}>Conflicto de Sesión</h1>
                    <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', margin: '1.5rem 0' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>La invitación es para:</p>
                        <p style={{ color: 'white', fontWeight: 'bold', marginBottom: '1rem' }}>{invitation.email}</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Estás conectado como:</p>
                        <p style={{ color: 'white', fontWeight: 'bold' }}>{currentUserEmail}</p>
                    </div>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Para aceptar esta invitación, debes cerrar sesión e ingresar con la cuenta correcta.
                    </p>
                    <button onClick={handleLogout} className="accept-button" style={{ background: '#fbbf24', color: 'black' }}>
                        Cerrar Sesión y Continuar
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
                    {!isAuthenticated && (
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <button
                                onClick={() => router.push('/login')}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Ya tengo una cuenta, iniciar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
