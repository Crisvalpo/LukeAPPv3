/**
 * Quota Service (3-Strike System)
 * Handles logic for tracking quota violations and enforcing blocks.
 */

import { createClient } from '@/lib/supabase/client'

export interface QuotaStatus {
    isBlocked: boolean
    strikeCount: number
    daysRemaining: number
    message: string | null
    currentUsage: number
    limit: number
}

/**
 * Register a strike for today if quota is exceeded
 * Returns the updated strike count
 */
export async function registerQuotaStrike(
    companyId: string,
    currentUsage: number,
    limit: number,
    supabaseClient?: ReturnType<typeof createClient>
): Promise<number> {
    const supabase = supabaseClient || createClient()
    const today = new Date().toISOString().split('T')[0]

    // 1. Check if we already logged a strike for TODAY
    const { data: existingStrike } = await supabase
        .from('quota_strikes')
        .select('id')
        .eq('company_id', companyId)
        .eq('date', today)
        .single()

    // 2. Count TOTAL strikes (including today if it exists, or previous ones)
    const { count } = await supabase
        .from('quota_strikes')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)

    let totalStrikes = count || 0

    // If no strike for today, create one
    if (!existingStrike) {
        const { error } = await supabase
            .from('quota_strikes')
            .insert({
                company_id: companyId,
                date: today,
                spool_count: currentUsage
            })

        if (!error) {
            totalStrikes += 1 // Increment locally since we just added one

            // Queue Email Notification
            await supabase.from('system_notifications').insert({
                company_id: companyId,
                type: totalStrikes >= 3 ? 'quota_blocked' : 'quota_warning',
                strike_count: totalStrikes,
                data: {
                    current_usage: currentUsage,
                    limit: limit,
                    date: today
                }
            })
        }
    }

    return totalStrikes
}

/**
 * Get current strike status for UI
 */
export async function getQuotaStatus(companyId: string): Promise<QuotaStatus> {
    const supabase = createClient()

    // Get Strikes
    const { count } = await supabase
        .from('quota_strikes')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)

    const strikeCount = count || 0

    // Get Limit Info (re-used logic mostly, but useful for UI)
    // For specific limits we need the plan, but for strikes we just need the count

    // Logic: 
    // 0 strikes -> OK
    // 1 strike -> Warning 1
    // 2 strikes -> Warning 2
    // 3 strikes -> Blocked

    const isBlocked = strikeCount >= 3

    let message = null
    if (strikeCount === 1) message = "Aviso 1/3: Cuota de spools excedida."
    if (strikeCount === 2) message = "Aviso 2/3: Última advertencia antes del bloqueo."
    if (strikeCount >= 3) message = "OPERACIÓN BLOQUEADA: Límite de spools excedido por 3 días."

    return {
        isBlocked,
        strikeCount,
        daysRemaining: Math.max(0, 3 - strikeCount),
        message,
        currentUsage: 0, // Placeholder, usually fetched separately
        limit: 0         // Placeholder
    }
}
