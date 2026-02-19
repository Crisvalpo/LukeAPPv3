
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const BUCKET_ID = 'project-files';

// Exact paths from DB query
const exactPaths = [
    'empresa-de-prueba-3550ea15/PDP-991b9aed/civil/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/electrical/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/instrumentation/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/mechanical/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/piping/isometric-models/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/piping/isometric-pdfs/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/piping/.keep',
    'empresa-de-prueba-3550ea15/PDP-991b9aed/piping/spools/.keep',
];

async function deleteExact() {
    console.log(`Deleting ${exactPaths.length} exact paths from bucket: ${BUCKET_ID}`);
    exactPaths.forEach(p => console.log(`  - ${p}`));

    const { data, error } = await supabase.storage.from(BUCKET_ID).remove(exactPaths);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('\nResult:', JSON.stringify(data, null, 2));
    }

    // Final check
    const { data: root } = await supabase.storage.from(BUCKET_ID).list('', { limit: 100 });
    console.log('\nRemaining root folders:', root?.map(f => f.name));
}

deleteExact().catch(console.error);
