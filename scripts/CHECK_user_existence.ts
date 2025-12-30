import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
    console.log('🔍 Checking if luke@lukeapp.com exists...');
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
        console.error('API Error:', error.message);
        return;
    }

    const genesis = users.find(u => u.email === 'luke@lukeapp.com');
    if (genesis) {
        console.log('⚠️  User luke@lukeapp.com FOUND. ID:', genesis.id);
        console.log('   Metadata:', genesis.user_metadata);
    } else {
        console.log('✅ User luke@lukeapp.com NOT FOUND (Deleted).');
    }
}

check();
