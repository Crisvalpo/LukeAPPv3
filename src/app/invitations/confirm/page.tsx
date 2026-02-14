'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { acceptInvitation } from '@/services/invitations'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
// Styles migrated to Tailwind v4

import { Suspense } from 'react'

function ConfirmInvitationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
    const [message, setMessage] = useState('Procesando confirmación...')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        processConfirmation()
    }, [])

    async function processConfirmation() {
        const token = searchParams.get('token')

        if (!token) {
            setStatus('error')
            setMessage('Enlace de invitación inválido. Falta el token.')
            return
        }

        console.log('🔄 Procesando confirmación con token:', token)

        try {
            // Wait for Supabase to finish processing auth tokens
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            console.log('Sesión:', session ? `${session.user.email} (autenticado)` : 'No autenticado')

            if (!session) {
                // No session - user needs to login first
                console.log('⚠️ Sin sesión, redirigiendo a landing...')
                setStatus('success')
                setMessage('Email confirmado. Por favor inicia sesión para continuar.')
                await new Promise(resolve => setTimeout(resolve, 2000))
                router.push('/')
                return
            }

            // User is authenticated - accept invitation
            console.log('✅ Usuario autenticado, aceptando invitación...')
            setMessage('Aceptando invitación...')

            const result = await acceptInvitation(token)

            console.log('Resultado de aceptación:', result)

            if (result.success) {
                setStatus('success')
                setMessage('¡Invitación aceptada! Redirigiendo a tu dashboard...')
                await new Promise(resolve => setTimeout(resolve, 1500))
                router.push('/')
            } else {
                setStatus('error')
                setMessage(result.message || 'Error al aceptar la invitación')
            }

        } catch (error: any) {
            console.error('❌ Error:', error)
            setStatus('error')
            setMessage('Error procesando confirmación: ' + error.message)
        }
    }

    return (
        <div className="accept-invitation-container">
            <div className="accept-invitation-card">
                <div
                    className="accept-invitation-icon"
                    style={{
                        background: status === 'success' ? 'rgba(34, 197, 94, 0.1)' :
                            status === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                'rgba(59, 130, 246, 0.1)',
                        borderColor: status === 'success' ? 'rgba(34, 197, 94, 0.3)' :
                            status === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                                'rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {status === 'processing' && <Loader2 size={32} color="#60a5fa" className="animate-spin" />}
                    {status === 'success' && <CheckCircle2 size={32} color="#22c55e" />}
                    {status === 'error' && <AlertCircle size={32} color="#f87171" />}
                </div>

                <h1 className="accept-invitation-title">
                    {status === 'processing' && 'Procesando Confirmación'}
                    {status === 'success' && '✅ ¡Listo!'}
                    {status === 'error' && '❌ Hubo un Problema'}
                </h1>

                <p style={{
                    color: status === 'error' ? '#f87171' : '#94a3b8',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    {message}
                </p>

                {status === 'error' && (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexDirection: 'column' }}>
                        <button
                            onClick={() => processConfirmation()}
                            className="accept-button"
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="accept-button"
                            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                        >
                            Ir al Inicio
                        </button>
                    </div>
                )}

                {status === 'processing' && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#94a3b8'
                    }}>
                        <p style={{ margin: 0 }}>
                            ⏳ Configurando tu cuenta y permisos...
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ConfirmInvitationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Cargando...</div>}>
            <ConfirmInvitationContent />
        </Suspense>
    )
}
