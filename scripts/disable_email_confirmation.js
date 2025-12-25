const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

async function disableEmailConfirmation() {
    console.log('🔧 Deshabilitando confirmación de email...\n')

    // API endpoint para actualizar auth settings
    const url = `${MANAGEMENT_API}/projects/${PROJECT_REF}/config/auth`

    try {
        // Primero obtener la configuración actual
        const getResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        })

        if (!getResponse.ok) {
            throw new Error(`Error obteniendo config: ${await getResponse.text()}`)
        }

        const currentConfig = await getResponse.json()
        console.log('📋 Configuración actual obtenida')

        // Actualizar configuración
        const newConfig = {
            ...currentConfig,
            DISABLE_SIGNUP: false,
            MAILER_AUTOCONFIRM: true  // ← Esto deshabilita confirmación de email
        }

        const updateResponse = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newConfig)
        })

        if (!updateResponse.ok) {
            throw new Error(`Error actualizando: ${await updateResponse.text()}`)
        }

        console.log('✅ Confirmación de email DESHABILITADA')
        console.log('✅ Los usuarios nuevos tendrán sesión activa inmediatamente')
        console.log('\n⚠️  Nota: Cambio puede tardar 1-2 minutos en aplicarse\n')

    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

disableEmailConfirmation()
