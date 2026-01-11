-- Enhance subscription_plans table
-- 1. Add max_storage_gb column if it doesn't exist
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS max_storage_gb integer DEFAULT 1;

-- 2. Update existing plans with strict values matching constant.ts
-- STARTER
UPDATE public.subscription_plans
SET 
  max_users = 3,
  max_projects = 1,
  max_storage_gb = 1,
  price_monthly = 29990
WHERE id = 'starter';

-- PRO
UPDATE public.subscription_plans
SET 
  max_users = 10,
  max_projects = 5,
  max_storage_gb = 10,
  price_monthly = 99990
WHERE id = 'pro';

-- ENTERPRISE
UPDATE public.subscription_plans
SET 
  max_users = 999,
  max_projects = 999,
  max_storage_gb = 100,
  price_monthly = 299990
WHERE id = 'enterprise';

-- 3. Ensure RLS is correct (Migration 0074 might have fixed it, but reinforcing public read is safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_plans' 
        AND policyname = 'subscription_plans_public_select'
    ) THEN
        CREATE POLICY "subscription_plans_public_select" 
        ON public.subscription_plans 
        FOR SELECT 
        TO anon, authenticated
        USING (true);
    END IF;
END
$$;
