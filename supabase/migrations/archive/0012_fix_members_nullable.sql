-- ============================================
-- FIX: Allow NULL company_id for super_admins
-- ============================================

-- Remove NOT NULL constraint from company_id
ALTER TABLE public.members 
ALTER COLUMN company_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'members' 
AND table_schema = 'public'
AND column_name IN ('company_id', 'project_id', 'role_id');
