-- Migration: Allocation Engine Logic
-- Description: Atomic distribution of inventory to spools
-- Author: LukeAPP v3
-- Date: 2026-02-15

-- 1. Allocation Engine
CREATE OR REPLACE FUNCTION fn_run_allocation_engine(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_spool record;
    v_mto record;
    v_inv record;
    v_req_qty numeric;
    v_alloc_qty numeric;
BEGIN
    -- 1. Reset current allocations for the project
    -- This ensures we re-prioritize based on current spool status
    DELETE FROM material_commitments WHERE project_id = p_project_id;
    
    -- 2. Reset available quantities in inventory
    UPDATE inventory_receptions 
    SET quantity_available = quantity_received 
    WHERE project_id = p_project_id;

    -- 3. Loop through approved spools by priority (older first)
    FOR v_spool IN 
        SELECT id FROM spools 
        WHERE project_id = p_project_id 
        AND status IN ('STAGED', 'PENDING', 'IN_FABRICATION')
        ORDER BY created_at ASC 
    LOOP
        -- For each component in the spool
        FOR v_mto IN 
            SELECT * FROM spools_mto WHERE spool_id = v_spool.id
        LOOP
            v_req_qty := v_mto.qty;

            -- Find available inventory for this master_id + dimension_id
            FOR v_inv IN 
                SELECT * FROM inventory_receptions 
                WHERE master_id = v_mto.master_id 
                AND dimension_id = v_mto.dimension_id
                AND quantity_available > 0
                ORDER BY received_at ASC -- FIFO
            LOOP
                EXIT WHEN v_req_qty <= 0;

                v_alloc_qty := LEAST(v_req_qty, v_inv.quantity_available);
                
                -- Create commitment
                INSERT INTO material_commitments (
                    project_id,
                    spool_id,
                    inventory_id,
                    quantity_committed
                ) VALUES (
                    p_project_id,
                    v_spool.id,
                    v_inv.id,
                    v_alloc_qty
                );

                -- Deduct from inventory
                UPDATE inventory_receptions 
                SET quantity_available = quantity_available - v_alloc_qty
                WHERE id = v_inv.id;

                v_req_qty := v_req_qty - v_alloc_qty;
            END LOOP;
        END LOOP;

        -- 4. Update Spool Readiness Status
        -- Check if all requirements for this spool are satisfied
        IF NOT EXISTS (
            SELECT 1 FROM spools_mto m
            LEFT JOIN (
                SELECT spool_id, SUM(quantity_committed) as total_alloc 
                FROM material_commitments 
                GROUP BY spool_id
            ) c ON c.spool_id = m.spool_id
            WHERE m.spool_id = v_spool.id 
            AND (c.total_alloc IS NULL OR c.total_alloc < (SELECT SUM(qty) FROM spools_mto WHERE spool_id = v_spool.id))
        ) THEN
            UPDATE spools SET material_readiness = 'READY' WHERE id = v_spool.id;
        ELSIF EXISTS (
            SELECT 1 FROM material_commitments WHERE spool_id = v_spool.id
        ) THEN
            UPDATE spools SET material_readiness = 'PARTIAL' WHERE id = v_spool.id;
        ELSE
            UPDATE spools SET material_readiness = 'PENDING' WHERE id = v_spool.id;
        END IF;

    END LOOP;
END;
$function$;

-- 2. Shortage Reporting Function
CREATE OR REPLACE FUNCTION fn_get_material_shortages(p_project_id uuid)
RETURNS TABLE (
    master_id uuid,
    dimension_id uuid,
    commodity_code text,
    nps text,
    total_demand numeric,
    total_stock numeric,
    shortage numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH demand AS (
        SELECT 
            m.master_id, 
            m.dimension_id, 
            SUM(m.qty) as req
        FROM spools_mto m
        WHERE m.project_id = p_project_id
        GROUP BY m.master_id, m.dimension_id
    ),
    stock AS (
        SELECT 
            s.master_id, 
            s.dimension_id, 
            SUM(s.quantity_received) as available
        FROM inventory_receptions s
        WHERE s.project_id = p_project_id
        GROUP BY s.master_id, s.dimension_id
    )
    SELECT 
        d.master_id,
        d.dimension_id,
        c.commodity_code,
        dm.nps,
        d.req as total_demand,
        COALESCE(s.available, 0) as total_stock,
        GREATEST(0, d.req - COALESCE(s.available, 0)) as shortage
    FROM demand d
    JOIN master_catalog c ON c.id = d.master_id
    JOIN master_dimensions dm ON dm.id = d.dimension_id
    LEFT JOIN stock s ON s.master_id = d.master_id AND s.dimension_id = d.dimension_id
    WHERE (d.req - COALESCE(s.available, 0)) > 0;
END;
$function$;
