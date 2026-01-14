-- =================================================================
-- RESET QUOTA STRIKES (Clear warnings after upgrading plan/fixing quota)
-- =================================================================
-- 
-- Purpose: When a company upgrades their plan or reduces spools to be within limits,
-- the historical quota strikes should be cleared to remove the warning banner.
--
-- Usage: Replace {company_id} with your actual company UUID
-- =================================================================

-- Option 1: Clear ALL quota strikes for a specific company
DELETE FROM public.quota_strikes 
WHERE company_id = '{company_id}';

-- Option 2: Clear only old strikes (keep today's if any)
-- DELETE FROM public.quota_strikes 
-- WHERE company_id = '{company_id}'
-- AND date < CURRENT_DATE;

-- Option 3: Clear strikes older than X days
-- DELETE FROM public.quota_strikes 
-- WHERE company_id = '{company_id}'
-- AND date < (CURRENT_DATE - INTERVAL '7 days');

-- Verify the strikes are cleared
SELECT 
    date,
    resource_type,
    usage_value,
    created_at
FROM public.quota_strikes
WHERE company_id = '{company_id}'
ORDER BY date DESC;

-- Expected result: 0 rows (strikes cleared)

-- =================================================================
-- NOTES:
-- =================================================================
-- 
-- The quota_strikes table tracks days where the company exceeded their limits:
-- - 1 strike = Warning 1/3
-- - 2 strikes = Warning 2/3  
-- - 3 strikes = Blocked
--
-- Strikes accumulate daily (one strike per day max).
-- If you resolve the quota issue (upgrade plan, delete spools, etc.),
-- you should manually clear the strikes as shown above.
--
-- After clearing strikes, the QuotaLimitBanner will no longer display.
-- =================================================================
