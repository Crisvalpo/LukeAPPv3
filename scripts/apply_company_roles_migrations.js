// =====================================================
// Script: Apply Company Roles Migrations
// Description: Applies migrations 0010, 0011, 0012 for Dynamic Roles System
// Author: LukeAPP Development Team
// Date: 2025-12-26
// =====================================================

const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION
// ==========================================

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'REPLACE_WITH_YOUR_TOKEN';
const PROJECT_REF = process.env.PROJECT_REF || 'REPLACE_WITH_YOUR_PROJECT_REF';
const MANAGEMENT_API = 'https://api.supabase.com/v1';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function executeSQLFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`\n📄 Executing: ${fileName}`);
    console.log('─'.repeat(50));

    try {
        // Read SQL file
        const sql = fs.readFileSync(filePath, 'utf8');

        // Execute via Supabase Management API
        const response = await fetch(
            `${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: sql })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ SUCCESS: ${fileName} applied`);
        return { success: true, file: fileName };

    } catch (error) {
        console.error(`❌ ERROR in ${fileName}:`, error.message);
        return { success: false, file: fileName, error: error.message };
    }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function applyMigrations() {
    console.log('\n🚀 LukeAPP - Company Roles System Migration');
    console.log('='.repeat(50));
    console.log(`📍 Project: ${PROJECT_REF}`);
    console.log(`⏰ Started: ${new Date().toISOString()}`);
    console.log('='.repeat(50));

    const migrations = [
        '0010_company_roles.sql',
        '0011_add_functional_role_to_members.sql',
        '0012_seed_standard_roles.sql'
    ];

    const results = [];

    for (const migration of migrations) {
        const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migration);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${migration}`);
            results.push({ success: false, file: migration, error: 'File not found' });
            continue;
        }

        const result = await executeSQLFile(filePath);
        results.push(result);

        // Small delay between migrations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ==========================================
    // SUMMARY
    // ==========================================

    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.file}`);
        if (result.error) {
            console.log(`   └─ Error: ${result.error}`);
        }
    });

    console.log('\n' + '─'.repeat(50));
    console.log(`Total: ${results.length} | Success: ${successful} | Failed: ${failed}`);
    console.log('='.repeat(50));
    console.log(`⏰ Completed: ${new Date().toISOString()}\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

// ==========================================
// RUN
// ==========================================

applyMigrations().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
