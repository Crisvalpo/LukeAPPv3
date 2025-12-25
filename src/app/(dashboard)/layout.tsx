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

    // 1. Validate Session
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/');
    }

    // 2. Get User Role (needed for Sidebar menu)
    // Querying 'members' table as verified source of truth
    const { data: memberData } = await supabase
        .from('members')
        .select('role_id')
        .eq('user_id', session.user.id)
        .single()

    // Fallback if no role found matches middleware logic
    // role_id in DB is like 'super_admin', 'founder' etc.
    const role = memberData?.role_id || 'worker'

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Left Sidebar (Fixed) - Role Aware */}
            <Sidebar role={role} />

            {/* Main Content Area (Scrollable) */}
            <main style={{ marginLeft: '16rem', width: 'calc(100% - 16rem)' }} className="flex-1 overflow-y-auto relative bg-[#0f172a]">
                {/* Page Content */}
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
