-- Fix accept_invitation to not check expiration
CREATE OR REPLACE FUNCTION public.accept_invitation(
    token_input text,
    user_id_input uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inv_record record;
    member_record record;
    result jsonb;
BEGIN
    -- Validar invitación (sin check de expiración)
    SELECT * INTO inv_record
    FROM public.invitations
    WHERE token = token_input
    AND status = 'pending';

    IF inv_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invitación inválida o expirada'
        );
    END IF;

    -- Verificar que email coincida
    IF inv_record.email != (SELECT email FROM auth.users WHERE id = user_id_input) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Esta invitación no es para tu email'
        );
    END IF;

    -- Verificar si ya es miembro
    IF EXISTS (
        SELECT 1 FROM public.members
        WHERE user_id = user_id_input
        AND company_id = inv_record.company_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Ya eres miembro de esta empresa'
        );
    END IF;

    -- Crear member record
    INSERT INTO public.members (
        user_id,
        company_id,
        project_id,
        role_id,
        status
    ) VALUES (
        user_id_input,
        inv_record.company_id,
        inv_record.project_id,
        inv_record.role_id,
        'ACTIVE'
    )
    RETURNING * INTO member_record;

    -- Actualizar invitación
    UPDATE public.invitations
    SET status = 'accepted',
        updated_at = now()
    WHERE token = token_input;

    RETURN jsonb_build_object(
        'success', true,
        'message', '¡Invitación aceptada exitosamente!'
    );
END;
$$;
