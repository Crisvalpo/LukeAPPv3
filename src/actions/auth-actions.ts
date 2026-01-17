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

export async function checkUserExists(email: string) {
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
        // Option 1: Try Admin API listUsers (Not efficient for filtering)
        // Option 2: Direct query to auth.users (Efficient)
        // Note: We normally need to set schema to 'auth'
        // But some Supabase configurations restrict this even for service_role over HTTP?
        // Let's try.

        // Actually, easier way without schema hacking:
        // Attempt to generate a link? No.

        // Let's blindly try the schema approach.
        // If it fails, we default to false (or handle error).

        // BUT, since we are in a 'use server' file, we can't easily use "node-postgres" unless we install 'pg'.
        // We are using 'supabase-js'.

        // Let's try the .schema('auth') modifier.
        const { data, error } = await supabaseAdmin
            .schema('auth')
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (error) {
            console.warn('⚠️ Could not check user existence via query:', error.message)
            // Fallback: We can't know for sure. Return false to let the normal flow handle "Already Exists" error.
            return { exists: false, error: error.message }
        }

        return { exists: !!data, userId: data?.id }

    } catch (e: any) {
        console.error('Error checking user:', e)
        return { exists: false }
    }
}
