-- Fix Permission Denied errors (42501) for Material Control Module
-- Explicitly GRANT permissions to 'authenticated' role

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.material_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.material_request_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.material_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.material_receipt_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.material_inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.material_instances TO authenticated;

-- Ensure sequences are also accessible if any (though UUIDs are used, good practice)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
