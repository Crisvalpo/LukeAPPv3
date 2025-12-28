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
                updated_at,
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
                    updated_at: rev.updated_at,
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
