-- ==========================================
-- RPC: Get Invitation By Token (Secure Public Access)
-- ==========================================
-- Allows anonymous users (via Accept Page) to read invitation details
-- ONLY if they possess the valid unique token.

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_input text)
RETURNS TABLE (
    id uuid,
    email text,
    role_id public.user_role,
    company_name text,
    project_name text,
    status public.invitation_status
)
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role_id,
        c.name as company_name,
        p.name as project_name,
        i.status
    FROM public.invitations i
    JOIN public.companies c ON c.id = i.company_id
    LEFT JOIN public.projects p ON p.id = i.project_id
    WHERE i.token = token_input
    AND i.status = 'pending';
END;
$$;

-- Grant access to anon (public) and authenticated
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
