import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    )

    // 1. Validate User (Secure)
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (!user || authError) {
        redirect('/');
    }

    // 2. Get User Role (needed for Sidebar menu)
    // Querying 'members' table as verified source of truth
    const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('role_id, company_id, project_id')
        .eq('user_id', user.id)
        .maybeSingle()

    // Security: If no member record, user shouldn't access dashboard
    if (memberError || !memberData) {
        redirect('/unauthorized')
    }

    // role_id from validated member
    const role = memberData.role_id

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Left Sidebar (Fixed) - Role Aware */}
            <Sidebar role={role} />

            {/* Main Content Area (Scrollable) */}
            <main style={{
                marginLeft: '16rem',
                width: 'calc(100% - 16rem)',
                flex: 1,
                overflowY: 'auto',
                position: 'relative',
                background: '#0f172a'
            }}>
                {/* Page Content */}
                <div style={{
                    padding: '2rem',
                    maxWidth: '80rem',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    {children}
                </div>
            </main>
        </div>
    )
}
