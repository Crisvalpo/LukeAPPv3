'use client'

import { ReactNode } from 'react'
import { SubscriptionProvider, useSubscriptionAlerts } from '@/hooks/useSubscription'
import { UserRoleType } from '@/types'
import { AlertTriangle, Ban, Clock } from 'lucide-react'

interface DashboardContentProps {
    children: ReactNode
    companyId: string | null
    userRole: UserRoleType | null
}

function SubscriptionAlerts({ userRole }: { userRole: UserRoleType | null }) {
    const { shouldShowAlert, alertType, alertMessage } = useSubscriptionAlerts(userRole)

    if (!shouldShowAlert) return null

    // Pulsing animation for suspended status
    const pulseKeyframes = alertType === 'suspended'
        ? '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }'
        : ''

    return (
        <>
            {pulseKeyframes && <style>{pulseKeyframes}</style>}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '16rem',
                    right: 0,
                    zIndex: 1000,
                    padding: '1rem 2rem',
                    background: alertType === 'suspended'
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))'
                        : 'linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95))',
                    borderBottom: '2px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    animation: alertType === 'suspended' ? 'pulse 2s ease-in-out infinite' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '80rem', margin: '0 auto' }}>
                    <p style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem', margin: 0, flex: 1 }}>
                        {alertMessage}
                    </p>
                    {alertType === 'suspended' && (
                        <Clock size={18} color="white" strokeWidth={2} style={{ flexShrink: 0 }} />
                    )}
                </div>
            </div>
        </>
    )
}

export default function DashboardContent({ children, companyId, userRole }: DashboardContentProps) {
    return (
        <SubscriptionProvider companyId={companyId} userRole={userRole}>
            <SubscriptionAlerts userRole={userRole} />
            <div style={{ marginTop: userRole === 'founder' || userRole === 'admin' ? '0' : '0' }}>
                {children}
            </div>
        </SubscriptionProvider>
    )
}
