'use server'

import { searchIsometrics, type SearchIsometricsFilters } from '@/services/isometrics'

export async function searchIsometricsAction(
    projectId: string,
    query: string = '',
    offset: number = 0,
    limit: number = 20,
    filters: SearchIsometricsFilters = { status: 'ALL' }
) {
    return await searchIsometrics(projectId, query, offset, limit, filters)
}
