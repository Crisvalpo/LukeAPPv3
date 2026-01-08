import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://rvgrhtqxzfcypbfxqilp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2Z3JodHF4emZjeXBiZnhxaWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MDgyMjEsImV4cCI6MjA4MjA4NDIyMX0.pqeQkyGrK_EWx28OSR6eaph9Vdg1kzdUiNZe3wKtrT8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL() {
    console.log('🚀 Reading SQL file...')
    const sql = readFileSync('./COMPLETE_E2E_TEST.sql', 'utf-8')

    console.log('📤 Executing SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }

    console.log('✅ Success!')
    console.log('Result:', JSON.stringify(data, null, 2))
}

runSQL()
