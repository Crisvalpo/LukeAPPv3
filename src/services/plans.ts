import { createClient } from '@/lib/supabase/client'
import type { SubscriptionPlan } from '@/types'

/**
 * Get all subscription plans
 */
export async function getAllPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient()

    // Sort logic? Maybe order by price ASC, or by some specific order. 
    // We can order by price_monthly for now.
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true })

    if (error) {
        console.error('Error fetching plans:', error)
        return []
    }

    return data as SubscriptionPlan[]
}

/**
 * Get plan by ID (e.g., 'starter')
 */
export async function getPlanById(id: string): Promise<SubscriptionPlan | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching plan:', error)
        return null
    }

    return data as SubscriptionPlan
}

/**
 * Update plan limits (Staff only via RLS)
 */
export async function updatePlan(id: string, updates: Partial<SubscriptionPlan>) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message }
    }

    return { success: true, data }
}
