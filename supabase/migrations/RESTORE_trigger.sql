-- RESTORE TRIGGER (Neutralized)
-- Reverts the "Nuclear Repair" which seemingly broke Auth Service permissions/state.

-- 1. Ensure Function Exists (NO-OP version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- NO-OP: Do nothing for now to prevent "Database error finding user"
    -- But ensure function exists so trigger works.
    RETURN NEW;
END;
$$;

-- 2. Restore Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
    RAISE NOTICE 'Trigger restored.';
END $$;
