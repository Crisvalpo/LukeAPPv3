import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const OUTPUT_FILE = join(process.cwd(), 'supabase', 'FULL_DATABASE_SETUP.sql');

// List of specific files in order (based on REBOOT_PROJECT.ts logic)
// Or just reading strictly by name since they are numbered.
// The numbering 0000, 0001 is good.
// But we have verified list in REBOOT_PROJECT.ts. Let's start with strict numbering.

const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

let fullSql = '-- LUKEAPP V3 FULL DATABASE SETUP\n-- Generated automatically\n\n';

for (const file of files) {
    // Filter out diagnostic scripts and specific unwanted files
    if (
        !file.match(/^[0-9]+/) && // Must start with number
        !file.startsWith('SEED_genesis') // Or be the seed
    ) {
        continue;
    }

    // Validar safe list
    // Skip 0014, 0016b, 0040 as per previous plan
    if (file.startsWith('0014_') || file.startsWith('0016b_') || file.startsWith('0040_')) {
        continue;
    }

    console.log(`Adding ${file}...`);
    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    fullSql += `\n\n-- ==================================================================\n`;
    fullSql += `-- MIGRATION: ${file}\n`;
    fullSql += `-- ==================================================================\n\n`;
    fullSql += content + '\n';
}

writeFileSync(OUTPUT_FILE, fullSql);
console.log(`\n✅ Created consolidated SQL file at: ${OUTPUT_FILE}`);
console.log(`Instructions: Copy the content of this file and paste it into the Supabase SQL Editor.`);
