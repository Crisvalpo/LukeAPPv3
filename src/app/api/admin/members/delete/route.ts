import { createClient } from '@supabase/supabase-js'
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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // 4. Delete Member Record (Safe Unlink)
        // This only removes the relationship, keeping the Auth User intact.
        const { error } = await supabaseAdmin
            .from('members')
            .delete()
            .eq('id', memberId)

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
