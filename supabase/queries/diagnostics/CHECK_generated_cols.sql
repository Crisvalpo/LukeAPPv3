SELECT 
    table_schema, 
    table_name, 
    column_name, 
    is_generated, 
    generation_expression 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND column_name = 'email' 
AND table_name IN ('users', 'identities');
