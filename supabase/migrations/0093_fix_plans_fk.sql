-- 1. Ensure subscription_plans.id uses the same type as companies.subscription_tier (or castable)
-- Since companies.subscription_tier is an ENUM 'subscription_tier', we should cast subscription_plans.id to that ENUM if we want a direct FK.
-- However, ID represents the plan code.
-- Let's check if we can cast 'id' to the enum.

-- 1. Alter subscription_plans to use the Enum for ID (if possible) or keep as text.
-- FKs require matching types.
-- Let's try casting subscription_plans.id to subscription_tier Enum.
-- Note: This requires all current IDs in subscription_plans ('starter', 'pro', etc.) to prevent failing if they don't match the enum.

-- SAFE APPROACH:
-- Let's assume 'starter', 'pro', 'enterprise' are the IDs in subscription_plans.
-- We cast subscription_plans.id to subscription_tier.

ALTER TABLE public.subscription_plans
ALTER COLUMN id TYPE public.subscription_tier USING id::public.subscription_tier;

-- 2. Add Foreign Key
ALTER TABLE public.companies
ADD CONSTRAINT fk_companies_subscription_plan
FOREIGN KEY (subscription_tier)
REFERENCES public.subscription_plans (id)
ON UPDATE CASCADE;
