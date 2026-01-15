'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UpdateWeldStatusPayload = {
    weldId: string
    projectId: string
    status: 'PENDING' | 'EXECUTED' | 'REWORK' | 'DELETED'
    welderId?: string | null // For now storing "W-01" etc directly or ID if mapped
    welderStamp?: string | null
    supportWelderId?: string | null // Collera
    executionNotes?: string | null
    metadataEdit?: boolean // NEW: Flag to indicate technical data edit
}

export async function updateWeldStatusAction(payload: UpdateWeldStatusPayload) {
    // 0. Auth & Validation
    const supabase = await createClient()
    const { getUser } = await import('@/lib/supabase/server-user-utils')
    const user = await getUser(supabase)

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { weldId, projectId, status, welderStamp, executionNotes, supportWelderId, metadataEdit } = payload

    try {
        // 1. Fetch current weld data for revision_id, nps, and history context
        const { data: currentWeld, error: fetchError } = await supabase
            .from('spools_welds')
            .select('execution_status, revision_id, nps, diameter_inches, spool_number, company_id, execution_notes') // Corrected: spool_number instead of spool_id
            .eq('id', weldId)
            .single()

        if (fetchError || !currentWeld) {
            throw new Error(`Weld not found. Error: ${fetchError?.message}`)
        }

        // 2. Prepare Update Data
        const updateData: any = {
            execution_status: status,
            updated_at: new Date().toISOString()
        }

        // Calculate inches if not present or if re-calculating (safe to do always)
        if (currentWeld.nps) {
            updateData.diameter_inches = parseNpsToInches(currentWeld.nps)
        }

        if (status === 'EXECUTED') {
            // Only update executed_at if it wasn't already EXECUTED
            if (currentWeld.execution_status !== 'EXECUTED') {
                updateData.executed_at = new Date().toISOString()
                updateData.executed_by = user.id
                updateData.executed_revision_id = currentWeld.revision_id // Snapshot revision
            }
            if (welderStamp) updateData.welder_stamp = welderStamp
            if (supportWelderId) updateData.support_welder_id = supportWelderId
        } else if (status === 'REWORK') {
            updateData.execution_notes = executionNotes
            // Rework might count as a new execution event or just a status change.
            // Keeping executed_by/at from previous might be misleading if we don't clear them?
            // Usually rework means "it was bad", so we keep the history but maybe execute again later?
            // For now, we update the notes.
        } else if (status === 'PENDING') {
            // Reset execution data
            updateData.executed_at = null
            updateData.executed_by = null
            updateData.welder_stamp = null
            updateData.support_welder_id = null
            updateData.execution_notes = null
            updateData.executed_revision_id = null
        }

        // 3. Update Weld Record
        const { error: updateError } = await supabase
            .from('spools_welds')
            .update(updateData)
            .eq('id', weldId)

        if (updateError) throw updateError

        // 4. Log History
        // Log if status changed, notes changed, OR if it's a metadata edit
        const statusChanged = currentWeld.execution_status !== status
        const notesChanged = executionNotes && executionNotes !== currentWeld.execution_notes

        if (statusChanged || notesChanged || metadataEdit) {
            const userName = user.user_metadata?.full_name || user.user_metadata?.nombre || user.email || 'Usuario'

            let comments = ''
            if (metadataEdit) {
                comments = `Usuario: ${userName} | edito Datos Técnicos`
            } else {
                const details = executionNotes || (status === 'EXECUTED' ? `Soldador: ${welderStamp}` : '')
                comments = `Usuario: ${userName} | ${details}`.trim()
            }

            // Clean up trailing pipes if empty details
            if (comments.endsWith('| ')) comments = comments.slice(0, -2)

            const { error: historyError } = await supabase
                .from('weld_status_history')
                .insert({
                    weld_id: weldId,
                    project_id: projectId,
                    previous_status: currentWeld.execution_status || 'PENDING',
                    new_status: status, // Status might be same if just metadata edit
                    changed_by: user.id,
                    comments: comments
                })

            if (historyError) {
                console.error('Error logging weld history:', historyError)
            }
        }

        // 5. Automatic Spool Status Update (Dynamic)
        // Check if all SHOP welds for this spool are executed
        if (currentWeld.spool_number && currentWeld.revision_id) {
            // Robust Logic: "Shop" is everything that is NOT "Field"
            // Method: Count Total - Count Field = Count Shop

            // 1. Get ALL welds for this spool
            const { data: allWelds, error: weldsError } = await supabase
                .from('spools_welds')
                .select('id, destination, execution_status')
                .eq('revision_id', currentWeld.revision_id)
                .eq('spool_number', currentWeld.spool_number)

            if (!weldsError && allWelds && allWelds.length > 0) {
                // Filter locally for maximum control (and to avoid complex OR queries)
                // Definition of FIELD: 'FIELD', 'field', 'CAMPO', 'campo', 'F'
                const isField = (dest: string | null) => {
                    if (!dest) return false
                    const d = dest.toUpperCase()
                    return d === 'FIELD' || d === 'CAMPO' || d === 'F' || d === 'SITE'
                }

                const shopWelds = allWelds.filter(w => !isField(w.destination))

                // Check if ALL shop welds are EXECUTED
                // Ignore DELETED welds? Usually yes.
                const validShopWelds = shopWelds.filter(w => w.execution_status !== 'DELETED')

                if (validShopWelds.length > 0) {
                    const executedCount = validShopWelds.filter(w => ['EXECUTED', 'REWORK'].includes(w.execution_status)).length
                    const isFullyFabricated = executedCount === validShopWelds.length
                    const isPartiallyFabricated = executedCount > 0 && !isFullyFabricated

                    // Fetch current spool
                    const { data: spool, error: spoolError } = await supabase
                        .from('spools')
                        .select('id, status')
                        .eq('revision_id', currentWeld.revision_id)
                        .eq('spool_number', currentWeld.spool_number)
                        .maybeSingle()

                    if (spoolError) console.error('Error fetching spool for status update:', spoolError)

                    if (spool) {
                        let newStatus = null

                        if (isFullyFabricated) {
                            // Upgrade to FABRICATED
                            if (spool.status !== 'FABRICATED' && spool.status !== 'COMPLETED' && spool.status !== 'PAINTING' && spool.status !== 'SHIPPED' && spool.status !== 'DELIVERED' && spool.status !== 'INSTALLED') {
                                newStatus = 'FABRICATED'
                            }
                        } else if (isPartiallyFabricated) {
                            // Upgrade to IN_FABRICATION
                            if (spool.status === 'PENDING' || !spool.status) {
                                newStatus = 'IN_FABRICATION'
                            }
                            // Downgrade from FABRICATED to IN_FABRICATION (if a weld was undone)
                            if (spool.status === 'FABRICATED') {
                                newStatus = 'IN_FABRICATION'
                            }
                        } else {
                            // Downgrade to PENDING (0 executed)
                            if (spool.status === 'IN_FABRICATION' || spool.status === 'FABRICATED') {
                                newStatus = 'PENDING'
                            }
                        }

                        if (newStatus && newStatus !== spool.status) {
                            const { error: updateError } = await supabase
                                .from('spools')
                                .update({ status: newStatus })
                                .eq('id', spool.id)

                            if (updateError) console.error('Failed to update spool status:', updateError)
                        }
                    } else {
                        console.warn(`Spool not found for Number: ${currentWeld.spool_number} Rev: ${currentWeld.revision_id}`)
                    }
                }
            }
        }

        revalidatePath('/engineering/viewer')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating weld status:', error)
        return { success: false, error: error.message }
    }
}

// Helper to parse NPS string to decimal inches
function parseNpsToInches(nps: string): number {
    try {
        // Remove quotes and whitespace
        const clean = nps.replace(/"/g, '').trim()

        // Handle fractions (e.g. "3/4")
        if (clean.includes('/')) {
            const [numerator, denominator] = clean.split('/').map(Number)
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return numerator / denominator
            }
        }

        // Handle decimals or integers (e.g. "2", "1.5")
        const parsed = parseFloat(clean)
        return isNaN(parsed) ? 0 : parsed
    } catch (e) {
        return 0
    }
}

export async function getWeldHistoryAction(weldId: string) {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase
            .from('weld_status_history')
            .select('*')
            .eq('weld_id', weldId)
            .order('changed_at', { ascending: false })

        if (error) throw error

        // Note: User information is embedded in the 'comments' field
        // Format: "Soldador: W-01 | Usuario: [name]"
        return { success: true, data }
    } catch (error: any) {
        console.error('Error fetching weld history:', error)
        return { success: false, error: error.message }
    }
}
