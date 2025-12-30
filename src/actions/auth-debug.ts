'use server'

import { createClient } from '@supabase/supabase-js'

export async function debugServerSignup(email: string) {
    console.log('🖥️ Server Action: Attempting to create user', email)

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
        // CALL RPC INSTEAD OF ADMIN API
        // We use bcryptjs to hash if needed, but for now let's use a standard implementation
        // or let the RPC handle encryption if we used pgcrypto (we enabled pgcrypto).
        // The RPC expects 'encrypted_password'. We can use pgcrypto's crypt() in SQL 
        // OR pass a pre-hashed string.
        // Let's modify the action to use Supabase RPC.

        // Note: hashing in node is better.
        const bcrypt = require('bcryptjs')
        const salt = bcrypt.genSaltSync(10)
        const passwordHash = bcrypt.hashSync('Password123!', salt)

        const { data, error } = await supabaseAdmin.rpc('create_auth_user_manual', {
            email_input: email,
            password_hash_input: passwordHash,
            full_name_input: 'Server Action RPC User'
        })

        if (error) {
            console.error('❌ RPC Error:', error)
            return { success: false, error: error.message, details: error }
        }

        console.log('✅ User created via RPC:', data)
        return { success: true, userId: data.user_id, result: data }

    } catch (e: any) {
        console.error('❌ Server Action Exception:', e)
        return { success: false, error: e.message }
    }
}
