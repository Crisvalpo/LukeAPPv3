'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Lock } from 'lucide-react'
// Styles migrated to Tailwind v4

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [hasValidSession, setHasValidSession] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        let recoveryDetected = false

        // Listen for auth state changes to catch the recovery session
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth event:', event, 'Has session:', !!session, 'Email:', session?.user?.email)

            // CRITICAL: ONLY accept PASSWORD_RECOVERY event - ignore existing sessions!
            if (event === 'PASSWORD_RECOVERY') {
                console.log('✅ Valid PASSWORD_RECOVERY event detected for:', session?.user?.email)
                recoveryDetected = true
                setHasValidSession(true)
                setLoading(false)
                setError('')
            }
        })

        // Check initial session - but ONLY if it's from a recovery flow
        const checkSession = async () => {
            // Wait a bit for auth state change to fire
            await new Promise(resolve => setTimeout(resolve, 1000))

            // If no PASSWORD_RECOVERY was detected, block access
            if (!recoveryDetected) {
                console.log('❌ No PASSWORD_RECOVERY event detected - blocking access')
                setHasValidSession(false)
            }

            setLoading(false)
        }

        checkSession()

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        setUpdating(true)

        try {
            // Update the password for the authenticated user
            const { data, error: updateError } = await supabase.auth.updateUser({
                password: password
            })

            console.log('📝 Update result:', {
                user: data?.user?.email,
                success: !updateError
            })

            if (updateError) {
                throw updateError
            }

            if (!data.user) {
                throw new Error('No se pudo actualizar la contraseña')
            }

            setSuccess(true)

            // Sign out and redirect to login
            await supabase.auth.signOut()

            setTimeout(() => {
                router.push('/?message=password-updated')
            }, 2000)
        } catch (error: any) {
            console.error('❌ Password update error:', error)
            setError(error.message || 'Error al actualizar la contraseña')
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <p style={{ color: 'white' }}>Validando enlace de recuperación...</p>
                </div>
            </div>
        )
    }

    if (!hasValidSession) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <div className="accept-invitation-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        <Lock size={32} color="#f87171" />
                    </div>

                    <h1 className="accept-invitation-title" style={{ color: '#f87171' }}>
                        Enlace Inválido
                    </h1>

                    <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
                        El enlace de recuperación es inválido o ha expirado.
                        <br />
                        Por favor, solicita un nuevo enlace.
                    </p>

                    <button
                        onClick={() => router.push('/forgot-password')}
                        className="accept-button"
                    >
                        Solicitar Nuevo Enlace
                    </button>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <div className="accept-invitation-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                        <Lock size={32} color="#22c55e" />
                    </div>

                    <h1 className="accept-invitation-title" style={{ color: '#22c55e' }}>
                        Contraseña Actualizada
                    </h1>

                    <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
                        Tu contraseña ha sido actualizada exitosamente.
                        <br />
                        Redirigiendo al inicio de sesión...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="accept-invitation-container">
            <div className="accept-invitation-card">
                <div className="accept-invitation-icon">
                    <Lock size={32} color="#60a5fa" />
                </div>

                <h1 className="accept-invitation-title">Nueva Contraseña</h1>
                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
                    Ingresa tu nueva contraseña para completar la recuperación.
                </p>

                <form onSubmit={handleUpdatePassword} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="Mínimo 6 caracteres"
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                            Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input"
                            placeholder="Repite tu contraseña"
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={updating}
                        className="accept-button"
                        style={{ width: '100%' }}
                    >
                        {updating ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    )
}
