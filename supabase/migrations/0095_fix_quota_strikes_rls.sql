-- Allow super_admin (Staff) to view/manage all quota strikes
CREATE POLICY "Staff full access quota_strikes"
ON public.quota_strikes
FOR ALL
USING (public.is_super_admin());
