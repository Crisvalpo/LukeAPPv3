-- Complete fix for subscription_plans RLS and permissions

-- 1. Enable RLS if not already enabled
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Public read subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Allow authenticated users to read subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_select_policy" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_public_read" ON public.subscription_plans;

-- 3. Create policy allowing BOTH anon and authenticated to read
CREATE POLICY "subscription_plans_public_select" 
ON public.subscription_plans 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 4. Grant SELECT permission to anon and authenticated roles
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
