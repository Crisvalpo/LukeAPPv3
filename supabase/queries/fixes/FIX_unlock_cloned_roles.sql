-- FIX: Unlock Cloned Roles
-- Updates any role attached to a company to be NOT a template (editable/deletable)
-- This fixes the issue where cloned roles were marked as "System Templates" and locked.

UPDATE public.company_roles
SET is_template = false
WHERE company_id IS NOT NULL
AND is_template = true;
