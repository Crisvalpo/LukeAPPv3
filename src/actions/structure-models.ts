'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    getProjectStructureModels,
    createStructureModel,
    deleteStructureModel
} from '@/services/structure-models'

export async function getStructureModelsAction(projectId: string) {
    const supabase = await createClient()
    return await getProjectStructureModels(projectId, supabase)
}

export async function createStructureModelAction(formData: FormData) {
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string
    const area = formData.get('area') as string
    const file = formData.get('file') as File

    if (!projectId || !name || !file) {
        return {
            success: false,
            message: 'Faltan datos requeridos'
        }
    }

    // Parse spatial metadata from form fields (sent from client)
    const spatialData: any = {}
    const parseFloatValue = (value: string | null): number | undefined => value ? parseFloat(value) : undefined

    const posX = formData.get('position_x')
    const posY = formData.get('position_y')
    const posZ = formData.get('position_z')
    const rotX = formData.get('rotation_x')
    const rotY = formData.get('rotation_y')
    const rotZ = formData.get('rotation_z')
    const scaleX = formData.get('scale_x')
    const scaleY = formData.get('scale_y')
    const scaleZ = formData.get('scale_z')
    const metadata = formData.get('metadata')

    if (posX) spatialData.position_x = parseFloatValue(posX as string)
    if (posY) spatialData.position_y = parseFloatValue(posY as string)
    if (posZ) spatialData.position_z = parseFloatValue(posZ as string)
    if (rotX) spatialData.rotation_x = parseFloatValue(rotX as string)
    if (rotY) spatialData.rotation_y = parseFloatValue(rotY as string)
    if (rotZ) spatialData.rotation_z = parseFloatValue(rotZ as string)
    if (scaleX) spatialData.scale_x = parseFloatValue(scaleX as string)
    if (scaleY) spatialData.scale_y = parseFloatValue(scaleY as string)
    if (scaleZ) spatialData.scale_z = parseFloatValue(scaleZ as string)
    if (metadata) {
        try {
            spatialData.metadata = JSON.parse(metadata as string)
        } catch (e) {
            console.warn('Failed to parse metadata JSON:', e)
        }
    }

    const hasSpatialData = Object.keys(spatialData).length > 0

    const supabase = await createClient()
    const result = await createStructureModel(
        projectId,
        name,
        area,
        file,
        hasSpatialData ? spatialData : undefined,
        supabase
    )

    if (result.success) {
        revalidatePath('/project/settings') // Adjust path as needed
    }

    return result
}

export async function deleteStructureModelAction(modelId: string, modelUrl: string) {
    const supabase = await createClient()
    const result = await deleteStructureModel(modelId, modelUrl, supabase)

    if (result.success) {
        revalidatePath('/project/settings') // Adjust path as needed
    }

    return result
}

export async function getRevisionModelsAction(projectId: string) {
    const { getRevisionModels } = await import('@/services/isometrics')
    return await getRevisionModels(projectId)
}
