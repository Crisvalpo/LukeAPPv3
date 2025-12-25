'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateInvitationToken, acceptInvitation } from '@/services/invitations'
import { Building2, UserPlus } from 'lucide-react'
import '@/styles/invitations.css'

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState(false)
    const [invitation, setInvitation] = useState<any>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        validateToken()
    }, [])

    async function validateToken() {
        const result = await validateInvitationToken(params.token)

        if (result.success && result.data) {
            setInvitation(result.data)
        } else {
            setError(result.message)
        }

        setLoading(false)
    }

    async function handleAccept() {
        setAccepting(true)
        const result = await acceptInvitation(params.token)

        if (result.success) {
            alert('¡Invitación aceptada! Redirigiendo...')
            router.push('/founder')
        } else {
            alert('Error: ' + result.message)
            setAccepting(false)
        }
    }

    function handleDecline() {
        router.push('/')
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

    if (error || !invitation) {
        return (
            <div className="accept-invitation-container">
                <div className="accept-invitation-card">
                    <div className="accept-invitation-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        <span style={{ fontSize: '2rem' }}>❌</span>
                    </div>
                    <h1 className="accept-invitation-title">Invitación Inválida</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                        {error || 'Esta invitación no existe o ha expirado'}
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
                <p className="accept-invitation-company">{invitation.company?.name || 'LukeAPP'}</p>

                <div className="accept-invitation-details">
                    <div className="accept-invitation-detail">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{invitation.email}</span>
                    </div>
                    <div className="accept-invitation-detail">
                        <span className="detail-label">Rol:</span>
                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                            {invitation.role_id}
                        </span>
                    </div>
                    {invitation.project && (
                        <div className="accept-invitation-detail">
                            <span className="detail-label">Proyecto:</span>
                            <span className="detail-value">{invitation.project.name}</span>
                        </div>
                    )}
                </div>

                <div className="accept-invitation-actions">
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="accept-button"
                    >
                        {accepting ? 'Aceptando...' : 'Aceptar Invitación'}
                    </button>
                    <button onClick={handleDecline} className="decline-button">
                        Rechazar
                    </button>
                </div>
            </div>
        </div>
    )
}
