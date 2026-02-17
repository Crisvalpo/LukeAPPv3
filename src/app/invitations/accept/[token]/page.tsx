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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 font-medium">Validando invitación...</p>
                </div>
            </div>
        )
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
                <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                        <X size={32} className="text-red-400" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Invitación Inválida</h1>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        )
    }

    // CHECK EMAIL MISMATCH
    if (isAuthenticated && currentUserEmail && invitation && currentUserEmail.toLowerCase() !== invitation.email.toLowerCase()) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
                <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                        <UserPlus size={32} className="text-amber-400" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-amber-400 mb-2">Conflicto de Sesión</h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Para aceptar esta invitación, debes cerrar sesión e ingresar con la cuenta correcta.
                    </p>

                    <div className="w-full text-left space-y-4 bg-slate-950/50 border border-slate-800 p-5 rounded-2xl mb-8">
                        <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Invitación para:</p>
                            <p className="text-slate-200 font-medium truncate">{invitation.email}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-800/50">
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Sesión actual:</p>
                            <p className="text-slate-200 font-medium truncate">{currentUserEmail}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                        Cerrar Sesión y Continuar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
            <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="flex flex-col items-center text-center relative z-10">
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                        <UserPlus size={32} className="text-blue-400" />
                    </div>

                    <h1 className="text-2xl font-bold mb-1">Has sido invitado</h1>
                    <p className="text-blue-400 font-bold text-lg mb-8 tracking-tight">
                        {invitation?.company?.name || 'LukeAPP'}
                    </p>

                    <div className="w-full space-y-3 p-5 bg-slate-950/50 border border-slate-800 rounded-2xl mb-8">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Email</span>
                            <span className="text-slate-200 font-semibold">{invitation?.email}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-800/50">
                            <span className="text-slate-500 font-medium">Rol</span>
                            <span className="text-slate-200 font-semibold capitalize">{invitation?.role_id}</span>
                        </div>
                        {invitation?.project && (
                            <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-800/50">
                                <span className="text-slate-500 font-medium">Proyecto</span>
                                <span className="text-slate-200 font-semibold">{invitation.project.name}</span>
                            </div>
                        )}
                    </div>

                    {!isAuthenticated && (
                        <div className="w-full space-y-5">
                            {userExists ? (
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                    <p className="text-sm text-blue-400 font-medium">
                                        ¡Hola de nuevo! Esta cuenta ya existe.
                                        <span className="block mt-1 font-bold">Ingresa tu contraseña para aceptar.</span>
                                    </p>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm font-medium">
                                    Crea tu contraseña para activar tu cuenta
                                </p>
                            )}

                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-700"
                                        placeholder={userExists ? "Tu contraseña actual" : "Mínimo 6 caracteres"}
                                    />
                                </div>

                                {!userExists && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                                            Confirmar Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-700"
                                            placeholder="Repite tu contraseña"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="w-full mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                            {error}
                            {error.includes('credentials') && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => router.push('/forgot-password')}
                                        className="text-xs underline hover:text-red-300 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="w-full mt-8 flex flex-col items-center gap-6">
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg ${accepting
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                                }`}
                        >
                            {accepting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Procesando...</span>
                                </div>
                            ) : (
                                isAuthenticated ? 'Aceptar Invitación' : (userExists ? 'Iniciar Sesión y Aceptar' : 'Crear Cuenta y Aceptar')
                            )}
                        </button>

                        {!isAuthenticated && (
                            <button
                                onClick={() => userExists ? router.push('/') : setUserExists(true)}
                                className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                            >
                                {userExists ? 'Volver al Inicio' : 'Ya tengo una cuenta, iniciar sesión'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

