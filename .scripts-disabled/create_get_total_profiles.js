const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'

const SQL = `
-- Create get_total_profiles RPC function
CREATE OR REPLACE FUNCTION public.get_total_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count integer;
BEGIN
    -- Count users who have at least one membership
    SELECT count(DISTINCT user_id) INTO count
    FROM public.members;
    
    RETURN count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.get_total_profiles() TO authenticated;
`

async function createRpc() {
    console.log('🔧 Creando función RPC get_total_profiles...\n')

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: SQL })
        })

        if (response.ok) {
            console.log('✅ Función get_total_profiles creada exitosamente')
        } else {
            const error = await response.text()
            console.error('❌ Error:', error)
        }

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

createRpc()
