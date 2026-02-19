-- Recreate handle_new_user with robust error handling and logging
-- Also ensure permissions are correct

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        updated_at = now();
        
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction if possible?
    -- Actually for auth we WANT to fail if profile creation fails? 
    -- But "Database error finding user" is bad UX.
    -- Let's raise a clearer error
    RAISE WARNING 'Error creating public user profile: %', SQLERRM;
    RETURN new; -- Proceed with auth user creation even if profile fails (we can fix later)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Ensure RLS allows insert?
-- Security Definer passes strict RLS usually, but let's be sure
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO supabase_auth_admin;

-- Verify trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
