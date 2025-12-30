-- RPC to get confirmation token (for backend bypass)
-- SECURITY: This function exposes access tokens. ensure it is strictly protected or only used by service role.

CREATE OR REPLACE FUNCTION public.get_user_confirmation_token(
    email_input text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_token text;
BEGIN
    SELECT confirmation_token INTO v_token
    FROM auth.users
    WHERE email = email_input;
    
    RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_confirmation_token(text) TO service_role;
-- Do NOT grant to anon/authenticated.
