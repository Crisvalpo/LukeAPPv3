
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
    console.log('--- REPAIR ROUTE TRIGGERED ---');

    // We try to use 'pg' to connect to the DB directly since we are running on the server
    // On the lukeserver, the DB is in docker.
    // The connection should be possible if we use the correct host.
    // However, from within the Next.js app on the host, 'localhost' should work if ports are exposed.

    const client = new Client({
        host: 'localhost',
        port: 5432, // Try default postgres port on host
        user: 'postgres',
        password: 'SupabaseStrongPass2025!',
        database: 'postgres',
    });

    try {
        await client.connect();
        console.log('Connected to DB via pg');

        await client.query(`ALTER TABLE public.spools ADD COLUMN IF NOT EXISTS parent_spool_id UUID REFERENCES public.spools(id) ON DELETE SET NULL;`);
        console.log('Added parent_spool_id');

        await client.query(`
            CREATE TABLE IF NOT EXISTS public.structure_models (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                area TEXT,
                model_url TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            ALTER TABLE public.structure_models ENABLE ROW LEVEL SECURITY;
            DO $$ BEGIN
                CREATE POLICY "Enable read access for authenticated users" ON public.structure_models FOR SELECT TO authenticated USING (true);
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
            DO $$ BEGIN
                CREATE POLICY "Enable all access for authenticated users" ON public.structure_models FOR ALL TO authenticated USING (true) WITH CHECK (true);
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `);
        console.log('Repaired structure_models');

        await client.query(`NOTIFY pgrst, 'reload schema';`);
        console.log('Reloaded schema');

        return NextResponse.json({ success: true, message: 'Schema repaired' });
    } catch (err: any) {
        console.error('Repair failed:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    } finally {
        await client.end();
    }
}
