import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        // 1. Check for Service Role Key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'CONFIG_ERROR: Missing SUPABASE_SERVICE_ROLE_KEY in server environment.'
                },
                { status: 500 }
            )
        }

        // 2. Parse Member ID
        const body = await request.json()
        const { memberId } = body

        if (!memberId) {
            return NextResponse.json(
                { success: false, message: 'Missing member_id' },
                { status: 400 }
            )
        }

        // 3. Init Admin Client
        const { createAdminClient } = await import('@/lib/supabase/server')
        const supabaseAdmin = createAdminClient()

        // 3.5. Block deletion of Ghost Admin Account
        const { data: memberData } = await supabaseAdmin
            .from('members')
            .select('users(email)')
            .eq('id', memberId)
            .single()

        const targetEmail = (memberData?.users as any)?.email
        if (targetEmail === 'cristianluke@gmail.com') {
            return NextResponse.json(
                { success: false, message: 'CRITICAL_SECURITY: Ghost Admin account cannot be deleted.' },
                { status: 403 }
            )
        }

        // 4. Delete Member using SECURITY DEFINER function (bypasses RLS)
        const { data, error } = await supabaseAdmin
            .rpc('admin_delete_member', { target_member_id: memberId })

        if (error) {
            console.error('Error deleting member:', error)
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Member removed successfully (Unlinked).'
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
