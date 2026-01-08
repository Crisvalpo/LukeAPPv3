/**
 * Check User Status in All Tables
 * 
 * Verifies paoluke.webapp@gmail.com across all relevant tables
 */

import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

const TARGET_EMAIL = 'paoluke.webapp@gmail.com'

async function checkUserStatus() {
    console.log('🔍 USER STATUS CHECK')
    console.log('='.repeat(70))
    console.log(`Email: ${TARGET_EMAIL}\n`)

    try {
        // 1. Check Auth Users (Supabase Auth)
        console.log('1️⃣  AUTH.USERS (Supabase Authentication):')
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

        if (authError) {
            console.error('   ❌ Error:', authError.message)
        } else {
            const user = authUsers.users.find(u => u.email === TARGET_EMAIL)
            if (user) {
                console.log('   ✅ Found in auth.users')
                console.log(`   - ID: ${user.id}`)
                console.log(`   - Email: ${user.email}`)
                console.log(`   - Email Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
                console.log(`   - Created: ${new Date(user.created_at).toLocaleString('es-CL')}`)
                console.log(`   - Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-CL') : 'Never'}`)

                const userId = user.id

                // 2. Check public.users
                console.log('\n2️⃣  PUBLIC.USERS:')
                const { data: publicUser, error: publicError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (publicError) {
                    console.error('   ❌ Error:', publicError.message)
                } else if (publicUser) {
                    console.log('   ✅ Found in public.users')
                    console.log(`   - Name: ${publicUser.name || 'N/A'}`)
                    console.log(`   - Email: ${publicUser.email}`)
                } else {
                    console.log('   ⚠️  Not found in public.users')
                }

                // 3. Check public.members
                console.log('\n3️⃣  PUBLIC.MEMBERS (Roles & Memberships):')
                const { data: members, error: membersError } = await supabase
                    .from('members')
                    .select(`
                        *,
                        companies (id, name, slug),
                        projects (id, name, code),
                        company_roles (name)
                    `)
                    .eq('user_id', userId)

                if (membersError) {
                    console.error('   ❌ Error:', membersError.message)
                } else if (members && members.length > 0) {
                    console.log(`   ✅ Found ${members.length} membership(s):`)
                    members.forEach((member, index) => {
                        console.log(`\n   Membership #${index + 1}:`)
                        console.log(`   - System Role: ${member.role_id}`)
                        console.log(`   - Functional Role: ${member.company_roles?.name || 'None'}`)
                        console.log(`   - Company: ${member.companies?.name || 'N/A'} (${member.companies?.id})`)
                        console.log(`   - Project: ${member.projects?.name || 'None'} (${member.projects?.code || 'N/A'})`)
                        console.log(`   - Joined: ${new Date(member.joined_at).toLocaleString('es-CL')}`)
                    })
                } else {
                    console.log('   ⚠️  No memberships found')
                }

                // 4. Check invitations (pending)
                console.log('\n4️⃣  INVITATIONS (Pending):')
                const { data: invitations, error: invError } = await supabase
                    .from('invitations')
                    .select('*')
                    .eq('email', TARGET_EMAIL)
                    .is('accepted_at', null)

                if (invError) {
                    console.error('   ❌ Error:', invError.message)
                } else if (invitations && invitations.length > 0) {
                    console.log(`   ⚠️  ${invitations.length} pending invitation(s):`)
                    invitations.forEach((inv, index) => {
                        console.log(`\n   Invitation #${index + 1}:`)
                        console.log(`   - Role: ${inv.role_id}`)
                        console.log(`   - Sent: ${new Date(inv.created_at).toLocaleString('es-CL')}`)
                        console.log(`   - Token: ${inv.token.substring(0, 20)}...`)
                    })
                } else {
                    console.log('   ✅ No pending invitations')
                }

                // 5. Summary
                console.log('\n' + '='.repeat(70))
                console.log('📊 SUMMARY:')
                console.log(`   Auth Status: ${user.email_confirmed_at ? '✅ Confirmed' : '❌ Not Confirmed'}`)
                console.log(`   Public User: ${publicUser ? '✅ Exists' : '❌ Missing'}`)
                console.log(`   Active Memberships: ${members?.length || 0}`)
                console.log(`   Pending Invitations: ${invitations?.length || 0}`)

                if (members && members.length > 0) {
                    const roles = members.map(m => m.role_id).join(', ')
                    console.log(`   Roles: ${roles}`)
                }

                console.log('='.repeat(70))

                // 6. Access recommendations
                console.log('\n💡 ACCESS RECOMMENDATIONS:')
                const hasFounder = members?.some(m => m.role_id === 'founder')
                const hasAdmin = members?.some(m => m.role_id === 'admin')

                if (hasFounder) {
                    console.log('   ✅ Can access: /founder (Founder Dashboard)')
                    console.log('   ✅ Can access: /founder/revisions (Phase 2)')
                }
                if (hasAdmin) {
                    console.log('   ✅ Can access: /admin (Admin Dashboard)')
                }
                if (!hasFounder && !hasAdmin) {
                    console.log('   ⚠️  User has no Founder or Admin role')
                    console.log('   ℹ️  May need to use /lobby or different role dashboard')
                }

            } else {
                console.log('   ❌ User not found in auth.users')
            }
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error)
    }
}

checkUserStatus()
