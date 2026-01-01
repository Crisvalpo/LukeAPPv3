'use server'

/**
 * Server Actions: Weld Type Configuration
 * Exposes weld type management to client components
 */

import {
    getProjectWeldTypes,
    getWeldTypeConfig,
    createWeldType,
    updateWeldType,
    deleteWeldType,
    type CreateWeldTypeParams,
    type UpdateWeldTypeParams
} from '@/services/weld-types'

export async function getProjectWeldTypesAction(projectId: string) {
    return await getProjectWeldTypes(projectId)
}

export async function getWeldTypeConfigAction(projectId: string, typeCode: string) {
    return await getWeldTypeConfig(projectId, typeCode)
}

export async function createWeldTypeAction(params: CreateWeldTypeParams) {
    return await createWeldType(params)
}

export async function updateWeldTypeAction(typeId: string, updates: UpdateWeldTypeParams) {
    return await updateWeldType(typeId, updates)
}

export async function deleteWeldTypeAction(typeId: string) {
    return await deleteWeldType(typeId)
}
