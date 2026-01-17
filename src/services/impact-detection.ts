/**
 * Impact Detection Service
 * 
 * Core logic for detecting impacts when a revision is announced.
 * Implements the conditional impact detection based on production status.
 * 
 * Philosophy: "No toda revisión genera impactos"
 */

import { createClient } from '@/lib/supabase/server'
import {
    ApiResponse,
    RevisionImpact,
    ImpactTypeEnum,
    ImpactSeverityEnum
} from '@/types'
import { getAffectedSpools, getProductionStatus, classifyProductionLevel } from './production-mockups'
import { emitEvent } from './revisions'

/**
 * Detect impacts for a revision announcement
 * 
 * Returns impact records that need to be created
 */
export async function detectRevisionImpacts(
    revisionId: string,
    oldRevision: string,
    newRevision: string,
    isometricId: string,
    projectId: string,
    userId: string
): Promise<ApiResponse<RevisionImpact[]>> {
    const supabase = await createClient()

    try {
        // 1. Get all spools affected by this isometric
        const spools = await getAffectedSpools(isometricId, projectId)

        // 2. If no spools, no impacts (auto-apply case)
        if (spools.length === 0) {
            console.log('✅ No spools found - Can auto-apply')
            return {
                success: true,
                message: 'Sin impactos - puede auto-aplicarse',
                data: []
            }
        }

        // 3. Analyze each spool for production status
        const impacts: any[] = []

        for (const spool of spools) {
            const productionStatus = await getProductionStatus(spool.id)
            const level = classifyProductionLevel(productionStatus)

            // Only create impacts if there's production
            if (level !== 'ENGINEERING_ONLY') {
                const impact = {
                    revision_id: revisionId,
                    impact_type: determineImpactType(oldRevision, newRevision),
                    affected_entity_type: 'spool',
                    affected_entity_id: spool.id,
                    severity: determineSeverity(level, productionStatus),
                    resolution_type: null,
                    resolution_notes: null,
                    resolved_by: null,
                    resolved_at: null
                }

                impacts.push(impact)
            }
        }

        // 4. If no impacts, can auto-apply
        if (impacts.length === 0) {
            console.log('✅ No production found - Can auto-apply')
            return {
                success: true,
                message: 'Sin producción - puede auto-aplicarse',
                data: []
            }
        }

        // 5. Create impact records
        const { data: createdImpacts, error } = await supabase
            .from('revision_impacts')
            .insert(impacts)
            .select()

        if (error) {
            return {
                success: false,
                message: `Error al crear impactos: ${error.message}`,
                data: []
            }
        }

        // 6. Emit IMPACT_DETECTED event
        await emitEvent({
            revision_id: revisionId,
            event_type: 'IMPACT_DETECTED',
            payload: {
                impacts_count: createdImpacts.length,
                affected_spools: spools.map(s => s.spool_number)
            },
            created_by: userId
        })

        return {
            success: true,
            message: `${createdImpacts.length} impacto(s) detectado(s)`,
            data: createdImpacts
        }

    } catch (error) {
        console.error('Error in detectRevisionImpacts:', error)
        return {
            success: false,
            message: 'Error inesperado al detectar impactos',
            data: []
        }
    }
}

/**
 * Determine impact type based on revision change
 */
function determineImpactType(oldRev: string, newRev: string): ImpactTypeEnum {
    // Simple logic for now - in real implementation would compare actual data
    if (oldRev === 'A' && newRev === 'B') {
        return ImpactTypeEnum.MODIFIED
    }
    return ImpactTypeEnum.MODIFIED
}

/**
 * Determine severity based on production level
 */
function determineSeverity(
    level: 'ENGINEERING_ONLY' | 'FABRICATED_ONLY' | 'IN_PROGRESS',
    status: { hasFabrication: boolean; hasWelds: boolean; hasDispatch: boolean }
): ImpactSeverityEnum {
    if (level === 'IN_PROGRESS') {
        // Work in progress - check if dispatched or has welds
        if (status.hasDispatch || status.hasWelds) {
            return ImpactSeverityEnum.CRITICAL // On-site work affected
        }
        return ImpactSeverityEnum.HIGH
    }

    if (level === 'FABRICATED_ONLY') {
        return ImpactSeverityEnum.MEDIUM // Logistical impact only
    }

    return ImpactSeverityEnum.LOW
}

/**
 * Auto-apply revision if no impacts detected
 * 
 * This is the "Caso A" scenario from the master plan
 */
export async function attemptAutoApply(
    revisionId: string,
    isometricId: string,
    projectId: string,
    userId: string
): Promise<ApiResponse<boolean>> {
    try {
        // 1. Detect impacts
        const impactResult = await detectRevisionImpacts(
            revisionId,
            '', // Old revision - would get from context
            '', // New revision - would get from context
            isometricId,
            projectId,
            userId
        )

        // 2. If no impacts, auto-apply
        if (impactResult.success && impactResult.data && impactResult.data.length === 0) {
            console.log('✅ Auto-applying revision - no impacts')

            const supabase = await createClient()

            // Update revision status to APPLIED
            const { error } = await supabase
                .from('engineering_revisions')
                .update({
                    status: 'APPLIED',
                    announced_at: new Date().toISOString()
                })
                .eq('id', revisionId)

            if (error) {
                return {
                    success: false,
                    message: `Error al auto-aplicar: ${error.message}`,
                    data: false
                }
            }

            // Emit APPLIED event
            await emitEvent({
                revision_id: revisionId,
                event_type: 'APPLIED',
                payload: { auto_applied: true, reason: 'no_production' },
                created_by: userId
            })

            return {
                success: true,
                message: 'Revisión auto-aplicada (sin impactos)',
                data: true
            }
        }

        // 3. Impacts detected - cannot auto-apply
        return {
            success: true,
            message: 'Impactos detectados - requiere revisión manual',
            data: false
        }

    } catch (error) {
        console.error('Error in attemptAutoApply:', error)
        return {
            success: false,
            message: 'Error inesperado',
            data: false
        }
    }
}

/**
 * Get all impacts for a revision
 */
export async function getRevisionImpacts(revisionId: string): Promise<ApiResponse<RevisionImpact[]>> {
    const supabase = await createClient()

    try {
        const { data: impacts, error } = await supabase
            .from('revision_impacts')
            .select('*')
            .eq('revision_id', revisionId)
            .order('severity', { ascending: false }) // Critical first

        if (error) {
            return {
                success: false,
                message: `Error al obtener impactos: ${error.message}`,
                data: []
            }
        }

        return {
            success: true,
            message: 'Impactos obtenidos',
            data: impacts || []
        }

    } catch (error) {
        console.error('Error in getRevisionImpacts:', error)
        return {
            success: false,
            message: 'Error inesperado',
            data: []
        }
    }
}

/**
 * Resolve an impact with a strategic resolution
 */
export async function resolveImpact(
    impactId: string,
    resolutionType: string,
    resolutionNotes: string,
    userId: string
): Promise<ApiResponse<RevisionImpact>> {
    const supabase = await createClient()

    try {
        const { data: impact, error } = await supabase
            .from('revision_impacts')
            .update({
                resolution_type: resolutionType,
                resolution_notes: resolutionNotes,
                resolved_by: userId,
                resolved_at: new Date().toISOString()
            })
            .eq('id', impactId)
            .select()
            .single()

        if (error || !impact) {
            return {
                success: false,
                message: `Error al resolver impacto: ${error?.message}`
            }
        }

        // Emit RESOLVED event for the revision
        await emitEvent({
            revision_id: impact.revision_id,
            event_type: 'RESOLVED',
            payload: {
                impact_id: impactId,
                resolution_type: resolutionType
            },
            created_by: userId
        })

        return {
            success: true,
            message: 'Impacto resuelto',
            data: impact
        }

    } catch (error) {
        console.error('Error in resolveImpact:', error)
        return {
            success: false,
            message: 'Error inesperado'
        }
    }
}
