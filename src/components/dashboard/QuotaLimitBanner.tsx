'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getQuotaStatus, QuotaStatus } from '@/services/quota'

interface QuotaLimitBannerProps {
    companyId: string
    roleId?: string
}

export default function QuotaLimitBanner({ companyId, roleId }: QuotaLimitBannerProps) {
    const [status, setStatus] = useState<QuotaStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Only show to high-level roles
        if (!['admin', 'founder', 'super_admin'].includes(roleId || '')) {
            setLoading(false)
            return
        }

        async function fetchStatus() {
            try {
                const data = await getQuotaStatus(companyId)
                setStatus(data)
            } catch (err) {
                console.error('Failed to fetch quota status:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchStatus()
    }, [companyId, roleId])

    if (loading || !status || status.strikeCount === 0) {
        return null
    }

    // Determine styles based on strike count
    const isBlocked = status.strikeCount >= 3
    const isWarning = status.strikeCount > 0

    // Colors
    // Strike 1: Yellow (Warning)
    // Strike 2: Orange (Urgent)
    // Strike 3: Red (Blocked)

    let bgColor = '#FEF9C3' // Yellow-100
    let textColor = '#854D0E' // Yellow-800
    let icon = '⚠️'

    if (status.strikeCount === 2) {
        bgColor = '#FFEDD5' // Orange-100
        textColor = '#9A3412' // Orange-800
        icon = '⚠️'
    } else if (status.strikeCount >= 3) {
        bgColor = '#FEE2E2' // Red-100
        textColor = '#991B1B' // Red-800
        icon = '⛔'
    }

    return (
        <div style={{
            backgroundColor: bgColor,
            color: textColor,
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
            borderBottom: `1px solid ${textColor}20`
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span>
                    {status.message}
                    {!isBlocked && (
                        <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                            ({status.daysRemaining} {status.daysRemaining === 1 ? 'aviso' : 'avisos'} restantes)
                        </span>
                    )}
                </span>
                <a
                    href="mailto:ventas@lukeapp.cl?subject=Ampliación de plan por límite de spools"
                    style={{
                        marginLeft: '1rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        color: 'inherit'
                    }}
                >
                    Contactar a Ventas &rarr;
                </a>
            </div>
        </div>
    )
}
