import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

console.log('Testing Admin Client with URL:', SUPABASE_URL);
// Mask key for log
console.log('Service Key (Last 5):', SERVICE_KEY.slice(-5));

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deleteGenesis() {
    console.log('🔍 Buscando usuario luke@lukeapp.com en Auth...');

    // 1. Find User by Email to get ID
    // Note: Admin API doesn't have listUsers by email filter directly efficiently, but we can try listUsers
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Error listing users:', listError);
        return;
    }

    const genesisUser = users.find(u => u.email === 'luke@lukeapp.com');

    if (!genesisUser) {
        console.log('ℹ️ Usuario genesis no encontrado en Auth (ya borrado?)');
        return;
    }

    console.log(`👤 Encontrado ID: ${genesisUser.id}`);

    // 2. Delete User
    console.log('🗑️ Intentando borrar usuario...');
    const { data, error: deleteError } = await supabase.auth.admin.deleteUser(genesisUser.id);

    if (deleteError) {
        console.error('❌ ERROR al borrar:', deleteError.message);
        console.error('Detalles:', deleteError);
    } else {
        console.log('✅ Usuario borrado EXITOSAMENTE.');
    }
}

deleteGenesis().catch(console.error);
