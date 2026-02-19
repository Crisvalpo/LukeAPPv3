import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTransmittal } from '@/services/document-control'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 })
    }

    try {
        const body = await req.json()

        const result = await createTransmittal(body, user.id, supabase)

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
