-- Server-side fix for search_path and permissions
ALTER ROLE postgres SET search_path = "$user", public, auth, extensions;
ALTER ROLE service_role SET search_path = "$user", public, auth, extensions;
ALTER ROLE authenticated SET search_path = "$user", public, auth, extensions;
ALTER ROLE anon SET search_path = "$user", public, auth, extensions;

GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
