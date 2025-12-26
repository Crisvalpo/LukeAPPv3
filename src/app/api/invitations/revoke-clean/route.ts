import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        // 1. Check for Service Role Key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) {
            return NextResponse.json({ success: false, message: 'Server Config Error: Missing Service Key' }, { status: 500 })
        }

        const body = await request.json()
        const { invitationId, userEmail } = body

        if (!invitationId) {
            return NextResponse.json({ success: false, message: 'Missing invitation_id' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // 2. Delete the invitation (Normal step)
        const { error: revError } = await supabaseAdmin
            .from('invitations')
            .delete()
            .eq('id', invitationId)

        if (revError) {
            console.error('Revoke Error:', revError)
            return NextResponse.json({ success: false, message: revError.message }, { status: 500 })
        }

        // 3. Optional: Delete the user if they were "unconfirmed" (Zombie)
        // Only if email is provided
        let zombieDeleted = false
        if (userEmail) {
            // Find user in Auth by email
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
            if (!listError && users) {
                // Exact match ignore case
                const zombie = users.find(u => u.email?.toLowerCase() === userEmail.toLowerCase())

                // CRITICAL CHECK: Only delete if they are NOT CONFIRMED (email_confirmed_at is null)
                // This ensures we don't delete real users who just happen to have a pending invite being cancelled.
                if (zombie && !zombie.email_confirmed_at) {
                    console.log(`💀 Deleting Zombie User: ${userEmail}`)
                    await supabaseAdmin.auth.admin.deleteUser(zombie.id)
                    zombieDeleted = true
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: zombieDeleted ? 'Invitación revocada y usuario no-confirmado eliminado.' : 'Invitación eliminada.'
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
