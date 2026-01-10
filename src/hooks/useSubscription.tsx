/**
 * useSubscription Hook - Global subscription context and access control
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCompanySubscriptionInfo } from '@/services/subscriptions'
import type { CompanySubscriptionInfo, UserRoleType } from '@/types'

interface SubscriptionContextValue {
    subscriptionInfo: CompanySubscriptionInfo | null
    isLoading: boolean
    canCreateUser: boolean
    canCreateProject: boolean
    shouldShowAlert: boolean
    refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

interface SubscriptionProviderProps {
    children: ReactNode
    companyId: string | null
    userRole: UserRoleType | null
}

export function SubscriptionProvider({ children, companyId, userRole }: SubscriptionProviderProps) {
    const [subscriptionInfo, setSubscriptionInfo] = useState<CompanySubscriptionInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        loadSubscriptionInfo()
    }, [companyId, userRole])

    async function loadSubscriptionInfo() {
        // Staff users bypass subscription checks entirely
        if (userRole === 'super_admin') {
            setIsLoading(false)
            return
        }

        if (!companyId) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        const info = await getCompanySubscriptionInfo(companyId)
        setSubscriptionInfo(info)
        setIsLoading(false)
    }

    // Check if subscription is suspended and redirect to locked page
    // Only redirect Worker/Supervisor - Founder/Admin see alerts but can navigate
    useEffect(() => {
        if (
            !isLoading &&
            subscriptionInfo &&
            subscriptionInfo.status === 'suspended' &&
            userRole !== 'super_admin' && // Staff can always access
            userRole !== 'founder' && // Founder sees alert but can navigate
            userRole !== 'admin' && // Admin sees alert but can navigate
            !pathname.includes('/locked') &&
            !pathname.includes('/subscription')
        ) {
            router.push('/locked')
        }
    }, [subscriptionInfo, isLoading, pathname, router, userRole])

    // Calculate if user can create resources based on limits
    const canCreateUser = subscriptionInfo
        ? subscriptionInfo.current_users < subscriptionInfo.max_users
        : false

    const canCreateProject = subscriptionInfo
        ? subscriptionInfo.current_projects < subscriptionInfo.max_projects
        : false

    // Determine if alert should be shown (only for founder/admin)
    const shouldShowAlert = Boolean(
        subscriptionInfo &&
        (userRole === 'founder' || userRole === 'admin') &&
        (subscriptionInfo.status === 'past_due' || subscriptionInfo.status === 'suspended')
    )

    const value: SubscriptionContextValue = {
        subscriptionInfo,
        isLoading,
        canCreateUser,
        canCreateProject,
        shouldShowAlert,
        refresh: loadSubscriptionInfo
    }

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
    const context = useContext(SubscriptionContext)

    if (!context) {
        throw new Error('useSubscription must be used within SubscriptionProvider')
    }

    return context
}

// ===== UTILITY HOOK FOR ROLE-BASED ALERT VISIBILITY =====

export function useSubscriptionAlerts(userRole: UserRoleType | null): {
    shouldShowAlert: boolean
    alertType: 'past_due' | 'suspended' | null
    alertMessage: string
} {
    const { subscriptionInfo } = useSubscription()

    // Only show alerts to founder and admin
    if (!subscriptionInfo || (userRole !== 'founder' && userRole !== 'admin')) {
        return {
            shouldShowAlert: false,
            alertType: null,
            alertMessage: ''
        }
    }

    if (subscriptionInfo.status === 'past_due') {
        const endDate = subscriptionInfo.end_date
            ? new Date(subscriptionInfo.end_date).toLocaleDateString('es-ES')
            : 'fecha desconocida'

        return {
            shouldShowAlert: true,
            alertType: 'past_due',
            alertMessage: `Tu suscripción venció el ${endDate}. Por favor, realiza el pago para evitar la suspensión del servicio.`
        }
    }

    if (subscriptionInfo.status === 'suspended') {
        // Build countdown message if data is available
        let countdownText = ''
        if (subscriptionInfo.days_until_deletion !== null) {
            const days = subscriptionInfo.days_until_deletion || 0
            const hours = subscriptionInfo.hours_until_deletion || 0
            const minutes = subscriptionInfo.minutes_until_deletion || 0

            countdownText = ` Tus datos serán eliminados en ${days} días, ${hours} horas, ${minutes} minutos.`
        }

        return {
            shouldShowAlert: true,
            alertType: 'suspended',
            alertMessage: userRole === 'founder'
                ? `Servicio Suspendido - Si aún necesitas gestionar tus proyectos con LukeAPP, realiza tu pago y contacta con soporte para reactivar tu cuenta lo antes posible.${countdownText}`
                : `Servicio Suspendido. Tu cuenta está bloqueada por falta de pago. Contacta a tu administrador.${countdownText}`
        }
    }

    return {
        shouldShowAlert: false,
        alertType: null,
        alertMessage: ''
    }
}
