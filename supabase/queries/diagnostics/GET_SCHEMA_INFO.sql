-- QUERY TO EXTRACT DATABASE SCHEMA AS JSON
-- Run this in Supabase SQL Editor to get the LIVE snapshot of your database structure.
-- Copy the resulting JSON output and paste it back to the assistant.

WITH table_info AS (
    SELECT 
        t.table_name,
        (
            SELECT json_agg(
                json_build_object(
                    'name', c.column_name,
                    'type', c.udt_name,
                    'nullable', c.is_nullable,
                    'default', c.column_default
                ) ORDER BY c.ordinal_position
            )
            FROM information_schema.columns c 
            WHERE c.table_schema = 'public' AND c.table_name = t.table_name
        ) as columns,
        (
            SELECT json_agg(
                json_build_object(
                    'name', tc.constraint_name,
                    'type', tc.constraint_type
                )
            )
            FROM information_schema.table_constraints tc
            WHERE tc.table_schema = 'public' AND tc.table_name = t.table_name
        ) as constraints
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
)
SELECT json_agg(table_info) as current_schema_snapshot FROM table_info;
