
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const BUCKET_ID = 'project-files';
const TARGET_PREFIX = 'empresa-de-prueba-3550ea15';

async function cleanupStorage() {
    console.log(`Starting cleanup for prefix: ${TARGET_PREFIX} in bucket: ${BUCKET_ID}`);

    // List root level items first
    const { data: rootItems, error: listError } = await supabase
        .storage
        .from(BUCKET_ID)
        .list(TARGET_PREFIX, { limit: 100 });

    if (listError) {
        console.error('Error listing root items:', listError);
        process.exit(1);
    }

    console.log(`Found ${rootItems?.length || 0} items in root of ${TARGET_PREFIX}`);

    if (rootItems) {
        for (const item of rootItems) {
            console.log(`- Item: ${item.name} (id: ${item.id})`);
        }
    }

    // Recursive delete
    await deleteFolderContents(TARGET_PREFIX);
}

async function deleteFolderContents(folderPath) {
    console.log(`Listing ${folderPath}...`);
    const { data: items, error } = await supabase.storage.from(BUCKET_ID).list(folderPath, { limit: 100 });

    if (error) {
        console.error(`Error listing ${folderPath}:`, error);
        return;
    }

    if (!items || items.length === 0) {
        // If it's empty, we might need to delete the folder itself if it's an object?
        // But list(folder) lists content.
        return;
    }

    const filesToDelete = [];

    for (const item of items) {
        const fullPath = `${folderPath}/${item.name}`;

        if (item.id === null) {
            // It's a folder (or prefix)
            await deleteFolderContents(fullPath);
        } else {
            // It's a file
            filesToDelete.push(fullPath);
        }
    }

    if (filesToDelete.length > 0) {
        console.log(`Deleting ${filesToDelete.length} files in ${folderPath}...`);
        const { error: deleteError } = await supabase.storage.from(BUCKET_ID).remove(filesToDelete);
        if (deleteError) {
            console.error(`Error deleting files in ${folderPath}:`, deleteError);
        } else {
            console.log(`Deleted files in ${folderPath}`);
        }
    }
}

cleanupStorage();
