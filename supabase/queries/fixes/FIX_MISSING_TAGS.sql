-- 🛠️ FIX SCRIPT: Generate Missing Spool Tags
-- Run this if spools were created but tags (00001, etc.) are missing.

DO $$
DECLARE
    r RECORD;
    new_tag_id UUID;
    next_tag_num INTEGER;
    formatted_tag TEXT;
BEGIN
    -- Loop through all spools that have NO tag assigned yet
    FOR r IN 
        SELECT s.id, s.project_id, s.company_id, s.spool_number, s.revision_id, er.isometric_id 
        FROM spools s
        JOIN engineering_revisions er ON s.revision_id = er.id
        WHERE s.tag_registry_id IS NULL
        ORDER BY s.spool_number
    LOOP
        -- 1. Get next tag number for this project
        SELECT COALESCE(MAX(tag_number), 0) + 1 INTO next_tag_num
        FROM spool_tags_registry
        WHERE project_id = r.project_id;

        -- 2. Format tag (e.g. 00001) using the existing function
        formatted_tag := format_tag_display(next_tag_num, NULL);

        -- 3. Create Tag in Registry
        INSERT INTO spool_tags_registry (
            project_id, 
            company_id, 
            tag_number, 
            tag_suffix, 
            tag_display, 
            first_spool_number, 
            current_spool_number, 
            isometric_id,
            status, 
            created_in_revision_id, 
            last_seen_revision_id
        ) VALUES (
            r.project_id,
            r.company_id,
            next_tag_num,
            NULL, -- No suffix for initial fix
            formatted_tag,
            r.spool_number,
            r.spool_number,
            r.isometric_id,
            'ACTIVE',
            r.revision_id,
            r.revision_id
        ) RETURNING id INTO new_tag_id;

        -- 4. Link Spool to new Tag
        UPDATE spools 
        SET 
            tag_registry_id = new_tag_id,
            management_tag = formatted_tag
        WHERE id = r.id;
        
        RAISE NOTICE 'Assigned Tag % to Spool %', formatted_tag, r.spool_number;
    END LOOP;
END $$;
