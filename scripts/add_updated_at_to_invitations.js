const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'

const SQL = `
-- Add updated_at column to invitations table
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;

CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`

async function addColumn() {
    console.log('🔧 Agregando columna updated_at a tabla invitations...\n')

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
            console.log('✅ Columna updated_at agregada exitosamente')
            console.log('✅ Trigger creado para auto-actualizar')
        } else {
            const error = await response.text()
            console.error('❌ Error:', error)
        }

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

addColumn()
