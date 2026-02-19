
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const BUCKET_ID = 'project-files';
const TARGET_PREFIX = 'empresa-de-prueba-3550ea15';

async function diagnose() {
    console.log('=== DIAGNOSTIC: Listing ALL objects in bucket ===');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Bucket: ${BUCKET_ID}`);
    console.log(`Target prefix: ${TARGET_PREFIX}`);
    console.log('');

    // Method 1: List via Storage API at root
    console.log('--- Method 1: Storage API list at root ---');
    const { data: rootItems, error: rootError } = await supabase.storage
        .from(BUCKET_ID)
        .list('', { limit: 100 });

    if (rootError) {
        console.error('Root list error:', rootError);
    } else {
        console.log(`Root items (${rootItems?.length || 0}):`);
        rootItems?.forEach(item => {
            console.log(`  - ${item.name} (id: ${item.id}, metadata: ${JSON.stringify(item.metadata)})`);
        });
    }

    console.log('');
    console.log(`--- Method 2: Storage API list at prefix "${TARGET_PREFIX}" ---`);
    const { data: prefixItems, error: prefixError } = await supabase.storage
        .from(BUCKET_ID)
        .list(TARGET_PREFIX, { limit: 100 });

    if (prefixError) {
        console.error('Prefix list error:', prefixError);
    } else {
        console.log(`Items in ${TARGET_PREFIX} (${prefixItems?.length || 0}):`);
        prefixItems?.forEach(item => {
            console.log(`  - ${item.name} (id: ${item.id})`);
        });
    }

    // Method 3: List company subfolder
    console.log('');
    console.log(`--- Method 3: Storage API list at "${TARGET_PREFIX}/company" ---`);
    const { data: companyItems, error: companyError } = await supabase.storage
        .from(BUCKET_ID)
        .list(`${TARGET_PREFIX}/company`, { limit: 100 });

    if (companyError) {
        console.error('Company list error:', companyError);
    } else {
        console.log(`Items in ${TARGET_PREFIX}/company (${companyItems?.length || 0}):`);
        companyItems?.forEach(item => {
            console.log(`  - ${item.name} (id: ${item.id})`);
        });
    }

    // Method 4: Try to delete the company subfolder directly
    console.log('');
    console.log('--- Method 4: Attempting direct deletion of known .keep files ---');
    const knownFiles = [
        `${TARGET_PREFIX}/company/logos/.keep`,
        `${TARGET_PREFIX}/company/documents/.keep`,
    ];

    for (const filePath of knownFiles) {
        const { data, error } = await supabase.storage.from(BUCKET_ID).remove([filePath]);
        if (error) {
            console.log(`  FAIL: ${filePath} - ${error.message}`);
        } else {
            console.log(`  OK: Deleted ${filePath}`);
        }
    }

    // Method 5: Recursive delete with full path logging
    console.log('');
    console.log('--- Method 5: Recursive delete with full path logging ---');
    await recursiveDelete(TARGET_PREFIX);

    // Final check
    console.log('');
    console.log('--- Final check: Root items ---');
    const { data: finalItems } = await supabase.storage.from(BUCKET_ID).list('', { limit: 100 });
    console.log(`Root items remaining (${finalItems?.length || 0}):`);
    finalItems?.forEach(item => {
        console.log(`  - ${item.name}`);
    });
}

async function recursiveDelete(path) {
    const { data: items, error } = await supabase.storage.from(BUCKET_ID).list(path, { limit: 100 });

    if (error) {
        console.log(`  Error listing ${path}: ${error.message}`);
        return;
    }

    if (!items || items.length === 0) {
        console.log(`  Empty: ${path}`);
        return;
    }

    const files = [];
    const folders = [];

    for (const item of items) {
        const fullPath = `${path}/${item.name}`;
        if (item.id === null) {
            folders.push(fullPath);
        } else {
            files.push(fullPath);
            console.log(`  File found: ${fullPath} (id: ${item.id})`);
        }
    }

    // Delete files first
    if (files.length > 0) {
        const { data, error: delError } = await supabase.storage.from(BUCKET_ID).remove(files);
        if (delError) {
            console.log(`  Error deleting files in ${path}: ${delError.message}`);
        } else {
            console.log(`  Deleted ${files.length} files in ${path}`);
        }
    }

    // Recurse into folders
    for (const folder of folders) {
        await recursiveDelete(folder);
    }
}

diagnose().catch(console.error);
