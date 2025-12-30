-- RPC to set confirmation token manually
-- Allows bypassing hashed tokens by setting a known plaintext one.

CREATE OR REPLACE FUNCTION public.set_user_token(
    email_input text,
    token_input text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    UPDATE auth.users
    SET confirmation_token = token_input,
        confirmation_sent_at = now(),
        recovery_token = token_input -- Set recovery too just in case we verify recovery
    WHERE email = email_input;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_token(text, text) TO service_role;
