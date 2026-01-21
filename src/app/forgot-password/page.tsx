'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Mail, ArrowLeft } from 'lucide-react'
import '@/styles/invitations.css'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error

            setSuccess(true)
        } catch (error: any) {
            setError(error.message || 'Error al enviar el correo de recuperación')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <div className="accept-invitation-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                        <Mail size={32} color="#22c55e" />
                    </div>

                    <h1 className="accept-invitation-title" style={{ color: '#22c55e' }}>
                        Correo Enviado
                    </h1>

                    <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
                        Hemos enviado un enlace de recuperación a <strong style={{ color: 'white' }}>{email}</strong>
                        <br /><br />
                        Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    </p>

                    <button
                        onClick={() => router.push('/')}
                        className="accept-button"
                        style={{ background: '#22c55e' }}
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="accept-invitation-container">
            <div className="accept-invitation-card">
                <button
                    onClick={() => router.back()}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="accept-invitation-icon" style={{ background: 'rgba(96, 165, 250, 0.1)', borderColor: 'rgba(96, 165, 250, 0.3)' }}>
                    <Mail size={32} color="#60a5fa" />
                </div>

                <h1 className="accept-invitation-title">Recuperar Contraseña</h1>
                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <form onSubmit={handleResetPassword} style={{ width: '100%' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="tu@email.com"
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
                        disabled={loading}
                        className="accept-button"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                    </button>

                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Volver al inicio de sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
