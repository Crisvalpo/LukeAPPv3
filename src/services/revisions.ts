/**
 * Revision Event Service
 * 
 * Handles event-driven revision management using Event Sourcing pattern.
 * All state changes are recorded as immutable events.
 */

import { createClient } from '@/lib/supabase/server'
import type {
    ApiResponse,
    CreateRevisionParams,
    EngineeringRevision,
    RevisionEvent,
    RevisionEventTypeEnum
} from '@/types'

/**
 * Create a new engineering revision
 * Emits a CREATED event
 */
export async function createRevision(
    params: CreateRevisionParams,
    userId: string
): Promise<ApiResponse<EngineeringRevision>> {
    const supabase = await createClient()

    try {
        // 1. Create revision header
        const { data: revision, error: revisionError } = await supabase
            .from('engineering_revisions')
            .insert({
                project_id: params.project_id,
                company_id: params.company_id,
                rev_id: params.rev_id,
                entity_type: params.entity_type,
                entity_id: params.entity_id,
                status: 'DRAFT',
                created_by: userId
            })
            .select()
            .single()

        if (revisionError || !revision) {
            return {
                success: false,
                message: `Error al crear revisión: ${revisionError?.message}`
            }
        }

        // 2. Emit CREATED event
        const eventResult = await emitEvent({
            revision_id: revision.id,
            event_type: 'CREATED',
            payload: {
                rev_id: params.rev_id,
                entity_type: params.entity_type,
                entity_id: params.entity_id
            },
            created_by: userId
        })

        if (!eventResult.success) {
            console.error('Failed to emit CREATED event:', eventResult.message)
        }

        return {
            success: true,
            message: 'Revisión creada exitosamente',
            data: revision
        }
    } catch (error) {
        console.error('Error in createRevision:', error)
        return {
            success: false,
            message: 'Error inesperado al crear revisión'
        }
    }
}

/**
 * Emit an immutable event to the revision log
 */
export async function emitEvent(params: {
    revision_id: string
    event_type: RevisionEventTypeEnum
    payload?: Record<string, any>
    created_by: string
}): Promise<ApiResponse<RevisionEvent>> {
    const supabase = await createClient()

    try {
        const { data: event, error } = await supabase
            .from('revision_events')
            .insert({
                revision_id: params.revision_id,
                event_type: params.event_type,
                payload: params.payload || null,
                created_by: params.created_by
            })
            .select()
            .single()

        if (error || !event) {
            return {
                success: false,
                message: `Error al emitir evento: ${error?.message}`
            }
        }

        return {
            success: true,
            message: 'Evento emitido',
            data: event
        }
    } catch (error) {
        console.error('Error in emitEvent:', error)
        return {
            success: false,
            message: 'Error inesperado al emitir evento'
        }
    }
}

/**
 * Get all events for a revision (event history)
 */
export async function getRevisionEvents(revisionId: string): Promise<ApiResponse<RevisionEvent[]>> {
    const supabase = await createClient()

    try {
        const { data: events, error } = await supabase
            .from('revision_events')
            .select('*')
            .eq('revision_id', revisionId)
            .order('created_at', { ascending: true })

        if (error) {
            return {
                success: false,
                message: `Error al obtener eventos: ${error.message}`
            }
        }

        return {
            success: true,
            message: 'Eventos obtenidos',
            data: events || []
        }
    } catch (error) {
        console.error('Error in getRevisionEvents:', error)
        return {
            success: false,
            message: 'Error inesperado al obtener eventos',
            data: []
        }
    }
}

/**
 * Get all revisions for a project with isometric info and welds count
 */
export async function getProjectRevisions(projectId: string): Promise<ApiResponse<EngineeringRevision[]>> {
    const supabase = await createClient()

    try {
        // Main query: get revisions with isometric data
        const { data: revisions, error } = await supabase
            .from('engineering_revisions')
            .select(`
                id,
                isometric_id,
                project_id,
                company_id,
                rev_code,
                revision_status,
                transmittal,
                announcement_date,
                created_at,
                isometrics (
                    iso_number
                )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('getProjectRevisions error:', error)
            return {
                success: false,
                message: `Error al obtener revisiones: ${error.message}`,
                data: []
            }
        }

        if (!revisions || revisions.length === 0) {
            return {
                success: true,
                message: 'No hay revisiones',
                data: []
            }
        }

        // Get welds count for each revision
        const revisionsWithCounts = await Promise.all(
            revisions.map(async (rev: any) => {
                const { count } = await supabase
                    .from('spools_welds')
                    .select('*', { count: 'exact', head: true })
                    .eq('revision_id', rev.id)

                // Count unique spools
                const { data: welds } = await supabase
                    .from('spools_welds')
                    .select('spool_number')
                    .eq('revision_id', rev.id)

                const uniqueSpools = new Set(welds?.map(w => w.spool_number) || [])

                return {
                    id: rev.id,
                    isometric_id: rev.isometric_id,
                    project_id: rev.project_id,
                    company_id: rev.company_id,
                    rev_code: rev.rev_code,
                    revision_status: rev.revision_status,
                    transmittal: rev.transmittal,
                    announcement_date: rev.announcement_date,
                    created_at: rev.created_at,
                    iso_number: rev.isometrics?.iso_number || 'N/A',
                    welds_count: count || 0,
                    spools_count: uniqueSpools.size
                } as EngineeringRevision
            })
        )

        return {
            success: true,
            message: 'Revisiones obtenidas',
            data: revisionsWithCounts
        }
    } catch (error) {
        console.error('Error in getProjectRevisions:', error)
        return {
            success: false,
            message: 'Error inesperado',
            data: []
        }
    }
}

/**
 * Update revision status and emit corresponding event
 */
export async function updateRevisionStatus(
    revisionId: string,
    newStatus: string,
    userId: string
): Promise<ApiResponse<EngineeringRevision>> {
    const supabase = await createClient()

    try {
        // 1. Update status
        const { data: revision, error } = await supabase
            .from('engineering_revisions')
            .update({
                status: newStatus,
                ...(newStatus === 'APPROVED' && {
                    approved_at: new Date().toISOString(),
                    approved_by: userId
                }),
                ...(newStatus === 'APPLIED' && { announced_at: new Date().toISOString() })
            })
            .eq('id', revisionId)
            .select()
            .single()

        if (error || !revision) {
            return {
                success: false,
                message: `Error al actualizar estado: ${error?.message}`
            }
        }

        // 2. Emit event
        const eventType = newStatus.toUpperCase() as RevisionEventTypeEnum
        await emitEvent({
            revision_id: revisionId,
            event_type: eventType,
            payload: { previous_status: revision.status, new_status: newStatus },
            created_by: userId
        })

        return {
            success: true,
            message: `Revisión ${newStatus.toLowerCase()}`,
            data: revision
        }
    } catch (error) {
        console.error('Error in updateRevisionStatus:', error)
        return {
            success: false,
            message: 'Error inesperado'
        }
    }
}

/**
 * Delete a revision and auto-promote the previous one if needed
 */
export async function deleteRevision(
    revisionId: string,
    userId: string
): Promise<ApiResponse<void>> {
    const supabase = await createClient()

    try {
        // 1. Get revision details before deleting
        const { data: revisionToDelete, error: fetchError } = await supabase
            .from('engineering_revisions')
            .select('isometric_id, rev_code, revision_status')
            .eq('id', revisionId)
            .single()

        if (fetchError || !revisionToDelete) {
            return {
                success: false,
                message: 'No se encontró la revisión a eliminar'
            }
        }

        const isometricId = revisionToDelete.isometric_id

        // 2. Delete the revision
        // Note: Cascade delete should handle related events/welds if set up, 
        // otherwise we might need manual cleanup. Assuming cascade or simple delete for now.
        const { error: deleteError } = await supabase
            .from('engineering_revisions')
            .delete()
            .eq('id', revisionId)

        if (deleteError) {
            return {
                success: false,
                message: `Error al eliminar revisión: ${deleteError.message}`
            }
        }

        // 3. Find the new "latest" revision (Auto-Promote Logic)
        const { data: remainingRevisions } = await supabase
            .from('engineering_revisions')
            .select('id, rev_code, revision_status')
            .eq('isometric_id', isometricId)
            // Sort Descending locally to be safe or use DB match
            .order('rev_code', { ascending: false }) // Assuming alpha-numeric sort works for Rev codes

        if (remainingRevisions && remainingRevisions.length > 0) {
            // Sort in JS to ensure correct semantic versioning (A, B, C... or 0, 1, 2...)
            // If rev_code is mixed (0, A), localeCompare usually works well enough for simple cases.
            const sorted = remainingRevisions.sort((a, b) =>
                b.rev_code.localeCompare(a.rev_code, undefined, { numeric: true, sensitivity: 'base' })
            )

            const newLatest = sorted[0]

            // If the deleted revision was VIGENTE (Active), we MUST promote the new latest
            // Or if we just want to ensure the latest is ALWAYS Vigente in this workflow:
            if (revisionToDelete.revision_status === 'VIGENTE' || newLatest.revision_status !== 'VIGENTE') {
                // Promote to VIGENTE
                await supabase
                    .from('engineering_revisions')
                    .update({ revision_status: 'VIGENTE' })
                    .eq('id', newLatest.id)
            }

            // Update Isometric Header
            await supabase
                .from('isometrics')
                .update({
                    current_revision_id: newLatest.id,
                    revision: newLatest.rev_code
                    // We might not want to change the Iso Status itself unless it became empty, 
                    // but usually it remains VIGENTE if it has revisions.
                })
                .eq('id', isometricId)

        } else {
            // No revisions left!
            await supabase
                .from('isometrics')
                .update({
                    current_revision_id: null,
                    revision: null,
                    status: 'VACIO' // Or 'ELIMINADO' depending on logic, but 'VACIO' implies no data
                })
                .eq('id', isometricId)
        }

        // 4. Emit Deletion Event (Optional: Logs)
        // Since the revision is gone, we can't link the event to it easily unless we keep a separate log.
        // Skipping strict event logging linked to the revision ID since it's hard deleted.

        return {
            success: true,
            message: 'Revisión eliminada y línea de tiempo actualizada'
        }

    } catch (error) {
        console.error('Error in deleteRevision:', error)
        return {
            success: false,
            message: 'Error inesperado al eliminar revisión'
        }
    }
}
