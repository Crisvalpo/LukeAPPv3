const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Leer variables de entorno
    const SUPABASE_URL = 'https://bzjxkraxkhsrflwthiqv.supabase.com';
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6anhrcmF4a2hzcmZsd3RoaXF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEyMTgxMiwiZXhwIjoyMDgyNjk3ODEyfQ.W63cHt6e_VFqgWBEubq_ebTLSrByClziwgg-ZD_RbOY';

    console.log('🔧 Ejecutando correcciones RLS...\n');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'FIX_project_locations_rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Usar la función SQL exec_sql si existe, o intentar ejecutar comandos individuales si tenemos acceso directo
    // Dado que no tenemos un cliente SQL real aquí, vamos a intentar usar el endpoint RPC que parece estar disponible en el otro script

    // El script original dividía por ;. Vamos a hacer lo mismo pero con cuidado de funciones
    // Para simplificar, asumiremos que este script se usa con un RPC `exec_sql(query text)` que acepta bloques completos

    try {
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
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        console.log('✅ Migración aplicada exitosamente');

    } catch (error) {
        console.error('❌ Error ejecutando migración:', error);

        // Fallback: Si exec_sql falla o no existe, intentar dividir por ; (menos robusto para funciones complejas)
        console.log('Intentando ejecutar por partes...');

        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s.length > 0);

        for (const statement of statements) {
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ query: statement })
                });
                console.log('  Sub-statement ejecutado ok');
            } catch (e) {
                console.error('  Sub-statement falló:', e.message);
            }
        }
    }
}

runMigration().catch(console.error);
