const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Construir connection string desde las env vars
    const connectionString = `postgresql://postgres.bzjxkraxkhsrflwthiqv:[YOUR-DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    // O podemos usar el service role a través de la API REST de Supabase
    // Pero pg necesita la connection string directa

    console.log('⚠️  NECESITAS LA DB PASSWORD');
    console.log('Encuéntrala en: https://supabase.com/dashboard/project/bzjxkraxkhsrflwthiqv/settings/database');
    console.log('Busca "Connection string" y copia el password');
    console.log('\nLuego ejecuta este script con:');
    console.log('DB_PASSWORD=tu-password node scripts/run-migration.js');

    const dbPassword = process.env.DB_PASSWORD;

    if (!dbPassword) {
        console.error('\n❌ ERROR: Necesitas proporcionar DB_PASSWORD');
        console.log('Ejecuta: DB_PASSWORD=tu-password node scripts/run-migration.js');
        process.exit(1);
    }

    const connString = `postgresql://postgres.bzjxkraxkhsrflwthiqv:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    const client = new Client({
        connectionString: connString,
    });

    try {
        console.log('🔌 Conectando a Supabase...');
        await client.connect();
        console.log('✅ Conectado!\n');

        // Leer el SQL del archivo
        const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'SETUP_engineering_complete.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📝 Ejecutando migración de Engineering...\n');

        const result = await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('\n📊 Resultado:', result);

    } catch (error) {
        console.error('❌ Error ejecutando migración:', error.message);
        console.error('Detalles:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Conexión cerrada');
    }
}

runMigration();
