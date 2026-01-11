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
    resourceType: 'spool' | 'storage',
    usageValue: number,
    limit: number,
    supabaseClient?: ReturnType<typeof createClient>
): Promise<number> {
    const supabase = supabaseClient || createClient()
    const today = new Date().toISOString().split('T')[0]

    // 1. Check if we already logged a strike for TODAY (any resource? or specific?)
    // Decision: One strike per day minimizes noise. If you broke spools AND storage today, it's 1 strike day.
    // BUT, the `usage_value` would overwrite?
    // Let's stick to: Report the FIRST violation of the day.
    const { data: existingStrike } = await supabase
        .from('quota_strikes')
        .select('id')
        .eq('company_id', companyId)
        .eq('date', today)
        .single()

    // 2. Count TOTAL strikes
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
                resource_type: resourceType,
                usage_value: usageValue,
                spool_count: resourceType === 'spool' ? usageValue : null // Keep back-compat if needed, or null
            })

        if (!error) {
            totalStrikes += 1

            // Queue Email Notification
            await supabase.from('system_notifications').insert({
                company_id: companyId,
                type: totalStrikes >= 3 ? 'quota_blocked' : 'quota_warning',
                strike_count: totalStrikes,
                data: {
                    resource: resourceType,
                    current_usage: usageValue,
                    limit: limit,
                    date: today
                }
            })
        }
    }

    return totalStrikes
}

export async function validateStorageQuotaWithStrikes(
    companyId: string,
    newFileSizeBytes: number,
    supabaseClient?: ReturnType<typeof createClient>
): Promise<void> {
    const supabase = supabaseClient || createClient()

    // 1. Get Company Tier & Current Usage
    const { data: company, error } = await supabase
        .from('companies')
        .select(`
            id, 
            storage_used_bytes, 
            subscription_plans (
                max_storage_gb
            )
        `)
        .eq('id', companyId)
        .single()

    if (error || !company) throw new Error('Error validating storage quota')

    const limitGb = company.subscription_plans?.max_storage_gb
    // Handle infinite (null or 999999)
    if (!limitGb || limitGb >= 999999) return

    const limitBytes = limitGb * 1024 * 1024 * 1024
    const currentBytes = company.storage_used_bytes || 0
    const projectedBytes = currentBytes + newFileSizeBytes

    if (projectedBytes > limitBytes) {
        // QUOTA EXCEEDED -> Check Strikes
        const totalStrikes = await registerQuotaStrike(
            companyId,
            'storage',
            projectedBytes,
            limitBytes,
            supabase
        )

        if (totalStrikes >= 3) {
            throw new Error(`OPERACIÓN BLOQUEADA: Has excedido tu cuota de almacenamiento (${limitGb} GB) por 3 días o más. Contacta a ventas.`)
        } else {
            console.warn(`[Quota Warning] Storage exceeded ${totalStrikes}/3. Operation allowed.`)
        }
    }
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
