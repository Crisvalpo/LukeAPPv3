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

            // 1. Create auth user (BACKEND STRATEGY)
            // We hash the password client-side (or pass plain and hash on server, but bcryptjs is heavy for edge if we used edge functions).
            // Since we are using Server Actions (Node.js), we can pass plain text and let the Action hash it, 
            // OR hash here. The Action expects a hash because the RPC expects a hash.
            // Let's hash in the Server Action to keep client bundle small, 
            // BUT wait, we defined the Action to take a hash? 
            // Let's check the Action definition I just wrote... it takes 'passwordHash'.
            // Actually, let's update the Action to take plain password and hash it there to avoid 'bcryptjs' on client.
            // RE-READING my previous step: I installed bcryptjs in the PROJECT, so it's available.
            // But better to do it on server.
            // Let's assume for a moment I passed plain password to the action and the action hashes it.
            // I will update the action in a second if needed, but for now let's implement the call.

            // Wait, I need to hash it.
            // Let's dynamic import bcryptjs to avoid load if not needed? 
            // OR simpler: Just rely on the server action to do the hashing.
            // I will update the Server Action file to take 'plainPassword' and hash it inside.
            // Let's assume 'createUserBackend' takes (email, plainPassword, fullName).

            // Update: I will re-write the action to take plain password.

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
                // Handle "User already registered" specifically if needed
                if (signUpResult.error && (signUpResult.error.includes('already exists') || signUpResult.error.includes('duplicate'))) {
                    // Proceed to login
                    console.log('User exists, trying login...')
                } else {
                    setError('Error al crear cuenta: ' + signUpResult.error)
                    setAccepting(false)
                    return
                }
            }

            // 2. Login immediately using the password
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

        // 2. Accept invitation (User is now authenticated or was already) (OR just finished creating account)
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
                        <div style={{ marginTop: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => router.push('/')}
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
