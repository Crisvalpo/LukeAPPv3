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
        if (path === '/lobby') {
            if (role === 'super_admin') {
                console.log('MW: Auto-redirect super_admin /lobby -> /staff')
                return NextResponse.redirect(new URL('/staff', request.url))
            } else if (['founder', 'admin'].includes(role || '')) {
                console.log('MW: Auto-redirect founder/admin /lobby -> /founder')
                return NextResponse.redirect(new URL('/founder', request.url))
            }
            // Workers and other roles stay in lobby (correct behavior)
        }

        // 5. Redirect Rules on Root (Smart Landing)
        if (path === '/') {
            if (role === 'super_admin') {
                return NextResponse.redirect(new URL('/staff', request.url))
            } else if (['founder', 'admin'].includes(role || '')) {
                return NextResponse.redirect(new URL('/founder', request.url))
            } else {
                return NextResponse.redirect(new URL('/lobby', request.url))
            }
        }

        // -- ROLE BASED REDIRECT LOGIC END --
    }


    return response
}
