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
        // 1. Fetch User Role
        // Querying 'members' table as verified source of truth
        const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('role_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()

        if (memberError) console.error('MW: Member verification error:', memberError.message)

        // Auto-accept pending invitation if no membership exists
        if (!memberData && user.email) {
            const { data: pendingInv } = await supabase
                .from('invitations')
                .select('token')
                .eq('email', user.email)
                .eq('status', 'pending')
                .maybeSingle()

            if (pendingInv) {
                console.log('MW: Auto-accepting pending invitation for', user.email)
                const { error: acceptError } = await supabase.rpc('accept_invitation', {
                    token_input: pendingInv.token,
                    user_id_input: user.id
                })

                if (!acceptError) {
                    console.log('MW: Invitation auto-accepted, reloading...')
                    // Redirect to same path to reload with new membership
                    return NextResponse.redirect(request.url)
                }
            }
        }

        const role = memberData?.role_id
        const path = request.nextUrl.pathname

        console.log(`MW: User ${user.email} | Role: ${role || 'NONE'} | Path: ${path} | Valid? ${!!memberData}`)

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

        // 4. Auto-redirect from Lobby (Smart Routing)
        // Management roles shouldn't stay in lobby - send them to their dashboards
        // 4. Auto-redirect from Lobby & Root (Smart Routing)
        if (path === '/lobby' || path === '/') {
            if (role === 'super_admin') {
                console.log(`MW: Redirect ${role} -> /staff`)
                return NextResponse.redirect(new URL('/staff', request.url))
            } else if (role === 'founder') {
                console.log(`MW: Redirect ${role} -> /founder`)
                return NextResponse.redirect(new URL('/founder', request.url))
            } else if (role === 'admin') {
                console.log(`MW: Redirect ${role} -> /admin`)
                return NextResponse.redirect(new URL('/admin', request.url))
            } else if (path === '/') {
                // If root and operational role -> Go to Lobby
                console.log(`MW: Redirect ${role || 'user'} -> /lobby`)
                return NextResponse.redirect(new URL('/lobby', request.url))
            }
            // If path is /lobby and role is operational -> Stay in Lobby (Correct)
        }

        // -- ROLE BASED REDIRECT LOGIC END --
    }


    return response
}
