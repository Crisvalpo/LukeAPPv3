const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

const sql = `
-- Fix missing Foreign Key for members -> users if it's missing (judging by previous output)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'members_user_id_fkey'
    ) THEN
        ALTER TABLE public.members 
        ADD CONSTRAINT members_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Verify again
SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='members' AND constraint_type='FOREIGN KEY';
`

async function executeSQLDirect() {
    console.log('🔧 Fixing/Verifying Foreign Key members -> users...\n')

    try {
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        const result = await response.json()
        console.log('✅ Result:', JSON.stringify(result, null, 2))

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

executeSQLDirect()
