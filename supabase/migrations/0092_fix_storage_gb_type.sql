-- Change max_storage_gb to NUMERIC to allow fractional GB limits (e.g. 0.01 GB for 10MB)
ALTER TABLE public.subscription_plans
ALTER COLUMN max_storage_gb TYPE NUMERIC(10, 3);
