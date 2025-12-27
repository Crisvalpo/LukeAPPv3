/**
 * Database Verification Script
 * 
 * Verifies Phase 2 tables and data integrity
 */

import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function verifyDatabase() {
    console.log('🔍 PHASE 2 DATABASE VERIFICATION\n')
    console.log('='.repeat(70))

    // 1. Check Isometrics
    console.log('\n📐 ISOMETRICS:')
    const { data: isos, error: isoError } = await supabase
        .from('isometrics')
        .select('*')
        .like('iso_number', 'ISO-%TEST')
        .order('iso_number')

    if (isoError) {
        console.error('❌ Error:', isoError.message)
    } else {
        console.log(`   Found: ${isos?.length || 0} test isometrics`)
        isos?.forEach(iso => {
            console.log(`   - ${iso.iso_number} (Rev ${iso.revision})`)
        })
    }

    // 2. Check Spools
    console.log('\n🔩 SPOOLS:')
    const { data: spools, error: spoolError } = await supabase
        .from('spools')
        .select('*, isometrics(iso_number)')
        .like('spool_number', 'SP-%TEST')
        .order('spool_number')

    if (spoolError) {
        console.error('❌ Error:', spoolError.message)
    } else {
        console.log(`   Found: ${spools?.length || 0} test spools`)
        spools?.forEach(spool => {
            console.log(`   - ${spool.spool_number} → ${spool.fabrication_status}`)
        })
    }

    // 3. Check Welds
    console.log('\n⚡ WELDS:')
    const { data: welds, error: weldError } = await supabase
        .from('welds')
        .select('*, spools(spool_number)')
        .like('weld_number', 'WD-%TEST')
        .order('weld_number')

    if (weldError) {
        console.error('❌ Error:', weldError.message)
    } else {
        console.log(`   Found: ${welds?.length || 0} test welds`)
        welds?.forEach(weld => {
            console.log(`   - ${weld.weld_number} → ${weld.status}`)
        })
    }

    // 4. Check Engineering Revisions
    console.log('\n📋 ENGINEERING REVISIONS:')
    const { data: revisions, error: revError } = await supabase
        .from('engineering_revisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (revError) {
        console.error('❌ Error:', revError.message)
    } else {
        console.log(`   Found: ${revisions?.length || 0} revisions`)
        revisions?.forEach(rev => {
            console.log(`   - Rev ${rev.rev_id} → ${rev.status} (${new Date(rev.created_at).toLocaleString('es-CL')})`)
        })
    }

    // 5. Check Revision Events
    console.log('\n📝 REVISION EVENTS:')
    const { data: events, error: eventError } = await supabase
        .from('revision_events')
        .select('*, engineering_revisions(rev_id)')
        .order('created_at', { ascending: false })
        .limit(10)

    if (eventError) {
        console.error('❌ Error:', eventError.message)
    } else {
        console.log(`   Found: ${events?.length || 0} events`)
        const eventCounts: Record<string, number> = {}
        events?.forEach(event => {
            eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1
        })
        Object.entries(eventCounts).forEach(([type, count]) => {
            console.log(`   - ${type}: ${count}`)
        })
    }

    // 6. Check Revision Impacts
    console.log('\n⚠️  REVISION IMPACTS:')
    const { data: impacts, error: impactError } = await supabase
        .from('revision_impacts')
        .select('*, engineering_revisions(rev_id)')
        .order('created_at', { ascending: false })

    if (impactError) {
        console.error('❌ Error:', impactError.message)
    } else {
        console.log(`   Found: ${impacts?.length || 0} impacts`)

        const resolved = impacts?.filter(i => i.resolved_at) || []
        const unresolved = impacts?.filter(i => !i.resolved_at) || []

        console.log(`   - Resolved: ${resolved.length}`)
        console.log(`   - Unresolved: ${unresolved.length}`)

        if (impacts && impacts.length > 0) {
            console.log('\n   Details:')
            impacts.forEach(impact => {
                const status = impact.resolved_at ? '✅ Resolved' : '⚠️  Pending'
                console.log(`   ${status} - Severity: ${impact.severity} - Type: ${impact.impact_type}`)
                if (impact.resolution_type) {
                    console.log(`      Resolution: ${impact.resolution_type}`)
                }
            })
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 SUMMARY:')
    console.log(`   Isometrics: ${isos?.length || 0}`)
    console.log(`   Spools: ${spools?.length || 0}`)
    console.log(`   Welds: ${welds?.length || 0}`)
    console.log(`   Revisions: ${revisions?.length || 0}`)
    console.log(`   Events: ${events?.length || 0}`)
    console.log(`   Impacts: ${impacts?.length || 0} (${impacts?.filter(i => !i.resolved_at).length || 0} pending)`)
    console.log('='.repeat(70))
}

verifyDatabase()
