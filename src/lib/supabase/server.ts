import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Cookies cannot be set in Server Components.
                    // This is handled by Middleware or Server Actions.
                },
            },
        }
    )
}

/**
 * Creates an admin client with service role for privileged operations
 * Use ONLY for server-side admin tasks that need to bypass RLS
 * @returns Supabase client with service role (bypasses RLS)
 */
export function createAdminClient() {
    // Use regular supabase-js client (NOT ssr) to bypass RLS
    const { createClient } = require('@supabase/supabase-js')

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        }
    )
}
