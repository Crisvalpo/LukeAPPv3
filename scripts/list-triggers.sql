SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema || '.' || event_object_table AS table_name,
    action_timing
FROM information_schema.triggers
ORDER BY event_object_schema, event_object_table, trigger_name;
