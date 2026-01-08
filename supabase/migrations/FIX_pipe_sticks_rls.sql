-- Migration to fix Pipe Sticks RLS blocking Bodegueros
-- The previous policy restricted access to admin/founder/supervisor only.

DROP POLICY IF EXISTS "Users can manage pipe_sticks" ON pipe_sticks;

CREATE POLICY "Project members can manage pipe_sticks" ON pipe_sticks
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Also fix Workshop Deliveries just in case future features need it
DROP POLICY IF EXISTS "Users can manage workshop_deliveries" ON workshop_deliveries;

CREATE POLICY "Project members can manage workshop_deliveries" ON workshop_deliveries
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM members WHERE user_id = auth.uid()
    )
  );
