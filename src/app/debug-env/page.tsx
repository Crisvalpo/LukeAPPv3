'use client'

export default function DebugEnv() {
    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Environment Debug</h1>
            <pre>
                NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
                {'\n'}
                NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' :
                    'NOT SET'}
            </pre>
        </div>
    )
}
