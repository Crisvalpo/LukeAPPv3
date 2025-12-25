-- Function to get the count of public profiles
-- This allows us to show the "Community" stats on the landing page
-- Bypasses RLS to get the raw count, but exposes no user data

create or replace function public.get_total_profiles()
returns integer
language plpgsql
security definer -- Runs with privileges of the creator (postgres), bypassing RLS
as $$
begin
  return (select count(*) from public.profiles);
end;
$$;

-- Grant execution to public (anon) and authenticated users
grant execute on function public.get_total_profiles() to anon, authenticated;

comment on function public.get_total_profiles is 'Returns the total number of registered profiles for landing page stats.';
