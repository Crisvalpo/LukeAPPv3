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

        // 2. Parse User ID
        const body = await request.json()
        const { userId } = body

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Missing user_id' },
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

        // 3.5. Clean up Invitations (by Email)
        // We need the email to find the invitations
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (user && user.email) {
            // Block deletion of Ghost Admin
            if (user.email === 'cristianluke@gmail.com') {
                return NextResponse.json(
                    { success: false, message: 'CRITICAL_SECURITY: Ghost Admin account cannot be deleted.' },
                    { status: 403 }
                )
            }

            console.log(`Cleaning invitations for email: ${user.email}`)
            const { error: inviteError } = await supabaseAdmin
                .from('invitations')
                .delete()
                .eq('email', user.email)

            if (inviteError) {
                console.warn('Warning: Could not clean up invitations:', inviteError)
            }
        }

        // 4. Delete User from Auth (Cascades to public.users -> public.members)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error('Error deleting auth user:', error)
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully from Auth and System.'
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
