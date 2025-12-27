/**
 * Example: Complete Revision Flow
 * 
 * Demonstrates the full revision announcement flow:
 * 1. Create a new revision (Rev B)
 * 2. Detect impacts automatically
 * 3. Auto-apply if no impacts, or show impacts for review
 */

import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function demonstrateRevisionFlow() {
    console.log('📋 DEMONSTRATION: Complete Revision Flow\n')
    console.log('This example shows how the system handles revision announcements:\n')

    try {
        // Get test isometrics
        const { data: isometrics } = await supabase
            .from('isometrics')
            .select('*, company_id, project_id')
            .like('iso_number', 'ISO-%TEST')
            .order('iso_number')

        if (!isometrics || isometrics.length < 1) {
            console.error('❌ No test data. Run seed_production_mockup.ts first.')
            return
        }

        // Get a user
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single()

        const userId = user?.id || '00000000-0000-0000-0000-000000000000'

        // Test each scenario
        for (const iso of isometrics) {
            await announceRevision(iso, userId)
        }

        console.log('\n' + '='.repeat(70))
        console.log('✨ Demonstration complete!')
        console.log('='.repeat(70))

    } catch (error) {
        console.error('❌ Error:', error)
    }
}

async function announceRevision(isometric: any, userId: string) {
    console.log('\n' + '='.repeat(70))
    console.log(`📢 ANNOUNCING REVISION: ${isometric.iso_number}`)
    console.log(`   From: Rev A → To: Rev B`)
    console.log('='.repeat(70))

    // 1. Create revision
    console.log('\n1️⃣  Creating revision record...')
    const { data: revision, error: revError } = await supabase
        .from('engineering_revisions')
        .insert({
            project_id: isometric.project_id,
            company_id: isometric.company_id,
            rev_id: 'B',
            entity_type: 'isometric',
            entity_id: isometric.id,
            status: 'PENDING',
            created_by: userId,
            announced_at: new Date().toISOString()
        })
        .select()
        .single()

    if (revError || !revision) {
        console.error('   ❌ Error creating revision:', revError?.message)
        return
    }

    console.log(`   ✅ Revision created: ${revision.id}`)

    // 2. Emit CREATED event
    await supabase.from('revision_events').insert({
        revision_id: revision.id,
        event_type: 'CREATED',
        payload: { old_rev: 'A', new_rev: 'B' },
        created_by: userId
    })

    // 3. Detect impacts
    console.log('\n2️⃣  Detecting impacts...')

    const { data: spools } = await supabase
        .from('spools')
        .select(`
            *,
            welds (*)
        `)
        .eq('isometric_id', isometric.id)

    if (!spools || spools.length === 0) {
        console.log('   ✅ No spools found')
        console.log('   ✅ No production → CAN AUTO-APPLY')

        // Auto-apply
        await supabase
            .from('engineering_revisions')
            .update({ status: 'APPLIED' })
            .eq('id', revision.id)

        await supabase.from('revision_events').insert({
            revision_id: revision.id,
            event_type: 'APPLIED',
            payload: { auto_applied: true, reason: 'no_production' },
            created_by: userId
        })

        console.log('\n✨ RESULT: Revision AUTO-APPLIED')
        return
    }

    // Analyze impacts
    const impacts = []
    for (const spool of spools) {
        const hasFab = ['FABRICATED', 'DISPATCHED', 'INSTALLED'].includes(spool.fabrication_status)
        const hasWelds = spool.welds?.some((w: any) => w.status === 'EXECUTED')
        const hasDispatch = !!spool.dispatched_at

        if (!hasFab) continue // No impact

        let severity = 'MEDIUM'
        if (hasWelds || hasDispatch) {
            severity = 'CRITICAL'
        }

        impacts.push({
            revision_id: revision.id,
            impact_type: 'MODIFIED',
            affected_entity_type: 'spool',
            affected_entity_id: spool.id,
            severity,
            resolution_type: null
        })

        console.log(`   ⚠️  Impact detected on spool: ${spool.spool_number}`)
        console.log(`      - Severity: ${severity}`)
        console.log(`      - Production Level: ${hasFab && !hasWelds ? 'FABRICATED_ONLY' : 'IN_PROGRESS'}`)
    }

    if (impacts.length > 0) {
        // Create impact records
        const { data: createdImpacts } = await supabase
            .from('revision_impacts')
            .insert(impacts)
            .select()

        await supabase.from('revision_events').insert({
            revision_id: revision.id,
            event_type: 'IMPACT_DETECTED',
            payload: { impacts_count: createdImpacts?.length || 0 },
            created_by: userId
        })

        console.log(`\n⚠️  RESULT: ${impacts.length} IMPACT(S) DETECTED`)
        console.log('   → Requires manual review and strategic resolution')
        console.log('\n💡 Suggested Actions:')

        for (const impact of createdImpacts || []) {
            if (impact.severity === 'CRITICAL') {
                console.log(`   - Critical impact → REWORK or FREE_JOINT (strategic decision)`)
            } else if (impact.severity === 'MEDIUM') {
                console.log(`   - Medium impact → MATERIAL_RETURN (return to warehouse)`)
            }
        }
    } else {
        console.log('\n✅ RESULT: No impacts (can auto-apply)')
    }
}

demonstrateRevisionFlow()
