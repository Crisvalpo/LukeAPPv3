import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set({ name, value, ...options })
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user && request.nextUrl.pathname !== '/') {
        // 1. Fetch User Role + Functional Role + Permissions
        const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select(`
                role_id,
                functional_role_id,
                job_title,
                company_roles (
                    name,
                    color,
                    permissions
                )
            `)
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError) console.error('MW: Member verification error:', memberError.message)

        // Auto-accept pending invitation if no membership exists
        if (!memberData && user.email) {
            const { data: pendingInv } = await supabase
                .from('invitations')
                .select('id, token') // Select ID for the RPC
                .eq('email', user.email)
                .eq('status', 'pending')
                .maybeSingle()

            if (pendingInv) {
                console.log('MW: Found pending invitation for', user.email)

                // Call RPC with correct arguments (invitation_id_input)
                const { data: rpcResult, error: conversionError } = await supabase.rpc('accept_invitation', {
                    invitation_id_input: pendingInv.id,
                    user_id_input: user.id
                })

                // Check both transport error AND business logic success
                if (!conversionError && rpcResult && (rpcResult as any).success) {
                    console.log('MW: Invitation auto-accepted successfully. Reloading context...')
                    return NextResponse.redirect(request.url)
                } else {
                    console.warn('MW: Auto-accept failed or returned error:', conversionError || rpcResult)
                    // Do NOT redirect if failed, to avoid loop
                }
            }
        }

        const role = memberData?.role_id
        const functionalRole = (memberData?.company_roles as any)?.name
        const permissions = (memberData?.company_roles as any)?.permissions
        const path = request.nextUrl.pathname

        console.log(`MW: User ${user.email} | System: ${role || 'NONE'} | Functional: ${functionalRole || 'NONE'} | Path: ${path}`)

        // Attach permissions to headers for downstream consumption
        if (permissions) {
            response.headers.set('x-user-permissions', JSON.stringify(permissions))
        }
        if (functionalRole) {
            response.headers.set('x-functional-role', functionalRole)
        }
        if (role) {
            response.headers.set('x-system-role', role)
        }

        // 2. Protect /staff routes (Super Admin Only)
        if (path.startsWith('/staff') && role !== 'super_admin') {
            console.log('MW: Blocking /staff access -> Redirect Lobby')
            return NextResponse.redirect(new URL('/lobby', request.url))
        }

        // 3. Protect /founder routes (Founder/Admin Only)
        if (path.startsWith('/founder') && !['founder', 'admin'].includes(role || '')) {
            console.log('MW: Blocking /founder access -> Redirect Lobby')
            return NextResponse.redirect(new URL('/lobby', request.url))
        }

        // 4. Auto-redirect from Lobby & Root (Smart Routing)
        if (path === '/lobby' || path === '/') {
            // High-level roles: Direct dashboard access
            if (role === 'super_admin') {
                console.log(`MW: Redirect ${role} -> /staff`)
                return NextResponse.redirect(new URL('/staff', request.url))
            } else if (role === 'founder') {
                console.log(`MW: Redirect ${role} -> /founder`)
                return NextResponse.redirect(new URL('/founder', request.url))
            } else if (role === 'admin') {
                console.log(`MW: Redirect ${role} -> /admin`)
                return NextResponse.redirect(new URL('/admin', request.url))
            }

            // Operational roles: Dynamic routing based on is_home module
            if (permissions?.modules) {
                const homeModule = Object.entries(permissions.modules)
                    .find(([_, config]: [string, any]) => config.is_home === true)?.[0]

                if (homeModule) {
                    const routeMap: Record<string, string> = {
                        quality: '/quality',
                        field: '/field',
                        warehouse: '/warehouse',
                        engineering: '/engineering'
                    }

                    const targetRoute = routeMap[homeModule]
                    if (targetRoute) {
                        console.log(`MW: Redirect to home module: ${homeModule} -> ${targetRoute}`)
                        return NextResponse.redirect(new URL(targetRoute, request.url))
                    }
                }
            }

            // Fallback: If at root and has role, go to lobby
            if (path === '/' && role) {
                console.log(`MW: Redirect ${role || 'user'} -> /lobby`)
                return NextResponse.redirect(new URL('/lobby', request.url))
            }
        }

        // -- ROLE BASED REDIRECT LOGIC END --
    }


    return response
}
