import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function generateMagicLink() {
    console.log('🔗 Generando Magic Link para luke@lukeapp.com...\n')

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: 'luke@lukeapp.com',
    })

    if (error) {
        console.error('❌ Error:', error.message)
        return
    }

    console.log('✅ Magic Link generado exitosamente!\n')
    console.log('📋 COPIA ESTE LINK Y ÁBRELO EN EL NAVEGADOR:\n')
    console.log(data.properties.action_link)
    console.log('\n⚠️  Este link expira en 1 hora.')
}

generateMagicLink().catch(console.error)
