/**
 * Test Impact Detection Logic
 * 
 * Tests the 3 scenarios with seeded data:
 * A. No production → Auto-apply
 * B. Fabricated → Logistical impact
 * C. Work in progress → Critical impact
 */

import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function testImpactDetection() {
    console.log('🧪 Testing Impact Detection Logic\n')

    try {
        // Get test isometrics
        const { data: isometrics } = await supabase
            .from('isometrics')
            .select('*')
            .like('iso_number', 'ISO-%TEST')
            .order('iso_number')

        if (!isometrics || isometrics.length === 0) {
            console.error('❌ No test isometrics found. Run seed_production_mockup.ts first.')
            return
        }

        console.log(`📊 Found ${isometrics.length} test isometrics\n`)

        // Get a user ID for testing
        const { data: users } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single()

        const userId = users?.id || '00000000-0000-0000-0000-000000000000'

        for (const iso of isometrics) {
            await testScenario(iso, userId)
        }

        console.log('\n✨ Impact detection tests completed!')

    } catch (error) {
        console.error('❌ Error:', error)
    }
}

async function testScenario(isometric: any, userId: string) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${isometric.iso_number} (Rev ${isometric.revision})`)
    console.log(`${'='.repeat(60)}`)

    // 1. Get spools for this isometric
    const { data: spools } = await supabase
        .from('spools')
        .select(`
            *,
            welds (*)
        `)
        .eq('isometric_id', isometric.id)

    console.log(`\n📦 Spools found: ${spools?.length || 0}`)

    if (!spools || spools.length === 0) {
        console.log('  ✅ No spools → Expected: AUTO-APPLY')
        console.log('  📊 Impact Type: NONE')
        console.log('  🎯 Severity: N/A')
        return
    }

    // 2. Analyze each spool
    for (const spool of spools) {
        console.log(`\n  Spool: ${spool.spool_number}`)
        console.log(`    - Status: ${spool.fabrication_status}`)
        console.log(`    - Fabricated: ${spool.fabricated_at ? '✓' : '✗'}`)
        console.log(`    - Dispatched: ${spool.dispatched_at ? '✓' : '✗'}`)
        console.log(`    - Welds: ${spool.welds?.length || 0}`)

        // Determine production level
        const hasFabrication = ['FABRICATED', 'DISPATCHED', 'INSTALLED'].includes(spool.fabrication_status)
        const hasWelds = spool.welds?.some((w: any) => w.status === 'EXECUTED') || false
        const hasDispatch = !!spool.dispatched_at

        let level = 'ENGINEERING_ONLY'
        let severity = 'LOW'

        if (!hasFabrication) {
            level = 'ENGINEERING_ONLY'
            severity = 'N/A'
        } else if (hasFabrication && !hasWelds) {
            level = 'FABRICATED_ONLY'
            severity = 'MEDIUM'
        } else if (hasWelds || hasDispatch) {
            level = 'IN_PROGRESS'
            severity = hasDispatch || hasWelds ? 'CRITICAL' : 'HIGH'
        }

        console.log(`\n  📊 Production Level: ${level}`)
        console.log(`  🎯 Expected Severity: ${severity}`)
        console.log(`  ✅ Impact Type: ${severity === 'N/A' ? 'NONE' : 'MODIFIED'}`)

        // Show recommended resolution
        if (level === 'FABRICATED_ONLY') {
            console.log(`  💡 Recommended: MATERIAL_RETURN (devolver a bodega)`)
        } else if (level === 'IN_PROGRESS') {
            console.log(`  💡 Recommended: REWORK or FREE_JOINT (decisión estratégica)`)
        }
    }

    // Summary
    console.log(`\n📝 Summary:`)
    const canAutoApply = spools.every((s: any) => {
        const hasFab = ['FABRICATED', 'DISPATCHED', 'INSTALLED'].includes(s.fabrication_status)
        return !hasFab
    })

    if (canAutoApply) {
        console.log(`  ✅ Can AUTO-APPLY (no production)`)
    } else {
        console.log(`  ⚠️  Requires MANUAL REVIEW (${spools.length} spool(s) affected)`)
    }
}

testImpactDetection()
