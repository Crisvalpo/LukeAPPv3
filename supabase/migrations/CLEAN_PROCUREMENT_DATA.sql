-- Clean Procurement Data (Keep Catalog)
-- Purpose: Wipe procurement transactions but preserve material catalog

-- 1. TRUNCATE PROCUREMENT TABLES (in order to respect FK constraints)
TRUNCATE TABLE material_receipt_items CASCADE;
TRUNCATE TABLE material_receipts CASCADE;
TRUNCATE TABLE material_request_items CASCADE;
TRUNCATE TABLE material_requests CASCADE;
TRUNCATE TABLE material_inventory CASCADE;
TRUNCATE TABLE material_instances CASCADE;

-- 2. VERIFICATION
SELECT 
  'material_requests' as table_name, COUNT(*) as row_count FROM material_requests
UNION ALL
SELECT 'material_request_items', COUNT(*) FROM material_request_items
UNION ALL
SELECT 'material_receipts', COUNT(*) FROM material_receipts
UNION ALL
SELECT 'material_receipt_items', COUNT(*) FROM material_receipt_items
UNION ALL
SELECT 'material_inventory', COUNT(*) FROM material_inventory
UNION ALL
SELECT 'material_instances', COUNT(*) FROM material_instances
UNION ALL
SELECT 'material_catalog (preserved)', COUNT(*) FROM material_catalog;
