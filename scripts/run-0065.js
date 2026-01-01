const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const SUPABASE_URL = 'https://bzjxkraxkhsrflwthiqv.supabase.co';
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6anhrcmF4a2hzcmZsd3RoaXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEyMTgxMiwiZXhwIjoyMDgyNjk3ODEyfQ.W63cHt6e_VFqgWBEubq_ebTLSrByClziwgg-ZD_RbOY';

    console.log('🔧 Ejecutando migración 0065 via Supabase Client...\n');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '0065_update_material_catalog_constraint.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    try {
        const { data, error } = await supabase.rpc('exec_sql', { query: sqlContent });

        if (error) {
            // Check if error is "function not found"
            if (error.code === 'PGRST202') {
                console.error("❌ RPC 'exec_sql' not found. Trying invalid workaround...");
                throw new Error("Cannot execute SQL: exec_sql RPC is missing.");
            }
            throw error;
        }

        console.log(`✅ Migration executed successfully`);
    } catch (error) {
        console.error(`❌ Error executing migration:`, error.message);
        if (error.details) console.error('Details:', error.details);
    }
}

runMigration().catch(console.error);
