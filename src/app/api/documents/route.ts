import { NextRequest, NextResponse } from 'next/server'
import { createDocument } from '@/services/document-control'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { project_id, company_id, document_type_id, specialty_id, area_id, title, description, file_name, file_size } = body

        if (!project_id || !company_id || !document_type_id || !title) {
            return NextResponse.json({ success: false, message: 'Faltan campos requeridos' }, { status: 400 })
        }

        const result = await createDocument(
            { project_id, company_id, document_type_id, specialty_id, area_id, title, description, file_name, file_size },
            user.id
        )

        return NextResponse.json(result, { status: result.success ? 201 : 400 })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
