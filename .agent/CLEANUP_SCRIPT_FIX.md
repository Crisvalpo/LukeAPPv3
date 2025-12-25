# 🔧 How to Run Cleanup Script

## Problem
The cleanup script needs environment variables that aren't available in the terminal session.

## Solution for Next Time

### **Option 1: .env file (Recommended)**

1. Create `.env` in project root (already gitignored):
```env
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
PROJECT_REF=your_project_ref_here
```

2. Install dotenv:
```bash
npm install dotenv
```

3. Update script to use dotenv:
```javascript
require('dotenv').config()
```

### **Option 2: Inline execution**

Run with inline env vars:
```bash
set SUPABASE_ACCESS_TOKEN=sbp_xxx && set PROJECT_REF=xxx && node scripts/clean_db.js
```

### **Option 3: Create npm script**

Add to `package.json`:
```json
{
  "scripts": {
    "clean:db": "node scripts/clean_db.js"
  }
}
```

Then run with env vars from `.env.local`

## Current Workaround

Execute SQL manually in Supabase SQL Editor:
- File: `supabase/migrations/0010_clean_for_testing.sql`
- Or use the SQL block from `scripts/clean_db.js`

---

**Status:** Working workaround in place. Automation ready for next session with proper env setup.
