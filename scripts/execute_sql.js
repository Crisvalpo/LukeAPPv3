const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = 'sbp_37ecfab1cb520d31c4401355a521faf75012fd3b'
const PROJECT_REF = 'rvgrhtqxzfcypbfxqilp'
const MANAGEMENT_API = 'https://api.supabase.com/v1'

async function executeSql() {
    console.log('🔄 Executing Migration via Management API...');

    try {
        const sqlPath = path.join(__dirname, '../supabase/migrations/0001_add_job_titles.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const response = await fetch(`${MANAGEMENT_API}/projects/${PROJECT_REF}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        })

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const result = await response.json();
        console.log('✅ SQL Executed Successfully!', result);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

executeSql();
