'use server'

import { createClient } from '@supabase/supabase-js'

/**
 * Creates a user directly using Supabase Admin API.
 * This will automatically trigger handle_new_user to create the profile in public.users.
 * The user will be AUTO-CONFIRMED.
 */
export async function createUserBackend(email: string, password: string, fullName: string) {
    console.log('🔒 Backend Action: Creating user via Admin API:', email)

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        // Use Admin API to create user (bypasses email confirmation)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,  // Auto-confirm email
            user_metadata: {
                full_name: fullName
            }
        })

        if (error) {
            console.error('❌ Admin API Creation Error:', error)
            return { success: false, error: error.message, details: error }
        }

        console.log('✅ User created via Admin API:', data.user.id)
        return { success: true, userId: data.user.id, result: data }

    } catch (e: any) {
        console.error('❌ Backend Action Exception:', e)
        return { success: false, error: e.message }
    }
}
