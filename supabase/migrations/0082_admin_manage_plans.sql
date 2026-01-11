-- Enable RLS just in case (already enabled but good practice)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow Super Admins to UPDATE plans (e.g., change price, limits)
CREATE POLICY "Super Admins can update plans"
ON public.subscription_plans
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'superadmin' OR role = 'admin' -- Assuming admin/superadmin distinction
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'superadmin' OR role = 'admin'
  )
);

-- Note: We generally don't want them to DELETE plans as it breaks FKs, but update is fine.
