-- LOBOTOMIZE THE TRIGGER FUNCTION
-- Instead of dropping the trigger (which proved difficult), we replace the function 
-- it calls with an empty one that just returns NEW.
-- This effectively disables the logic without removing the trigger object.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Do nothing. Just let the auth user be created.
    -- The actual profile creation will happen via 'accept_invitation' RPC
    -- or the 'invitations/confirm' page logic.
    RAISE NOTICE 'handle_new_user: Trigger bypassed by NO-OP function';
    RETURN new;
END;
$$;
