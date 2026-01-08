const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Leer variables de entorno
    const SUPABASE_URL = 'https://bzjxkraxkhsrflwthiqv.supabase.com';
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6anhrcmF4a2hzcmZsd3RoaXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEyMTgxMiwiZXhwIjoyMDgyNjk3ODEyfQ.W63cHt6e_VFqgWBEubq_ebTLSrByClziwgg-ZD_RbOY';

    console.log('🔧 Ejecutando migraciones de Engineering...\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'SETUP_engineering_complete.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir en statements individuales (separados por ;)
    const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s.length > 0);

    console.log(`📝 Encontrados ${statements.length} statements SQL\n`);

    let successCount = 0;
    let errorCount = 0;

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        // Skip comments and empty statements
        if (statement.trim().startsWith('--') || statement.trim() === ';') {
            continue;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({ query: statement })
            });

            if (!response.ok) {
                // Si el RPC no existe, intentar con query directa
                const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ query: statement })
                });

                if (!directResponse.ok) {
                    throw new Error(`HTTP ${directResponse.status}: ${await directResponse.text()}`);
                }
            }

            successCount++;
            console.log(`✅ ${i + 1}/${statements.length} - OK`);

        } catch (error) {
            errorCount++;
            console.error(`❌ ${i + 1}/${statements.length} - Error:`, error.message);
            // Continuar con el siguiente statement
        }
    }

    console.log(`\n📊 Resultado final:`);
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (errorCount === 0) {
        console.log('\n🎉 Todas las migraciones se ejecutaron correctamente!');
    } else {
        console.log(`\n⚠️  Algunas migraciones fallaron. Revisa los errores arriba.`);
    }
}

runMigration().catch(console.error);
