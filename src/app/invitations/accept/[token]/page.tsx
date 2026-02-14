'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateInvitationToken, acceptInvitation } from '@/services/invitations'
import { createBrowserClient } from '@supabase/ssr'
import { UserPlus, X } from 'lucide-react'
// Styles migrated to Tailwind v4 immutablyhandled

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState(false)
    const [invitation, setInvitation] = useState<any>(null)
    const [userExists, setUserExists] = useState(false)
    const [error, setError] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Debug checks
    useEffect(() => {
        console.log('🔗 Supabase Config Check:', {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
            keyFirst20: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
        })
    }, [])

    useEffect(() => {
        checkAuthAndValidate()
    }, [])

    async function checkAuthAndValidate() {
        // Use getSession() to check current session
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        setIsAuthenticated(!!user)
        if (user?.email) setCurrentUserEmail(user.email)

        const result = await validateInvitationToken(resolvedParams.token)

        if (result.success && result.data) {
            setInvitation(result.data)

            // If user is already authenticated with the correct email, auto-accept
            if (user && user.email && user.email.toLowerCase() === result.data.email.toLowerCase()) {
                console.log('✅ Usuario autenticado con email correcto, auto-aceptando...')
                await handleAccept() // Use existing accept flow
                return
            }

            // CHECK IF USER EXISTS IN AUTH (even if not logged in)
            if (!user) {
                const { checkUserExists } = await import('@/actions/auth-actions')
                const check = await checkUserExists(result.data.email)
                if (check.exists) {
                    console.log('ℹ️ El usuario ya está registrado en Auth. Mostrando flow de Login.')
                    setUserExists(true)
                }
            }
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

        // User not authenticated - need to CREATE or LOGIN
        if (!isAuthenticated) {

            // Login Mode
            if (userExists) {
                setAccepting(true)
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: invitation.email,
                    password: password,
                })

                if (signInError) {
                    setError('Error al iniciar sesión: ' + signInError.message)
                    setAccepting(false)
                    return
                }
                // If success, we fall through to "Accept Invitation" logic below
            }
            // Create Mode
            else {
                if (password.length < 6) {
                    setError('La contraseña debe tener al menos 6 caracteres')
                    return
                }

                if (password !== confirmPassword) {
                    setError('Las contraseñas no coinciden')
                    return
                }

                setAccepting(true)

                // Create user using Admin API (no need to hash password)
                const { createUserBackend } = await import('@/actions/auth-actions')

                console.log('Calling Admin API to create user...')
                const signUpResult = await createUserBackend(
                    invitation.email,
                    password,  // Plain password - Admin API will hash it
                    invitation.email.split('@')[0]  // Use email prefix as name
                )

                if (!signUpResult.success) {
                    console.error('❌ SignUp Error (Backend):', signUpResult.error)
                    // Fallback: If for some reason checking failed but creation says exists
                    if (signUpResult.error && (
                        signUpResult.error.includes('already exists') ||
                        signUpResult.error.includes('duplicate') ||
                        signUpResult.error.includes('already been registered')
                    )) {
                        setError('Esta cuenta ya existe. Por favor, ingresa tu contraseña para acceder.')
                        setUserExists(true) // Switch UI to login
                        setAccepting(false)
                        return
                    } else {
                        setError('Error al crear cuenta: ' + signUpResult.error)
                        setAccepting(false)
                        return
                    }
                }

                // Login immediately using the password
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: invitation.email,
                    password: password,
                })

                if (signInError) {
                    setError('Cuenta creada, pero error al iniciar sesión: ' + signInError.message)
                    setAccepting(false)
                    return
                }
            }
        }

        // 2. Accept invitation (User is now authenticated or was already) (OR just finished creating/logging in)
        const result = await acceptInvitation(resolvedParams.token)

        if (result.success) {
            console.log('✅ Invitación aceptada exitosamente')
            alert('¡Invitación aceptada correctamente! Bienvenido a LukeAPP.')
            router.push('/') // Let middleware handle routing
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
                        {userExists ? (
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                <p style={{ fontSize: '0.875rem', color: '#60a5fa', textAlign: 'center', marginBottom: 0 }}>
                                    ¡Hola de nuevo! Esta cuenta ya existe.
                                    <br />
                                    <strong>Ingresa tu contraseña para aceptar la invitación.</strong>
                                </p>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                                Crea tu contraseña para activar tu cuenta
                            </p>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                placeholder={userExists ? "Tu contraseña actual" : "Mínimo 6 caracteres"}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {!userExists && (
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
                        )}
                    </div>
                )}

                {error && (
                    <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.875rem', marginTop: '1rem' }}>
                        {error}
                        {error.includes('credentials') && (
                            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                <a href="/forgot-password" style={{ color: '#f87171', textDecoration: 'underline', fontSize: '0.8rem' }}>
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        )}
                    </div>
                )}

                <div className="accept-invitation-actions" style={{ marginTop: '1.5rem' }}>
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="accept-button"
                    >
                        {accepting ? 'Procesando...' : (isAuthenticated ? 'Aceptar Invitación' : (userExists ? 'Iniciar Sesión y Aceptar' : 'Crear Cuenta y Aceptar'))}
                    </button>
                    {!isAuthenticated && (
                        <div style={{ marginTop: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => router.push('/')}
                                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {userExists ? 'Volver al Inicio' : 'Ya tengo una cuenta, iniciar sesión'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
