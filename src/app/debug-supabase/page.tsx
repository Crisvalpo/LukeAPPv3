'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugSupabase() {
    const [clientInfo, setClientInfo] = useState<any>(null)
    const [testResult, setTestResult] = useState<any>(null)

    useEffect(() => {
        const supabase = createClient()

        // Access internal config
        const config = (supabase as any).supabaseUrl
        const key = (supabase as any).supabaseKey

        setClientInfo({
            url: config,
            key: key?.substring(0, 20) + '...'
        })

        // Make a test request and capture the error
        supabase.from('subscription_plans')
            .select('*')
            .limit(1)
            .then((result) => {
                setTestResult({
                    success: !result.error,
                    error: result.error?.message,
                    data: result.data
                })
            })
    }, [])

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px' }}>
            <h1>Supabase Client Debug</h1>

            <section style={{ marginBottom: '30px' }}>
                <h2>Environment Variables (from Next.js)</h2>
                <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                    NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
                    {'\n'}
                    NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' :
                        'NOT SET'}
                </pre>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2>Supabase Client Configuration</h2>
                <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                    {clientInfo ? JSON.stringify(clientInfo, null, 2) : 'Loading...'}
                </pre>
            </section>

            <section>
                <h2>Test Request Result</h2>
                <pre style={{ background: testResult?.success ? '#e8f5e9' : '#ffebee', padding: '10px', borderRadius: '5px' }}>
                    {testResult ? JSON.stringify(testResult, null, 2) : 'Loading...'}
                </pre>
            </section>

            <section style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
                <h3>Instructions:</h3>
                <ol>
                    <li>Open DevTools (F12)</li>
                    <li>Go to Network tab</li>
                    <li>Refresh this page</li>
                    <li>Click on the failed request (subscription_plans)</li>
                    <li>Look at Request Headers tab</li>
                    <li>Check if 'apikey' header exists and what value it has</li>
                </ol>
            </section>
        </div>
    )
}
