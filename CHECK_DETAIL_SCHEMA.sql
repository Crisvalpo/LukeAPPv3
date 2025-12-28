-- Check columns for spools and welds to ensure compatibility
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('spools', 'welds')
ORDER BY table_name, ordinal_position;
