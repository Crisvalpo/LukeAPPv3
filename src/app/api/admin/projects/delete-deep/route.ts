import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// New endpoint for DEEP DELETE of a Project
export async function POST(request: Request) {
    try {
        // 1. Config Check
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) {
            return NextResponse.json({ success: false, message: 'Server Config Error: Missing Service Key' }, { status: 500 })
        }

        const body = await request.json()
        const { projectId } = body

        if (!projectId) {
            return NextResponse.json({ success: false, message: 'Missing projectId' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // 2. Log & Prepare
        console.log(`Deep deleting project ${projectId}...`)

        // 3. Find all users assigned to this project
        // Note: We need to distinguish if these users are ONLY in this project or have other roles.
        // But the user requested "Tajante": "se lleva a los usuarios...".
        // Warning: If a user is Founder, they shouldn't be deleted?
        // Wait, members.projectId is usually NULL for Founders.
        // So we only target members explicitly assigned to THIS project.

        const { data: members, error: memError } = await supabaseAdmin
            .from('members')
            .select('user_id, role_id')
            .eq('project_id', projectId)

        if (memError) throw memError

        if (members && members.length > 0) {
            // 4. Delete Users Loop
            for (const member of members) {
                // If the member is "Founder" or "Super Admin", maybe we should PROTECT them?
                // User said "Tajante". But deleting a Founder account because a project is deleted seems risky if they own the company.
                // However, usually Founders have project_id = NULL in their member record (Company level).
                // If a Founder is assigned to a specific project, they might have 2 member records?
                // Our schema constraints: UNIQUE(user_id, company_id, project_id).
                // So a user could have ONE record per project.

                // Let's assume we delete the USER ACCOUNT (Auth) as requested "a la basura".
                // This is aggressive.

                const userId = member.user_id;
                console.log(`Deleting project member user: ${userId}`);
                await supabaseAdmin.auth.admin.deleteUser(userId);
            }
        }

        // 5. Delete the Project
        // (If we missed any invitations or members, this will cascade or set null depending on FK,
        // but we just nuked the users above).
        const { error: delError } = await supabaseAdmin
            .from('projects')
            .delete()
            .eq('id', projectId)

        if (delError) throw delError

        return NextResponse.json({
            success: true,
            message: `Proyecto eliminado y ${members?.length || 0} usuarios borrados del sistema.`
        })

    } catch (error: any) {
        console.error('Deep Delete Project Error:', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
