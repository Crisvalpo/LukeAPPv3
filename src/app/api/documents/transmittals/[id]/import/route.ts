import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTransmittal } from '@/services/document-control'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id: transmittalId } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 })
    }

    try {
        const { items } = await req.json()
        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ success: false, message: 'Items inválidos' }, { status: 400 })
        }

        // 1. Get transmittal to ensure it exists and get project/company
        const transRes = await getTransmittal(transmittalId)
        if (!transRes.success || !transRes.data) {
            return NextResponse.json(transRes, { status: 404 })
        }
        const transmittal = transRes.data

        const results = []
        const errors = []

        for (const item of items) {
            try {
                // a. Check if Document Master exists by code
                let { data: docMaster } = await supabase
                    .from('document_master')
                    .select('id')
                    .eq('code', item.code)
                    .eq('project_id', transmittal.project_id)
                    .maybeSingle()

                if (!docMaster) {
                    const { data: newDoc, error: docError } = await supabase
                        .from('document_master')
                        .insert({
                            project_id: transmittal.project_id,
                            company_id: transmittal.company_id,
                            code: item.code,
                            title: item.title,
                            document_type_id: item.document_type_id,
                            specialty_id: item.specialty_id,
                            created_by: user.id
                        })
                        .select()
                        .single()

                    if (docError) throw docError
                    docMaster = newDoc
                }

                if (!docMaster) throw new Error('No se pudo crear o encontrar el Document Master')

                // b. Create Revision
                const { data: revision, error: revError } = await supabase
                    .from('document_revisions')
                    .insert({
                        document_id: docMaster.id,
                        rev_code: item.revision,
                        status: 'APPROVED', // Incoming docs are usually approved for us
                        file_url: item.file_url,
                        file_name: item.filename,
                        file_hash: item.file_hash,
                        file_size: item.file_size,
                        created_by: user.id
                    })
                    .select()
                    .single()

                if (revError) throw revError

                // c. Link to Transmittal
                await supabase
                    .from('transmittal_items')
                    .insert({
                        transmittal_id: transmittalId,
                        document_revision_id: revision.id,
                        purpose: 'RECEPCIÓN',
                        created_by: user.id
                    })

                // d. Piping Intelligence: If it's an ISO, register it
                // Pattern: Contains "ISO" and is a PDF
                if (item.code.includes('ISO') || item.filename.toUpperCase().includes('ISO')) {
                    // Check if already registered in isometrics
                    const { data: existingIso } = await supabase
                        .from('isometrics')
                        .select('id')
                        .eq('isometric_number', item.code)
                        .eq('project_id', transmittal.project_id)
                        .maybeSingle()

                    if (!existingIso) {
                        await supabase
                            .from('isometrics')
                            .insert({
                                project_id: transmittal.project_id,
                                isometric_number: item.code,
                                document_revision_id: revision.id,
                                status: 'ISSUED_FOR_CONSTRUCTION'
                            })
                    } else {
                        await supabase
                            .from('isometrics')
                            .update({ document_revision_id: revision.id })
                            .eq('id', existingIso.id)
                    }
                }

                results.push({ code: item.code, status: 'SUCCESS' })
            } catch (err: any) {
                errors.push({ code: item.code, error: err.message })
            }
        }

        // 2. Update transmittal status to PROCESSED
        if (errors.length === 0) {
            await supabase
                .from('transmittals')
                .update({ status: 'PROCESSED' })
                .eq('id', transmittalId)
        }

        return NextResponse.json({
            success: true,
            results,
            errors,
            message: `Procesados ${results.length} ítems. Fallidos: ${errors.length}`
        })

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
