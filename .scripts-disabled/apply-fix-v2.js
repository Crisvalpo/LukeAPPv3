const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Leer variables de entorno (Corregido .com -> .co)
    const SUPABASE_URL = 'https://bzjxkraxkhsrflwthiqv.supabase.co';
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6anhrcmF4a2hzcmZsd3RoaXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEyMTgxMiwiZXhwIjoyMDgyNjk3ODEyfQ.W63cHt6e_VFqgWBEubq_ebTLSrByClziwgg-ZD_RbOY';

    console.log('🔧 Ejecutando correcciones RLS (Intento 2)...\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'FIX_project_locations_rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    try {
        // Intentar RPC exec_sql
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ query: sqlContent })
        });

        if (!response.ok) {
            // Si falla exec_sql, intentar statements individuales asumiendo que es una lista de comandos separados por ;
            // Esto es un fallback básico
            console.log('RPC exec_sql falló o no existe. Intentando por partes...');
            throw new Error("RPC not available");
        }

        console.log('✅ Migración aplicada exitosamente via RPC');

    } catch (error) {

        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s.length > 0);

        let success = 0;
        let fails = 0;

        for (const statement of statements) {
            try {
                // Intentar ejecutar como query directa si el RPC falla (solo funciona si Supabase REST expone SQL directo, que usualmente no)
                // Pero intentaremos el RPC de nuevo por cada statement, a ver si es un tema de timeout o parser
                const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ query: statement })
                });

                if (res.ok) {
                    console.log('  Sub-statement ejecutado ok');
                    success++;
                } else {
                    console.error('  Sub-statement falló:', await res.text());
                    fails++;
                }
            } catch (e) {
                console.error('  Sub-statement error red:', e.message);
                fails++;
            }
        }
        console.log(`Resumen: ${success} OK, ${fails} Fallos`);
    }
}

runMigration().catch(console.error);
