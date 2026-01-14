-- =================================================================
-- AUTO-CLEAR QUOTA STRIKES ON PLAN UPGRADE
-- =================================================================
-- Purpose: Automatically clear quota strikes when a company upgrades their subscription plan
-- This prevents the warning banner from persisting after resolving the quota issue
-- =================================================================

-- Function to clear quota strikes after plan upgrade
CREATE OR REPLACE FUNCTION public.clear_strikes_on_plan_upgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if subscription_tier changed (upgrade or downgrade)
    IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
        -- Delete all quota strikes for this company
        -- Rationale: If they changed plans, they're addressing the quota issue
        DELETE FROM public.quota_strikes 
        WHERE company_id = NEW.id;
        
        RAISE NOTICE 'Cleared quota strikes for company % after plan change from % to %', 
            NEW.id, OLD.subscription_tier, NEW.subscription_tier;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trg_clear_strikes_on_upgrade ON public.companies;

CREATE TRIGGER trg_clear_strikes_on_upgrade
    AFTER UPDATE OF subscription_tier ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.clear_strikes_on_plan_upgrade();

-- =================================================================
-- VERIFICATION
-- =================================================================

COMMENT ON FUNCTION public.clear_strikes_on_plan_upgrade() IS 
'Automatically clears quota strikes when a company changes their subscription plan (upgrade/downgrade). This removes warning banners after plan changes.';

COMMENT ON TRIGGER trg_clear_strikes_on_upgrade ON public.companies IS
'Triggers automatic strike cleanup when subscription_tier is updated';

-- =================================================================
-- TESTING
-- =================================================================

-- To test this trigger:
-- 1. Insert some test strikes for a company
-- 2. Update the company's subscription_tier
-- 3. Verify strikes are deleted

-- Example:
-- UPDATE companies SET subscription_tier = 'pro' WHERE id = '{your-company-id}';
-- SELECT COUNT(*) FROM quota_strikes WHERE company_id = '{your-company-id}'; -- Should return 0

-- =================================================================
