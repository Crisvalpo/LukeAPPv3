/**
 * Seed Mockup Production Data
 * 
 * Populates the database with test data for the 3 scenarios:
 * - Scenario A: No production (can auto-apply)
 * - Scenario B: Fabricated only (logistical impact)
 * - Scenario C: Work in progress (critical impact)
 */

import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwODIyMSwiZXhwIjoyMDgyMDg0MjIxfQ.h2FxdoFonxZ4MxdXSNddMAyOavBLVzXN98wI2V6Esxc'
const PROJECT_URL = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function seedMockupData() {
    console.log('🌱 Seeding mockup production data...\n')

    try {
        // Get first project and company for testing
        const { data: projects } = await supabase
            .from('projects')
            .select('id, company_id')
            .limit(1)
            .single()

        if (!projects) {
            console.error('❌ No projects found. Create a project first.')
            return
        }

        const { id: projectId, company_id: companyId } = projects
        console.log(`📦 Using Project: ${projectId}`)
        console.log(`🏢 Company: ${companyId}\n`)

        // SCENARIO A: No Production (Auto-Apply)
        console.log('🔹 Scenario A: No Production')
        const { data: iso1 } = await supabase
            .from('isometrics')
            .insert({
                project_id: projectId,
                company_id: companyId,
                iso_number: 'ISO-001-TEST',
                revision: 'A',
                description: 'Test isometric - No production',
                status: 'ACTIVE'
            })
            .select()
            .single()

        if (iso1) {
            console.log(`  ✅ Created isometric: ${iso1.iso_number} (Rev ${iso1.revision})`)
            console.log(`     No spools → Can auto-apply revision\n`)
        }

        // SCENARIO B: Fabricated Only (Logistical Impact)
        console.log('🔸 Scenario B: Fabricated Only')
        const { data: iso2 } = await supabase
            .from('isometrics')
            .insert({
                project_id: projectId,
                company_id: companyId,
                iso_number: 'ISO-002-TEST',
                revision: 'A',
                description: 'Test isometric - Fabricated',
                status: 'ACTIVE'
            })
            .select()
            .single()

        if (iso2) {
            const { data: spool2 } = await supabase
                .from('spools')
                .insert({
                    isometric_id: iso2.id,
                    project_id: projectId,
                    company_id: companyId,
                    spool_number: 'SP-002-001-TEST',
                    revision: 'A',
                    fabrication_status: 'FABRICATED',
                    fabricated_at: new Date().toISOString()
                })
                .select()
                .single()

            console.log(`  ✅ Created isometric: ${iso2.iso_number} (Rev ${iso2.revision})`)
            console.log(`  ✅ Created spool: ${spool2?.spool_number} (FABRICATED)`)
            console.log(`     Fabricated but no welds → Logistical impact\n`)
        }

        // SCENARIO C: Work in Progress (Critical Impact)
        console.log('🔺 Scenario C: Work in Progress')
        const { data: iso3 } = await supabase
            .from('isometrics')
            .insert({
                project_id: projectId,
                company_id: companyId,
                iso_number: 'ISO-003-TEST',
                revision: 'A',
                description: 'Test isometric - Work in progress',
                status: 'ACTIVE'
            })
            .select()
            .single()

        if (iso3) {
            const { data: spool3 } = await supabase
                .from('spools')
                .insert({
                    isometric_id: iso3.id,
                    project_id: projectId,
                    company_id: companyId,
                    spool_number: 'SP-003-001-TEST',
                    revision: 'A',
                    fabrication_status: 'DISPATCHED',
                    fabricated_at: new Date().toISOString(),
                    dispatched_at: new Date().toISOString()
                })
                .select()
                .single()

            if (spool3) {
                const { data: weld } = await supabase
                    .from('welds')
                    .insert({
                        spool_id: spool3.id,
                        project_id: projectId,
                        company_id: companyId,
                        weld_number: 'WD-003-001-TEST',
                        weld_type: 'TIG',
                        status: 'EXECUTED',
                        executed_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                console.log(`  ✅ Created isometric: ${iso3.iso_number} (Rev ${iso3.revision})`)
                console.log(`  ✅ Created spool: ${spool3.spool_number} (DISPATCHED)`)
                console.log(`  ✅ Created weld: ${weld?.weld_number} (EXECUTED)`)
                console.log(`     Work in progress → Critical impact\n`)
            }
        }

        console.log('✨ Mockup data seeded successfully!')
        console.log('\n📊 Summary:')
        console.log('  - 3 Isometrics created')
        console.log('  - 2 Spools created')
        console.log('  - 1 Weld created')
        console.log('\n🧪 Ready for revision impact testing!')

    } catch (error) {
        console.error('❌ Error seeding data:', error)
    }
}

seedMockupData()
