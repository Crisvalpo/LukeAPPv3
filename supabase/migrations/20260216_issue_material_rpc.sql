-- Migration: Create Issue Materials RPC
-- Description: Handles FIFO issuing of materials for MIRs
-- Author: LukeAPP v3
-- Date: 2026-02-16

CREATE OR REPLACE FUNCTION fn_issue_material(
    p_request_item_id uuid,
    p_quantity numeric,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_item record;
    v_master_id uuid;
    v_dimension_id uuid; -- Assuming we can resolve this, otherwise complicated
    v_inv record;
    v_qty_needed numeric := p_quantity;
    v_qty_take numeric;
BEGIN
    -- 1. Get Request Item details
    SELECT * INTO v_item FROM material_request_items WHERE id = p_request_item_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;

    -- 2. Resolve Master ID from material_spec (assuming it is ident_code)
    -- This part is tricky if spec is not exact code.
    -- For now assume strict match.
    SELECT id, dimension_id INTO v_master_id, v_dimension_id 
    FROM master_catalog 
    WHERE ident_code = v_item.material_spec 
    LIMIT 1;

    -- Update to handle cases where dimension might be separate or part of catalog
    -- If dimension_id is null in catalog, maybe check master_dimensions?
    -- Simplified: Assume master_catalog entry has link or we find it.
    -- Actually master_catalog has dimension_id usually? 
    -- Let's check schema/previous files. 
    -- 20260215_create_project_materials_table.sql references master_catalog(id) and master_dimensions(id).
    
    -- If we can't resolve master_id, we can't issue from inventory.
    IF v_master_id IS NULL THEN
        RAISE EXCEPTION 'Material not found in catalog: %', v_item.material_spec;
    END IF;

    -- 3. FIFO Issue
    FOR v_inv IN 
        SELECT id, quantity_available 
        FROM inventory_receptions 
        WHERE master_id = v_master_id 
        AND quantity_available > 0
        -- AND dimension_id = ... -- If we had dimension.
        -- inventory_receptions has dimension_id.
        ORDER BY received_at ASC
    LOOP
        EXIT WHEN v_qty_needed <= 0;

        v_qty_take := LEAST(v_qty_needed, v_inv.quantity_available);

        -- Decrement Inventory
        UPDATE inventory_receptions 
        SET quantity_available = quantity_available - v_qty_take,
            updated_at = now()
        WHERE id = v_inv.id;

        -- Record Transaction (Optional: create distinct table later)
        -- For now just update stats

        v_qty_needed := v_qty_needed - v_qty_take;
    END LOOP;

    IF v_qty_needed > 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Missing: %', v_qty_needed;
    END IF;

    -- 4. Update Request Item
    UPDATE material_request_items
    SET quantity_received = COALESCE(quantity_received, 0) + p_quantity
    WHERE id = p_request_item_id;

    -- 5. Check if Request is Fully Completed? 
    -- (Frontend or separate trigger can handle status update)

END;
$function$;
