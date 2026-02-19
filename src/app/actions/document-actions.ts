'use server'

import { createClient } from '@/lib/supabase/server'
import { updateDocumentRevision } from '@/services/document-control'
import { ApiResponse } from '@/types'
import { RevisionStatusType } from '@/types/document-control'

export async function updateDocumentRevisionAction(
    revisionId: string,
    params: {
        status?: RevisionStatusType,
        file_url?: string,
        file_name?: string,
        file_size?: number,
        notes?: string
    }
): Promise<ApiResponse<void>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'No autenticado' }
    }

    return await updateDocumentRevision(revisionId, params, user.id)
}

interface PrepareRevisionParams {
    documentId: string
    projectId: string
    companyId: string
    revCode: string
    fileName: string
    fileSize: number,
    notes?: string
}

export async function prepareRevisionUploadAction(params: PrepareRevisionParams): Promise<ApiResponse<{ uploadPath: string, revisionId: string }>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'No autenticado' }
    }

    return await prepareRevisionUpload(user.id, params)
}
