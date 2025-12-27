/**
 * Production Mockups Service
 * 
 * Helper functions to query mockup production data and determine
 * production status for revision impact detection.
 * 
 * NOTE: These are TEMPORARY mockup helpers for testing.
 * They will be replaced when the real field execution phase is implemented.
 */

import { createClient } from '@/lib/supabase/server'
import type { ProductionStatus, ProductionLevel, Spool } from '@/types'

/**
 * Get production status for a specific spool
 */
export async function getProductionStatus(spoolId: string): Promise<ProductionStatus> {
    const supabase = await createClient()

    // Get spool with related welds
    const { data: spool, error } = await supabase
        .from('spools')
        .select(`
            *,
            welds (*)
        `)
        .eq('id', spoolId)
        .single()

    if (error || !spool) {
        return {
            hasFabrication: false,
            hasWelds: false,
            hasDispatch: false
        }
    }

    return {
        hasFabrication: spool.fabrication_status === 'FABRICATED' ||
            spool.fabrication_status === 'DISPATCHED' ||
            spool.fabrication_status === 'INSTALLED',
        hasWelds: spool.welds?.some((w: any) => w.status === 'EXECUTED') || false,
        hasDispatch: !!spool.dispatched_at
    }
}

/**
 * Classify production level based on status
 * 
 * ENGINEERING_ONLY: No fabrication started
 * FABRICATED_ONLY: Fabricated but not executed (no welds)
 * IN_PROGRESS: Has executed welds or dispatched
 */
export function classifyProductionLevel(status: ProductionStatus): ProductionLevel {
    if (!status.hasFabrication) {
        return 'ENGINEERING_ONLY' // Caso A: Sin producción
    }

    if (status.hasFabrication && !status.hasWelds) {
        return 'FABRICATED_ONLY' // Caso B: Spooleado pero no ejecutado
    }

    if (status.hasWelds || status.hasDispatch) {
        return 'IN_PROGRESS' // Caso C: Obra en marcha
    }

    return 'ENGINEERING_ONLY'
}

/**
 * Get all spools affected by an isometric revision
 */
export async function getAffectedSpools(isometricId: string, projectId: string) {
    const supabase = await createClient()

    const { data: spools, error } = await supabase
        .from('spools')
        .select(`
            *,
            welds (*)
        `)
        .eq('isometric_id', isometricId)
        .eq('project_id', projectId)

    if (error) {
        console.error('Error fetching affected spools:', error)
        return []
    }

    return spools || []
}

/**
 * Check if revision should auto-apply (no production impacts)
 */
export async function canAutoApplyRevision(isometricId: string, projectId: string): Promise<boolean> {
    const spools = await getAffectedSpools(isometricId, projectId)

    // If no spools exist, can auto-apply
    if (spools.length === 0) {
        return true
    }

    // Check if any spool has production
    for (const spool of spools) {
        const status = await getProductionStatus(spool.id)
        const level = classifyProductionLevel(status)

        // If any spool has production, cannot auto-apply
        if (level !== 'ENGINEERING_ONLY') {
            return false
        }
    }

    return true
}
