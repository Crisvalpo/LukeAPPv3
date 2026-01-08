const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'
const ENV_PATH = path.join(__dirname, '../.env.local');

async function updateEnv() {
    console.log('🔄 Updating .env.local with Service Key...');

    try {
        // 1. Fetch Key
        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/api-keys`, {
            headers: { 'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}` }
        })
        const keys = await response.json()
        const serviceKey = keys.find(k => k.name === 'service_role')?.api_key

        if (!serviceKey) throw new Error('Could not find service_role key');

        // 2. Read .env.local
        let envContent = '';
        if (fs.existsSync(ENV_PATH)) {
            envContent = fs.readFileSync(ENV_PATH, 'utf8');
        }

        // 3. Update
        if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
            console.log('⚠️ Key already exists in file. Updating it...');
            const lines = envContent.split('\n');
            const newLines = lines.map(line => {
                if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
                    return `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`;
                }
                return line;
            });
            envContent = newLines.join('\n');
        } else {
            console.log('✅ Appending new key...');
            envContent += `\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}\n`;
        }

        // 4. Write
        fs.writeFileSync(ENV_PATH, envContent);
        console.log('✅ .env.local updated successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateEnv();
