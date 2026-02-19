/**
 * Document Control Service
 * 
 * CRUD operations for the Document Control module.
 * All DB access is centralized here per DEVELOPMENT_STANDARDS.
 */

import { createClient } from '@/lib/supabase/client'
import { getProjectStoragePath, getDocumentRevisionStoragePath } from '@/lib/storage-paths'
import type { ApiResponse } from '@/types'
import type {
    DocumentType,
    DocumentMaster,
    DocumentRevision,
    Transmittal,
    DocumentEvent,
    ProjectDocumentConfig,
    CreateDocumentParams,
    CreateRevisionParams,
    CreateTransmittalParams,
    DocumentFilters,
    DocumentControlKPIs,
    RevisionStatusType as DocRevisionStatusType,
    ProjectArea
} from '@/types/document-control'
import {
    RevisionStatus,
    SpoolingStatus,
    RevisionStatusType,
    SpoolingStatusType,
    getCombinedStatusLabel,
    IsometricStatus // Legacy map if needed
} from '@/constants/isometric-status'
import { Isometric, EngineeringRevision } from '@/types'

// ===== STORAGE CONSTANTS =====
const BUCKET = 'project-files'
const DOC_REVISIONS_FOLDER = 'documents/revisions'
const DOC_TRANSMITTALS_FOLDER = 'documents/transmittals'

// ===== STORAGE HELPERS =====



/**
 * Upload a file to the document revision storage folder.
 * Returns the public URL on success.
 */
export async function uploadDocumentRevisionFile(
    company: { id: string; slug: string },
    project: { id: string; code?: string | null; name: string },
    documentCode: string,
    revCode: string,
    file: File | Blob,
    filename: string
): Promise<ApiResponse<{ url: string; path: string }>> {
    const supabase = await createClient()
    const storagePath = getDocumentRevisionStoragePath(company, project, documentCode, revCode, filename)

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { upsert: true })

    if (error) return { success: false, message: `Error al subir archivo: ${error.message}` }

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path)

    return {
        success: true,
        data: {
            url: urlData.publicUrl,
            path: data.path
        }
    }
}

/**
 * Delete a document revision file from storage.
 */
export async function deleteDocumentRevisionFile(storagePath: string): Promise<void> {
    const supabase = await createClient()
    // Extract relative path from full URL if needed
    let relativePath = storagePath
    if (storagePath.includes(`/${BUCKET}/`)) {
        const parts = storagePath.split(`/${BUCKET}/`)
        relativePath = parts[1] ? decodeURIComponent(parts[1]) : storagePath
    }
    await supabase.storage.from(BUCKET).remove([relativePath])
}

/**
 * Get a signed URL for private document download (valid 1 hour).
 */
export async function getDocumentSignedUrl(
    storagePath: string
): Promise<ApiResponse<string>> {
    const supabase = await createClient()
    let relativePath = storagePath
    if (storagePath.includes(`/${BUCKET}/`)) {
        const parts = storagePath.split(`/${BUCKET}/`)
        relativePath = parts[1] ? decodeURIComponent(parts[1]) : storagePath
    }
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(relativePath, 3600) // 1 hour

    if (error) return { success: false, message: error.message }
    return { success: true, data: data.signedUrl }
}

// ===== DOCUMENT TYPES =====

export async function getDocumentTypes(companyId: string): Promise<ApiResponse<DocumentType[]>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name')

    if (error) return { success: false, message: error.message }
    return { success: true, data: data || [] }
}

export async function getSpecialties(companyId: string): Promise<ApiResponse<{ id: string; name: string; code: string }[]>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('specialties')
        .select('id, name, code')
        .eq('company_id', companyId)
        .order('name')

    if (error) return { success: false, message: error.message }
    return { success: true, data: data || [] }
}

export async function getProjectAreas(projectId: string): Promise<ApiResponse<ProjectArea[]>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('project_areas')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('code')

    if (error) return { success: false, message: error.message }
    return { success: true, data: data || [] }
}

export async function createDocumentType(
    companyId: string,
    name: string,
    code: string,
    description?: string
): Promise<ApiResponse<DocumentType>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('document_types')
        .insert({ company_id: companyId, name, code: code.toUpperCase(), description })
        .select()
        .single()

    if (error) return { success: false, message: error.message }
    return { success: true, data }
}

// ===== PROJECT CONFIG =====

export async function getProjectDocumentConfig(
    projectId: string
): Promise<ApiResponse<ProjectDocumentConfig | null>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('project_document_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle()

    if (error) return { success: false, message: error.message }
    return { success: true, data }
}

export async function upsertProjectDocumentConfig(
    projectId: string,
    companyId: string,
    config: Partial<Pick<ProjectDocumentConfig, 'coding_pattern' | 'is_frozen'>>
): Promise<ApiResponse<ProjectDocumentConfig>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('project_document_config')
        .upsert({
            project_id: projectId,
            company_id: companyId,
            ...config,
            updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' })
        .select()
        .single()

    if (error) return { success: false, message: error.message }
    return { success: true, data }
}

// ===== DOCUMENTS =====

export async function getDocuments(
    projectId: string,
    filters?: DocumentFilters
): Promise<ApiResponse<DocumentMaster[]>> {
    const supabase = await createClient()
    let query = supabase
        .from('document_master')
        .select(`
            *,
            document_type:document_types(id, name, code),
            specialty:specialties(id, name, code),
            area:project_areas(id, name, code),
            current_revision:document_revisions!document_master_current_revision_id_fkey(id, rev_code, status, created_at)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (filters?.document_type_id) {
        query = query.eq('document_type_id', filters.document_type_id)
    }
    if (filters?.specialty_id) {
        query = query.eq('specialty_id', filters.specialty_id)
    }
    if (filters?.area_id) {
        query = query.eq('area_id', filters.area_id)
    }
    if (filters?.status) {
        query = query.eq('status', filters.status)
    }
    if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,document_code.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) return { success: false, message: error.message }
    return { success: true, data: data || [] }
}

export async function getDocumentWithRevisions(
    documentId: string
): Promise<ApiResponse<DocumentMaster & { revisions: DocumentRevision[] }>> {
    const supabase = await createClient()

    const { data: doc, error: docError } = await supabase
        .from('document_master')
        .select(`
            *,
            document_type:document_types(id, name, code),
            specialty:specialties(id, name, code),
            area:project_areas(id, name, code)
        `)
        .eq('id', documentId)
        .single()

    if (docError || !doc) return { success: false, message: docError?.message || 'Documento no encontrado' }

    const { data: revisions, error: revError } = await supabase
        .from('document_revisions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

    if (revError) return { success: false, message: revError.message }

    return {
        success: true,
        data: { ...doc, revisions: revisions || [] }
    }
}

export async function createDocument(
    params: CreateDocumentParams,
    userId: string
): Promise<ApiResponse<DocumentMaster>> {
    const supabase = await createClient()

    try {
        // 1. Get or create project config to generate code
        let { data: config } = await supabase
            .from('project_document_config')
            .select('*')
            .eq('project_id', params.project_id)
            .maybeSingle()

        if (!config) {
            const { data: newConfig, error: cfgError } = await supabase
                .from('project_document_config')
                .insert({
                    project_id: params.project_id,
                    company_id: params.company_id
                })
                .select()
                .single()
            if (cfgError) throw new Error(`Config error: ${cfgError.message}`)
            config = newConfig
        }

        // 1b. Get Company Slug (for storage paths)
        const { data: company } = await supabase
            .from('companies')
            .select('slug, id') // selecting id again just to be safe
            .eq('id', params.company_id)
            .single()

        if (!company) throw new Error('Company not found')

        // Check frozen
        if (config.is_frozen) {
            return { success: false, message: 'El proyecto está congelado para nuevos documentos.' }
        }

        // 2. Get doc type code for the document code
        const { data: docType } = await supabase
            .from('document_types')
            .select('code')
            .eq('id', params.document_type_id)
            .single()

        // 3. Get project code
        const { data: project } = await supabase
            .from('projects')
            .select('code')
            .eq('id', params.project_id)
            .single()

        // 4. Get specialty code if applicable
        let specialtyCode = 'GEN'
        if (params.specialty_id) {
            const { data: spec } = await supabase
                .from('specialties')
                .select('code')
                .eq('id', params.specialty_id)
                .single()
            if (spec) specialtyCode = spec.code
        }

        // 5. Generate document code
        const seq = String(config.next_sequence).padStart(4, '0')
        const documentCode = (config.coding_pattern || '{PROJECT_CODE}-{DOC_TYPE}-{SPECIALTY}-{SEQ}')
            .replace('{PROJECT_CODE}', project?.code || 'PRJ')
            .replace('{DOC_TYPE}', docType?.code || 'DOC')
            .replace('{SPECIALTY}', specialtyCode)
            .replace('{SEQ}', seq)

        // 6. Create document
        const { data: doc, error: docError } = await supabase
            .from('document_master')
            .insert({
                project_id: params.project_id,
                company_id: params.company_id,
                document_type_id: params.document_type_id,
                specialty_id: params.specialty_id || null,
                area_id: params.area_id || null,
                document_code: documentCode,
                title: params.title,
                description: params.description || null,
                created_by: userId
            })
            .select(`
                *,
                document_type:document_types(id, name, code),
                specialty:specialties(id, name, code),
                area:project_areas(id, name, code),
                current_revision:document_revisions!document_master_current_revision_id_fkey(id, rev_code, status, created_at)
            `)
            .single()

        if (docError) throw new Error(docError.message)

        // 7. Increment sequence
        await supabase
            .from('project_document_config')
            .update({ next_sequence: config.next_sequence + 1, updated_at: new Date().toISOString() })
            .eq('id', config.id)

        // 8. Log event
        await supabase.from('document_event_log').insert({
            document_id: doc.id,
            project_id: params.project_id,
            company_id: params.company_id,
            event_type: 'CREATED',
            payload: { document_code: documentCode, title: params.title },
            created_by: userId
        })

        // 9. Handle file upload if present
        let uploadPath = undefined
        let revisionId = undefined

        if (params.file_name) {
            const revCode = '0' // Initial revision
            const safeFileName = params.file_name.replace(/[^a-zA-Z0-9._-]/g, '_')

            // Generate path
            const path = getDocumentRevisionStoragePath(
                { id: company.id, slug: company.slug },
                { id: (project as any).id ?? '', code: project!.code, name: 'Project' }, // Name optional in helper if code present
                documentCode,
                revCode,
                safeFileName
            )

            // Create Revision
            const { data: rev, error: revError } = await supabase
                .from('document_revisions')
                .insert({
                    document_id: doc.id,
                    project_id: params.project_id,
                    company_id: params.company_id,
                    rev_code: revCode,
                    status: 'DRAFT', // Pending upload
                    file_name: params.file_name,
                    file_size: params.file_size || 0,
                    created_by: userId
                })
                .select()
                .single()

            if (revError) throw new Error(`Revision error: ${revError.message}`)

            // Update Document with current revision
            await supabase
                .from('document_master')
                .update({ current_revision_id: rev.id })
                .eq('id', doc.id)

            // Log Revision Event
            await supabase.from('document_event_log').insert({
                document_id: doc.id,
                revision_id: rev.id,
                project_id: params.project_id,
                company_id: params.company_id,
                event_type: 'REVISION_UPLOADED',
                payload: { rev_code: revCode, file_name: params.file_name, status: 'PENDING_UPLOAD' },
                created_by: userId
            })

            uploadPath = path
            revisionId = rev.id
        }

        return { success: true, data: { ...doc, uploadPath, revisionId } }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

// ===== REVISIONS =====

export async function createRevision(
    params: CreateRevisionParams,
    projectId: string,
    companyId: string,
    userId: string
): Promise<ApiResponse<DocumentRevision>> {
    const supabase = await createClient()

    try {
        // 1. Supersede previous current revision
        const { data: doc } = await supabase
            .from('document_master')
            .select('current_revision_id')
            .eq('id', params.document_id)
            .single()

        if (doc?.current_revision_id) {
            await supabase
                .from('document_revisions')
                .update({ status: 'SUPERSEDED', updated_at: new Date().toISOString() })
                .eq('id', doc.current_revision_id)
        }

        // 2. Create new revision
        const { data: revision, error } = await supabase
            .from('document_revisions')
            .insert({
                document_id: params.document_id,
                project_id: projectId,
                company_id: companyId,
                rev_code: params.rev_code,
                file_url: params.file_url || null,
                file_name: params.file_name || null,
                file_size: params.file_size || null,
                notes: params.notes || null,
                created_by: userId
            })
            .select()
            .single()

        if (error) throw new Error(error.message)

        // 3. Update document_master.current_revision_id
        await supabase
            .from('document_master')
            .update({ current_revision_id: revision.id, updated_at: new Date().toISOString() })
            .eq('id', params.document_id)

        // 4. Log event
        await supabase.from('document_event_log').insert({
            document_id: params.document_id,
            revision_id: revision.id,
            project_id: projectId,
            company_id: companyId,
            event_type: 'REVISION_UPLOADED',
            payload: { rev_code: params.rev_code, file_name: params.file_name },
            created_by: userId
        })

        return { success: true, data: revision }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

// ===== TRANSMITTALS =====

export async function getTransmittals(
    projectId: string
): Promise<ApiResponse<Transmittal[]>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transmittals')
        .select(`
            *,
            transmittal_items(count)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) return { success: false, message: error.message }

    // Map count
    const mapped = (data || []).map((t: any) => ({
        ...t,
        items_count: t.transmittal_items?.[0]?.count || 0,
        transmittal_items: undefined
    }))

    return { success: true, data: mapped }
}

export async function getTransmittal(
    transmittalId: string
): Promise<ApiResponse<Transmittal>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transmittals')
        .select(`
            *,
            transmittal_items(
                *,
                document_revision:document_revisions(*)
            )
        `)
        .eq('id', transmittalId)
        .single()

    if (error) return { success: false, message: error.message }

    return {
        success: true,
        data: {
            ...data,
            items_count: data.transmittal_items?.length || 0
        }
    }
}

export async function createTransmittal(
    params: CreateTransmittalParams,
    userId: string,
    supabaseClient?: any // Optional injected client (for Server Actions/API routes)
): Promise<ApiResponse<Transmittal>> {
    const supabase = supabaseClient || await createClient()

    try {
        // 1. Get next transmittal number
        const { count } = await supabase
            .from('transmittals')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', params.project_id)

        const nextNum = String((count || 0) + 1).padStart(3, '0')
        const transmittalCode = `TRN-${nextNum}`

        // 2. Create transmittal
        const { data: transmittal, error } = await supabase
            .from('transmittals')
            .insert({
                project_id: params.project_id,
                company_id: params.company_id,
                transmittal_code: transmittalCode,
                title: params.title || null,
                recipient: params.recipient || null,
                notes: params.notes || null,
                direction: params.direction || 'OUTGOING',
                package_url: params.package_url || null,
                manifest_url: params.manifest_url || null,
                created_by: userId,
                status: params.direction === 'INCOMING' ? 'PENDING_PROCESS' : 'DRAFT'
            })
            .select()
            .single()

        if (error) throw new Error(error.message)

        // 3. Create items
        if (params.items.length > 0) {
            const items = params.items.map((item) => ({
                transmittal_id: transmittal.id,
                document_revision_id: item.document_revision_id,
                purpose: item.purpose || 'FOR_APPROVAL'
            }))

            const { error: itemsError } = await supabase
                .from('transmittal_items')
            if (itemsError) throw new Error(itemsError.message)
        }

        return { success: true, data: { ...transmittal, items_count: params.items.length } }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

export async function deleteTransmittal(
    transmittalId: string,
    redirectPath?: string // Optional path to revalidate
): Promise<ApiResponse<void>> {
    const supabase = await createClient()

    try {
        // 1. Get transmittal details (for file cleanup)
        const { data: transmittal } = await supabase
            .from('transmittals')
            .select('transmittal_code, package_url, manifest_url')
            .eq('id', transmittalId)
            .single()

        // 2. Delete items (Cascade usually handles this, but explicit is safer)
        const { error: itemsError } = await supabase
            .from('transmittal_items')
            .delete()
            .eq('transmittal_id', transmittalId)

        if (itemsError) throw new Error(`Error deleting items: ${itemsError.message}`)

        // 3. Delete transmittal
        const { error: deleteError } = await supabase
            .from('transmittals')
            .delete()
            .eq('id', transmittalId)

        if (deleteError) throw new Error(`Error deleting transmittal: ${deleteError.message}`)

        // 4. Cleanup Storage (Optional/Background)
        // We attempt to delete the package folder if it matches the code
        if (transmittal) {
            // TODO: Implement storage cleanup logic if strictly needed.
            // For now, we leave files as backup or manual cleanup to avoid accidental data loss.
        }

        return { success: true }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

// ===== EVENT LOG =====

export async function getDocumentEvents(
    documentId: string
): Promise<ApiResponse<DocumentEvent[]>> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('document_event_log')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

    if (error) return { success: false, message: error.message }
    return { success: true, data: data || [] }
}

// ===== KPIs =====

export async function getDocumentControlKPIs(
    projectId: string
): Promise<ApiResponse<DocumentControlKPIs>> {
    const supabase = await createClient()

    try {
        // Total documents
        const { count: totalDocs } = await supabase
            .from('document_master')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'ACTIVE')

        // Pending review
        const { count: pendingReview } = await supabase
            .from('document_revisions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'UNDER_REVIEW')

        // Approved this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: approvedMonth } = await supabase
            .from('document_revisions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'APPROVED')
            .gte('reviewed_at', startOfMonth.toISOString())

        // Transmittals this month
        const { count: transmittalsMonth } = await supabase
            .from('transmittals')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('created_at', startOfMonth.toISOString())

        return {
            success: true,
            data: {
                total_documents: totalDocs || 0,
                pending_review: pendingReview || 0,
                approved_this_month: approvedMonth || 0,
                transmittals_this_month: transmittalsMonth || 0
            }
        }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

// ===== ISOMETRICS BRIDGE (CD <-> ENGINEERING) =====

/**
 * Register an isometric received via Transmittal.
 * Creates/Updates: DocumentMaster -> Isometric -> DocumentRevision -> EngineeringRevision
 */
export async function registerIsometricFromTransmittal(
    params: {
        projectId: string
        companyId: string
        transmittalId: string
        isometricNumber: string // Serves as DocumentCode
        revisionLabel: string // e.g., "0", "A", "1"
        fileUrl: string | null
        fileName: string | null
        fileSize: number | null
        userId: string
    }
): Promise<ApiResponse<{ isometricId: string; revisionId: string }>> {
    const supabase = await createClient()
    const {
        projectId, companyId, transmittalId, isometricNumber,
        revisionLabel, fileUrl, fileName, fileSize, userId
    } = params

    try {
        // 1. Get or Create Document Master (Type: ISOMETRIC)
        // We assume 'ISOMETRIC' type exists or we use a default. 
        // For now, we search by code.
        let documentId: string

        const { data: existingDoc } = await supabase
            .from('document_master')
            .select('id')
            .eq('project_id', projectId)
            .eq('document_code', isometricNumber)
            .maybeSingle()

        if (existingDoc) {
            documentId = existingDoc.id
        } else {
            // Find "ISOMETRIC" type or default
            const { data: isoType } = await supabase
                .from('document_types')
                .select('id')
                .eq('company_id', companyId)
                .ilike('name', '%isometric%') // Loose match for now
                .limit(1)
                .maybeSingle()

            // Fallback: Pick first type if no ISO type found (should be handled better in prod)
            const typeId = isoType?.id || (await supabase.from('document_types').select('id').eq('company_id', companyId).limit(1).single()).data?.id

            if (!typeId) throw new Error('No Document Types defined for company')

            const { data: newDoc, error: docError } = await supabase
                .from('document_master')
                .insert({
                    project_id: projectId,
                    company_id: companyId,
                    document_type_id: typeId,
                    document_code: isometricNumber,
                    title: `Isométrico ${isometricNumber}`,
                    status: 'ACTIVE',
                    created_by: userId
                })
                .select()
                .single()

            if (docError) throw new Error(`Error creating Document: ${docError.message}`)
            documentId = newDoc.id
        }

        // 2. Supersede previous Document Revisions
        await supabase
            .from('document_revisions')
            .update({ status: 'SUPERSEDED' })
            .eq('document_id', documentId)
            .neq('rev_code', revisionLabel) // Safety check

        // 3. Create Document Revision
        const { data: docRev, error: revError } = await supabase
            .from('document_revisions')
            .insert({
                document_id: documentId,
                project_id: projectId,
                company_id: companyId,
                rev_code: revisionLabel,
                status: 'APPROVED', // Isometrics form Transmittals are usually approved for construction/use
                file_url: fileUrl,
                file_name: fileName,
                file_size: fileSize,
                created_by: userId
            })
            .select()
            .single()

        if (revError) throw new Error(`Error creating Doc Revision: ${revError.message}`)

        // 4. Update Document Master current revision
        await supabase
            .from('document_master')
            .update({ current_revision_id: docRev.id })
            .eq('id', documentId)

        // 5. Link to Transmittal
        await supabase
            .from('transmittal_items')
            .insert({
                transmittal_id: transmittalId,
                document_revision_id: docRev.id,
                purpose: 'FOR_CONSTRUCTION'
            })

        // 6. Get or Create Isometric (Legacy/Engineering Table)
        let isometricId: string
        const { data: existingIso } = await supabase
            .from('isometrics')
            .select('id')
            .eq('project_id', projectId)
            .eq('isometric_id', isometricNumber)
            .maybeSingle()

        if (existingIso) {
            isometricId = existingIso.id
            // Update status: Revision becomes VIGENTE, Spooling RESET to SIN_SPOOLEAR for new rev?
            // Actually, if it's a new revision, it needs spooling.
            await supabase
                .from('isometrics')
                .update({
                    document_id: documentId, // Ensure link
                    rev_id: revisionLabel,
                    revision_status: RevisionStatus.VIGENTE,
                    spooling_status: SpoolingStatus.SIN_SPOOLEAR, // Reset spooling for new rev
                    updated_at: new Date().toISOString()
                })
                .eq('id', isometricId)
        } else {
            const { data: newIso, error: isoError } = await supabase
                .from('isometrics')
                .insert({
                    project_id: projectId,
                    company_id: companyId,
                    isometric_id: isometricNumber,
                    rev_id: revisionLabel,
                    document_id: documentId,
                    revision_status: RevisionStatus.VIGENTE,
                    spooling_status: SpoolingStatus.SIN_SPOOLEAR
                })
                .select()
                .single()

            if (isoError) throw new Error(`Error creating Isometric: ${isoError.message}`)
            isometricId = newIso.id
        }

        // 7. Create Engineering Revision (Spooling Control)
        const { data: engRev, error: engError } = await supabase
            .from('engineering_revisions')
            .insert({
                isometric_id: isometricId,
                project_id: projectId,
                company_id: companyId,
                rev_code: revisionLabel,
                revision_status: 'VIGENTE',
                spooling_status: 'SIN_SPOOLEAR', // Explicit legacy fields usage
                document_revision_id: docRev.id, // Link to CD
                data_status: 'VACIO',
                material_status: 'NO_REQUERIDO',
                pdf_url: fileUrl,
                created_by: userId
            })
            .select()
            .single()

        if (engError && !engError.message.includes('duplicate')) {
            throw new Error(`Error creating Engineering Revision: ${engError.message}`)
        }

        return { success: true, data: { isometricId, revisionId: docRev.id } }

    } catch (err: any) {
        console.error('registerIsometricFromTransmittal Error:', err)
        return { success: false, message: err.message }
    }
}

/**
 * Get the Control Table data for Isometrics.
 * Joins isometrics, document_master, pending status.
 */
export async function getIsometricControlTable(
    projectId: string,
    filters?: {
        revisionStatus?: RevisionStatusType
        spoolingStatus?: SpoolingStatusType
        search?: string
    }
): Promise<ApiResponse<any[]>> {
    const supabase = await createClient()

    let query = supabase
        .from('isometrics')
        .select(`
            id,
            isometric_id,
            rev_id,
            revision_status,
            spooling_status,
            updated_at,
            document_master!document_id (
                id, document_code, title, current_revision_id
            )
        `)
        .eq('project_id', projectId)
        .order('isometric_id', { ascending: true })

    if (filters?.revisionStatus) {
        query = query.eq('revision_status', filters.revisionStatus)
    }
    if (filters?.spoolingStatus) {
        query = query.eq('spooling_status', filters.spoolingStatus)
    }
    if (filters?.search) {
        query = query.ilike('isometric_id', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) return { success: false, message: error.message }

    // Flatten and Enhance
    // We also need the latest engineering info (spooling dates)
    // For performance, we might want to fetch eng revisions separately or join them if RLS permits.
    // Let's do a second fetch for active engineering revisions to get spooling dates.

    // Optimisation: Fetch only latest eng revs for these isos
    const isoIds = data?.map(d => d.id) || []
    let engRevsMap = new Map<string, any>()

    if (isoIds.length > 0) {
        const { data: engRevs } = await supabase
            .from('engineering_revisions')
            .select('isometric_id, spooling_date, delivery_date, delivery_transmittal_code, pdf_url')
            .in('isometric_id', isoIds)
            .eq('revision_status', 'VIGENTE') // Only care about current

        engRevs?.forEach(r => engRevsMap.set(r.isometric_id, r))
    }

    const flattened = data?.map((iso: any) => {
        const engRev = engRevsMap.get(iso.id)
        return {
            id: iso.id,
            document_id: iso.document_master?.id,
            iso_number: iso.isometric_id,
            revision: iso.rev_id,
            title: iso.document_master?.title,
            revision_status: iso.revision_status,
            spooling_status: iso.spooling_status,
            combined_status: getCombinedStatusLabel(iso.revision_status, iso.spooling_status),
            spooling_date: engRev?.spooling_date || null,
            delivery_date: engRev?.delivery_date || null,
            delivery_transmittal: engRev?.delivery_transmittal_code || null,
            file_url: engRev?.pdf_url || null
        }
    }) || []

    return { success: true, data: flattened }
}

/**
 * Update Spooling Status for an Isometric (and its current engineering revision).
 */
export async function updateSpoolingStatus(
    isometricId: string,
    newStatus: SpoolingStatusType,
    userId: string
): Promise<ApiResponse<void>> {
    const supabase = await createClient()

    try {
        // 1. Update Isometric master
        const { error: isoError } = await supabase
            .from('isometrics')
            .update({
                spooling_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', isometricId)

        if (isoError) throw isoError

        // 2. Update current Engineering Revision
        // We assume we are updating the VIGENTE one.
        const updatePayload: any = {
            spooling_status: newStatus,
            updated_at: new Date().toISOString()
        }

        // If status is SPOOLEADO, set date if not set
        const isSpooled = newStatus === SpoolingStatus.SPOOLEADO || newStatus === SpoolingStatus.SPOOLEADO_MANUAL
        if (isSpooled) {
            updatePayload.spooling_date = new Date().toISOString()
        }

        await supabase
            .from('engineering_revisions')
            .update(updatePayload)
            .eq('isometric_id', isometricId)
            .eq('revision_status', 'VIGENTE')

        return { success: true }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

/**
 * Register Delivery (Envío) for an Isometric.
 */
export async function updateDeliveryInfo(
    isometricId: string,
    transmittalCode: string,
    deliveryDate: Date,
    userId: string
): Promise<ApiResponse<void>> {
    const supabase = await createClient()

    try {
        // Update current Engineering Revision
        const { error } = await supabase
            .from('engineering_revisions')
            .update({
                delivery_date: deliveryDate.toISOString(),
                delivery_transmittal_code: transmittalCode,
                updated_at: new Date().toISOString()
            })
            .eq('isometric_id', isometricId)
            .eq('revision_status', 'VIGENTE')

        if (error) throw error

        return { success: true }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}


// ===== REVISION UPDATES =====

/**
 * Update document revision details (e.g., status, file info).
 * Also logs the event.
 */
export async function updateDocumentRevision(
    revisionId: string,
    params: {
        status?: DocRevisionStatusType,
        file_url?: string,
        file_name?: string,
        file_size?: number,
        notes?: string
    },
    userId: string
): Promise<ApiResponse<void>> {
    const supabase = await createClient()

    try {
        const { status, file_url, file_name, file_size, notes } = params
        if (Object.keys(params).length === 0) return { success: true }

        // 1. Get current revision to log changes (optional optimization: skip read)
        const { data: currentRev } = await supabase
            .from('document_revisions')
            .select('document_id, project_id, company_id, status')
            .eq('id', revisionId)
            .single()

        if (!currentRev) throw new Error('Revision not found')

        // 2. Update Revision
        const { error: updateError } = await supabase
            .from('document_revisions')
            .update({
                ...(status && { status }),
                ...(file_url && { file_url }),
                ...(file_name && { file_name }),
                ...(file_size && { file_size }),
                ...(notes && { notes }),
                updated_at: new Date().toISOString()
            })
            .eq('id', revisionId)

        if (updateError) throw new Error(`Update error: ${updateError.message}`)

        // 3. Log Event if Status Changed or File Uploaded
        let eventType = null
        const payload: any = {}

        if (status && status !== currentRev.status) {
            eventType = 'STATUS_CHANGED'
            payload.old_status = currentRev.status
            payload.new_status = status
        }

        if (file_url) {
            // Prioritize upload event over status change if both happened (e.g. pending -> approved)
            eventType = 'REVISION_UPLOADED'
            payload.file_name = file_name
        }

        if (eventType) {
            await supabase.from('document_event_log').insert({
                document_id: currentRev.document_id,
                revision_id: revisionId,
                project_id: currentRev.project_id,
                company_id: currentRev.company_id,
                event_type: eventType,
                payload,
                created_by: userId
            })
        }

        return { success: true }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}


// ===== DETAILS & HISTORY =====

/**
 * Get full document details including type, specialty, and current revision.
 */
export async function getDocumentDetails(documentId: string): Promise<ApiResponse<DocumentMaster>> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('document_master')
            .select(`
                *,
                document_type:document_types(id, name, code),
                specialty:specialties(id, name, code),
                current_revision:document_revisions!current_revision_id(
                    *,
                    creator:created_by(full_name, email),
                    reviewer:reviewed_by(full_name, email)
                )
            `)
            .eq('id', documentId)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

/**
 * Get all revisions for a document, ordered by creation date (desc).
 */
export async function getDocumentRevisions(documentId: string): Promise<ApiResponse<DocumentRevision[]>> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('document_revisions')
            .select(`
                *,
                creator:created_by(full_name, email),
                reviewer:reviewed_by(full_name, email)
            `)
            .eq('document_id', documentId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

/**
 * Get history/event log for a document.
 */
export async function getDocumentHistory(documentId: string): Promise<ApiResponse<DocumentEvent[]>> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('document_event_log')
            .select(`
                *,
                creator:created_by(full_name, email)
            `)
            .eq('document_id', documentId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

/**
 * Prepare a new revision for upload.
 * Creates a DRAFT revision and returns the storage path.
 */
export async function prepareRevisionUpload(
    userId: string,
    params: {
        documentId: string,
        projectId: string,
        companyId: string,
        revCode: string,
        fileName: string,
        fileSize: number,
        notes?: string
    }
): Promise<ApiResponse<{ uploadPath: string, revisionId: string }>> {
    const supabase = await createClient()

    try {
        // 1. Get Company Slug and Project Code for path
        const { data: company } = await supabase
            .from('companies')
            .select('slug, id')
            .eq('id', params.companyId)
            .single()

        if (!company) throw new Error('Company not found')

        const { data: project } = await supabase
            .from('projects')
            .select('code, id')
            .eq('id', params.projectId)
            .single()

        if (!project) throw new Error('Project not found')

        // 2. Get Document Code
        const { data: doc } = await supabase
            .from('document_master')
            .select('document_code')
            .eq('id', params.documentId)
            .single()

        if (!doc) throw new Error('Document not found')

        // 3. Generate Path
        const safeFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        const uploadPath = getDocumentRevisionStoragePath(
            { id: company.id, slug: company.slug },
            { id: project.id, code: project.code, name: 'Project' },
            doc.document_code,
            params.revCode,
            safeFileName
        )

        // 4. Create Revision (DRAFT)
        const { data: rev, error: revError } = await supabase
            .from('document_revisions')
            .insert({
                document_id: params.documentId,
                project_id: params.projectId,
                company_id: params.companyId,
                rev_code: params.revCode,
                status: 'DRAFT',
                file_name: params.fileName,
                file_size: params.fileSize,
                notes: params.notes || null,
                created_by: userId
            })
            .select()
            .single()

        if (revError) throw new Error(`Revision error: ${revError.message}`)

        // 5. Log Event
        await supabase.from('document_event_log').insert({
            document_id: params.documentId,
            revision_id: rev.id,
            project_id: params.projectId,
            company_id: params.companyId,
            event_type: 'REVISION_UPLOADED',
            payload: { rev_code: params.revCode, file_name: params.fileName, status: 'PENDING_UPLOAD' },
            created_by: userId
        })

        return { success: true, data: { uploadPath, revisionId: rev.id } }

    } catch (err: any) {
        return { success: false, message: err.message }
    }
}


/**
 * Search documents for transmittal selection.
 * Returns documents with their current revision.
 */
export async function searchDocuments(
    projectId: string,
    query: string
): Promise<ApiResponse<DocumentMaster[]>> {
    const supabase = await createClient()

    try {
        let sql = supabase
            .from('document_master')
            .select(`
                *,
                document_type:document_types(code),
                current_revision:document_revisions!current_revision_id(
                    id, rev_code, status, file_name, file_url
                )
            `)
            .eq('project_id', projectId)
            .eq('status', 'ACTIVE') // Only active docs
            .not('current_revision_id', 'is', null) // Only docs with revisions
            .limit(20)

        if (query) {
            sql = sql.or(`document_code.ilike.%${query}%,title.ilike.%${query}%`)
        }

        const { data, error } = await sql

        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

