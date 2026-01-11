/**
 * Subscription Service - Manage subscription plans and company subscriptions
 */

import { createClient } from '@/lib/supabase/client'
import type {
    SubscriptionPlan,
    CompanySubscriptionInfo,
    SubscriptionTierType,
    SubscriptionStatusType
} from '@/types'

export type { SubscriptionPlan, CompanySubscriptionInfo } from '@/types'

// ===== GET SUBSCRIPTION PLANS =====

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true })

    if (error) {
        console.error('Error fetching subscription plans:', error)
        return []
    }

    return data as SubscriptionPlan[]
}

// ===== GET COMPANY SUBSCRIPTION INFO =====

export async function getCompanySubscriptionInfo(companyId: string): Promise<CompanySubscriptionInfo | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('get_company_subscription_info', { p_company_id: companyId })
        .single()

    if (error) {
        console.error('Error fetching company subscription info:', error)
        return null
    }

    return data as CompanySubscriptionInfo
}

// ===== CHECK LIMITS =====

export async function canCreateUser(companyId: string): Promise<boolean> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('can_create_user', { p_company_id: companyId })

    if (error) {
        console.error('Error checking user limit:', error)
        return false
    }

    return data as boolean
}

export async function canCreateProject(companyId: string): Promise<boolean> {
    const supabase = createClient()

    const { data, error } = await supabase
        .rpc('can_create_project', { p_company_id: companyId })

    if (error) {
        console.error('Error checking project limit:', error)
        return false
    }

    return data as boolean
}

// ===== STAFF: UPDATE SUBSCRIPTION =====

export async function updateCompanySubscription(
    companyId: string,
    updates: {
        subscription_status?: SubscriptionStatusType
        subscription_tier?: SubscriptionTierType
        subscription_end_date?: string | null
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    // Set suspended_at when suspending, clear it when reactivating
    const enrichedUpdates: any = { ...updates }

    if (updates.subscription_status === 'suspended') {
        enrichedUpdates.suspended_at = new Date().toISOString()
    } else if (updates.subscription_status === 'active') {
        enrichedUpdates.suspended_at = null
    }

    const { error } = await supabase
        .from('companies')
        .update(enrichedUpdates)
        .eq('id', companyId)

    if (error) {
        console.error('Error updating company subscription:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ===== STAFF: REGISTER MANUAL PAYMENT =====

export async function registerManualPayment(
    companyId: string,
    monthsExtension: number,
    newTier?: SubscriptionTierType
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    // Get current company subscription
    const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('subscription_end_date')
        .eq('id', companyId)
        .single()

    if (fetchError) {
        console.error('Error fetching company:', fetchError)
        return { success: false, error: fetchError.message }
    }

    // Calculate new end date
    const baseDate = company.subscription_end_date && new Date(company.subscription_end_date) > new Date()
        ? new Date(company.subscription_end_date)
        : new Date()

    baseDate.setMonth(baseDate.getMonth() + monthsExtension)

    // Prepare update object
    const updateData: any = {
        subscription_status: 'active',
        subscription_end_date: baseDate.toISOString(),
        suspended_at: null // Clear suspension timestamp when reactivating
    }

    if (newTier) {
        updateData.subscription_tier = newTier
    }

    // Update company subscription
    const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId)

    if (updateError) {
        console.error('Error registering payment:', updateError)
        return { success: false, error: updateError.message }
    }

    return { success: true }
}

// ===== GET COMPANIES WITH SUBSCRIPTION STATUS (FOR STAFF) =====

export interface CompanyWithSubscription {
    id: string
    name: string
    slug: string
    subscription_status: SubscriptionStatusType
    subscription_tier: SubscriptionTierType
    subscription_end_date: string | null
    suspended_at: string | null
    created_at: string
}

export async function getCompaniesWithSubscription(): Promise<CompanyWithSubscription[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, subscription_status, subscription_tier, subscription_end_date, suspended_at, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching companies with subscription:', error)
        return []
    }

    return data as CompanyWithSubscription[]
}
