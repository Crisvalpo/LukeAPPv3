
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, EngineeringRevision } from '@/types'

export interface IsometricMasterView {
    id: string
    iso_number: string
    area: string | null
    line_number: string | null
    sheet: string | null
    current_revision: EngineeringRevision | null
    revisions: EngineeringRevision[]
    stats: {
        total: number
        vigentes: number
        spooleadas: number
        obsoletas: number
        last_modified: string | null
    }
}

export interface SearchIsometricsFilters {
    status?: 'ALL' | 'VIGENTE' | 'SPOOLEADO' | 'PENDING'
}

/**
 * Search isometrics with pagination and detailed revision data
 * Optimized for Master View
 */
export async function searchIsometrics(
    projectId: string,
    query: string = '',
    offset: number = 0,
    limit: number = 20,
    filters: SearchIsometricsFilters = { status: 'ALL' }
): Promise<ApiResponse<IsometricMasterView[]>> {
    const supabase = await createClient()

    try {
        // 1. Base Query on Isometrics
        let dbQuery = supabase
            .from('isometrics')
            .select(`
                id,
                iso_number,
                area,
                line_number,
                sheet,
                created_at,
                updated_at,
                created_at,
                updated_at,
                engineering_revisions:engineering_revisions!engineering_revisions_isometric_id_fkey (
                    id,
                    rev_code,
                    revision_status,
                    welds_count,
                    spools_count,
                    announcement_date,
                    transmittal,
                    created_at,
                    project_id,
                    company_id
                )
            `)
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)


        // 2. Apply Search Filter
        if (query && query.trim() !== '') {
            const term = `%${query.trim()}%`
            dbQuery = dbQuery.ilike('iso_number', term)
        }

        const { data: isometrics, error } = await dbQuery

        if (error) {
            console.error('searchIsometrics DB error:', error)
            return {
                success: false,
                message: `Error al buscar isométricos: ${error.message}`,
                data: []
            }
        }

        console.log(`[SearchIsometrics] ProjectId: ${projectId}, Query: "${query}", Limit: ${limit}, Offset: ${offset}, Found: ${isometrics?.length || 0}`)

        if (!isometrics || isometrics.length === 0) {

            return {
                success: true,
                message: 'No se encontraron isométricos',
                data: []
            }
        }

        // 3. Process and Structure Data
        const masterViewData: IsometricMasterView[] = isometrics.map((iso: any) => {
            // Sort revisions: Descending by created_at (Newest first)
            const sortedRevisions = (iso.engineering_revisions || []).sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            // Determine Current Revision (VIGENTE or Newest)
            const vigentes = sortedRevisions.filter((r: any) => r.revision_status === 'VIGENTE')
            const current = vigentes.length > 0 ? vigentes[0] : sortedRevisions[0] || null

            // Calculate Stats
            const stats = {
                total: sortedRevisions.length,
                vigentes: vigentes.length,
                spooleadas: sortedRevisions.filter((r: any) => r.revision_status === 'SPOOLEADO').length,
                obsoletas: sortedRevisions.filter((r: any) =>
                    ['OBSOLETO', 'OBSOLETA', 'OBSOLETO_SPOOLEADO', 'ELIMINADO'].includes(r.revision_status)
                ).length,
                last_modified: current ? current.created_at : iso.created_at
            }

            // Map to EngineeringRevision type
            const mappedRevisions: EngineeringRevision[] = sortedRevisions.map((r: any) => ({
                id: r.id,
                isometric_id: iso.id,
                project_id: r.project_id,
                company_id: r.company_id,
                rev_code: r.rev_code,
                revision_status: r.revision_status,
                transmittal: r.transmittal,
                announcement_date: r.announcement_date,
                created_at: r.created_at,
                iso_number: iso.iso_number,
                welds_count: r.welds_count,
                spools_count: r.spools_count
            }))

            return {
                id: iso.id,
                iso_number: iso.iso_number,
                area: iso.area,
                line_number: iso.line_number,
                sheet: iso.sheet,
                current_revision: current ? { ...current, iso_number: iso.iso_number, isometric_id: iso.id } : null,
                revisions: mappedRevisions,
                stats
            }
        })

        // 4. Client-side Filter for Current Status (if passed)
        // Note: Doing this client-side for now as filtering parent by child status in Supabase is tricky in one query
        let filteredResult = masterViewData
        if (filters.status && filters.status !== 'ALL') {
            filteredResult = masterViewData.filter(item =>
                item.current_revision?.revision_status === filters.status
            )
        }

        return {
            success: true,
            message: 'Búsqueda completada',
            data: filteredResult
        }

    } catch (error) {
        console.error('Unexpected error in searchIsometrics:', error)
        return {
            success: false,
            message: 'Error inesperado al buscar isométricos',
            data: []
        }
    }
}
