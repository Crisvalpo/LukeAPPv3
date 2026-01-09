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

    const supabase = await createClient()
    const result = await createStructureModel(projectId, name, area, file, supabase)

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
