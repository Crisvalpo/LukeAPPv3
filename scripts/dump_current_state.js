const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'
const fs = require('fs')

const introspectionQuery = `
-- 1. TABLAS Y COLUMNAS
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 2. RLS POLICIES
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
`

async function dumpSchema() {
    console.log('🔍 Iniciando introspección de base de datos remota...\n')

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: introspectionQuery })
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        const data = await response.json()

        // Formatear salida para legibilidad
        let output = "=== REPORTE DE ESTADO ACTUAL DE SUPABASE (Generado Automáticamente) ===\n\n"

        // Como es un multiple statement, el resultado puede venir en array
        // La API de Supabase devuelve resultados? Vamos a ver qué devuelve.
        // Si no devuelve resultados formateados bonito, guardamos el JSON crudo.

        output += JSON.stringify(data, null, 2)

        fs.writeFileSync('supabase/schema_verification_dump.json', output)
        console.log('✅ Reporte guardado en: supabase/schema_verification_dump.json')
        console.log('   Revisa este archivo para comparar con tu migración consolidada.')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

dumpSchema()
