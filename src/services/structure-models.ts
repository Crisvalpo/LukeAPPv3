import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ApiResponse, StructureModel } from '@/types'

export async function getProjectStructureModels(projectId: string, client?: SupabaseClient): Promise<ApiResponse<StructureModel[]>> {
    const supabase = client || createClient()
    try {
        const { data, error } = await supabase
            .from('structure_models')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching structure models:', error)
            return {
                success: false,
                message: `Error al cargar modelos estructurales: ${error.message}`
            }
        }

        return {
            success: true,
            message: 'Modelos cargados correctamente',
            data: data
        }
    } catch (error) {
        console.error('Unexpected error fetching structure models:', error)
        return {
            success: false,
            message: `Error inesperado: ${error}`
        }
    }
}

export async function deleteStructureModel(modelId: string, modelUrl: string, client?: SupabaseClient): Promise<ApiResponse<void>> {
    const supabase = client || createClient()
    try {
        // 1. Delete file from storage
        // Extract path from URL (assuming standard Supabase Storage URL format)
        // URL: .../storage/v1/object/public/structure-models/filename.glb
        const urlParts = modelUrl.split('/structure-models/')
        if (urlParts.length === 2) {
            const filePath = urlParts[1]
            const { error: storageError } = await supabase.storage
                .from('structure-models')
                .remove([filePath])

            if (storageError) {
                console.warn('Failed to delete file from storage', storageError)
                // Continue to delete record even if storage fails (orphan cleanup strategy)
            }
        }

        // 2. Delete record from database
        const { error } = await supabase
            .from('structure_models')
            .delete()
            .eq('id', modelId)

        if (error) {
            return {
                success: false,
                message: 'Error al eliminar el modelo'
            }
        }

        return {
            success: true,
            message: 'Modelo eliminado correctamente'
        }
    } catch (error) {
        console.error('Error deleting structure model:', error)
        return {
            success: false,
            message: 'Error inesperado al eliminar'
        }
    }
}

export async function createStructureModel(
    projectId: string,
    name: string,
    area: string,
    file: File,
    spatialData?: {
        position_x?: number
        position_y?: number
        position_z?: number
        rotation_x?: number
        rotation_y?: number
        rotation_z?: number
        scale_x?: number
        scale_y?: number
        scale_z?: number
        metadata?: any
    },
    client?: SupabaseClient
): Promise<ApiResponse<StructureModel>> {
    const supabase = client || createClient()
    try {
        // 1. Upload file
        const fileExt = 'glb' // Enforce GLB
        const fileName = `${projectId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('structure-models')
            .upload(fileName, file)

        if (uploadError) {
            return {
                success: false,
                message: `Error al subir archivo: ${uploadError.message}`
            }
        }

        const { data: publicUrlData } = supabase.storage
            .from('structure-models')
            .getPublicUrl(fileName)

        // 2. Insert record with spatial metadata (if provided)
        const insertData: any = {
            project_id: projectId,
            name: name,
            area: area,
            model_url: publicUrlData.publicUrl
        }

        // Add spatial metadata if provided from client-side extraction
        if (spatialData) {
            if (spatialData.position_x !== undefined) insertData.position_x = spatialData.position_x
            if (spatialData.position_y !== undefined) insertData.position_y = spatialData.position_y
            if (spatialData.position_z !== undefined) insertData.position_z = spatialData.position_z
            if (spatialData.rotation_x !== undefined) insertData.rotation_x = spatialData.rotation_x
            if (spatialData.rotation_y !== undefined) insertData.rotation_y = spatialData.rotation_y
            if (spatialData.rotation_z !== undefined) insertData.rotation_z = spatialData.rotation_z
            if (spatialData.scale_x !== undefined) insertData.scale_x = spatialData.scale_x
            if (spatialData.scale_y !== undefined) insertData.scale_y = spatialData.scale_y
            if (spatialData.scale_z !== undefined) insertData.scale_z = spatialData.scale_z
            if (spatialData.metadata) insertData.metadata = spatialData.metadata
        }

        const { data, error } = await supabase
            .from('structure_models')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            // Cleanup uploaded file if insert fails
            await supabase.storage.from('structure-models').remove([fileName])
            return {
                success: false,
                message: `Error al registrar modelo: ${error.message}`
            }
        }

        return {
            success: true,
            message: spatialData
                ? 'Modelo creado con metadatos espaciales'
                : 'Modelo creado correctamente',
            data: data
        }

    } catch (error) {
        console.error('Error creating structure model:', error)
        return {
            success: false,
            message: 'Error inesperado al crear modelo'
        }
    }
}
