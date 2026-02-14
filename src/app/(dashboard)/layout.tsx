import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import DashboardContent from '@/components/layout/DashboardContent'
import QuotaLimitBanner from '@/components/dashboard/QuotaLimitBanner'

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
        .select(`
            role_id, 
            company_id, 
            project_id,
            functional_role_id,
            company_roles (
                name
            )
        `)
        .eq('user_id', user.id)
        .maybeSingle()

    // Security: If no member record, user shouldn't access dashboard
    if (memberError || !memberData) {
        redirect('/unauthorized')
    }

    // role_id from validated member
    const role = memberData.role_id

    // Extract functional role name if exists
    // @ts-ignore - company_roles is a joined object, not array
    const functionalRoleName = memberData.company_roles?.name || null

    // 3. Fetch company details for non-staff users (for Sidebar header)
    let companyName: string | null = null
    let planTier: string | null = null
    let companyLogoUrl: string | null = null

    if (role !== 'super_admin' && memberData.company_id) {
        const { data: companyData } = await supabase
            .from('companies')
            .select('name, subscription_tier, logo_url')
            .eq('id', memberData.company_id)
            .single()

        if (companyData) {
            companyName = companyData.name
            planTier = companyData.subscription_tier
            companyLogoUrl = companyData.logo_url
        }
    }

    return (
        <div
            className="flex flex-col min-h-screen bg-bg-app text-text-main font-sans overflow-hidden"
        >
            {/* 📱 Mobile Navbar - Added ml-12 to avoid overlap with fixed hamburger button */}
            <div className="md:hidden flex items-center justify-between p-4 bg-bg-surface-1 border-b border-glass-border">
                <span className="text-xl font-bold text-brand-primary ml-12">LukeAPP</span>
            </div>

            {/* Left Sidebar (Fixed on Desktop, Overlay on Mobile) */}
            <Sidebar
                role={role}
                companyName={companyName}
                companyId={memberData.company_id}
                companyLogoUrl={companyLogoUrl}
                planTier={planTier}
                userEmail={user.email}
                functionalRoleName={functionalRoleName}
            />

            {/* Main Content Area - Dynamic padding in desktop based on sidebar state */}
            <main className="flex-1 overflow-y-auto relative bg-bg-app md:pl-[var(--sidebar-width)] transition-[padding] duration-300">
                <DashboardContent companyId={memberData.company_id} userRole={role}>
                    {/* 🚨 QUOTA BANNER */}
                    <QuotaLimitBanner companyId={memberData.company_id} roleId={role} />

                    {/* Page Content - Added pt-14 on mobile to avoid overlap with hamburger button. Pages handle their own pt-8. */}
                    <div className="pt-14 p-4 md:pt-0 md:px-8 max-w-[80rem] mx-auto w-full">
                        {children}
                    </div>
                </DashboardContent>
            </main>
        </div>
    )
}
