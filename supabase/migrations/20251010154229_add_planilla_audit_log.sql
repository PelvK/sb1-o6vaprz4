/*
  # Add Planilla Audit Log System

  1. New Tables
    - `planilla_audit_log`
      - `id` (uuid, primary key) - Unique identifier for each audit entry
      - `planilla_id` (uuid, foreign key) - Reference to the planilla being audited
      - `user_id` (uuid, foreign key) - User who performed the action
      - `action` (text) - Type of action performed
      - `entity_type` (text) - Type of entity affected (jugador, persona, planilla)
      - `entity_id` (text) - ID of the affected entity (nullable for status changes)
      - `details` (jsonb) - Additional details about the action
      - `created_at` (timestamptz) - Timestamp of the action

  2. Action Types
    - 'jugador_added' - Player added to planilla
    - 'jugador_deleted' - Player removed from planilla
    - 'persona_added' - Technical staff/delegate added
    - 'persona_deleted' - Technical staff/delegate removed
    - 'status_changed' - Planilla status changed
    - 'planilla_submitted' - Planilla submitted for approval
    - 'planilla_approved' - Planilla approved by admin
    - 'planilla_rejected' - Planilla rejected by admin

  3. Security
    - Enable RLS on audit log table
    - Users can view audit logs for their assigned planillas
    - Admins can view all audit logs
    - Only authenticated users can insert audit logs

  4. Indexes
    - Index on planilla_id for efficient lookups
    - Index on created_at for chronological queries

  5. Important Notes
    - Triggers automatically create audit entries when changes occur
    - All timestamps use timezone-aware timestamptz type
    - Details field stores additional context as JSON
    - User information is joined from profiles table for display
*/

-- Create planilla_audit_log table
CREATE TABLE IF NOT EXISTS planilla_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planilla_id uuid REFERENCES planillas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE planilla_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for planilla_audit_log
CREATE POLICY "Users can view audit logs of their assigned planillas"
  ON planilla_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_planillas
      WHERE user_planillas.planilla_id = planilla_audit_log.planilla_id
      AND user_planillas.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON planilla_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_planilla_id ON planilla_audit_log(planilla_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON planilla_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON planilla_audit_log(user_id);

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_planilla_id uuid;
  v_action text;
  v_entity_type text;
  v_details jsonb;
BEGIN
  -- Determine the planilla_id based on the table
  IF TG_TABLE_NAME = 'planillas' THEN
    v_planilla_id := COALESCE(NEW.id, OLD.id);
    v_entity_type := 'planilla';
    
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      v_action := 'status_changed';
      v_details := jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'jugadores' THEN
    v_planilla_id := COALESCE(NEW.planilla_id, OLD.planilla_id);
    v_entity_type := 'jugador';
    
    IF TG_OP = 'INSERT' THEN
      v_action := 'jugador_added';
      v_details := jsonb_build_object(
        'dni', NEW.dni,
        'name', NEW.name || ' ' || NEW.second_name,
        'number', NEW.number
      );
    ELSIF TG_OP = 'DELETE' THEN
      v_action := 'jugador_deleted';
      v_details := jsonb_build_object(
        'dni', OLD.dni,
        'name', OLD.name || ' ' || OLD.second_name,
        'number', OLD.number
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'personas' THEN
    v_planilla_id := COALESCE(NEW.planilla_id, OLD.planilla_id);
    v_entity_type := 'persona';
    
    IF TG_OP = 'INSERT' THEN
      v_action := 'persona_added';
      v_details := jsonb_build_object(
        'dni', NEW.dni,
        'name', NEW.name || ' ' || NEW.second_name,
        'charge', NEW.charge
      );
    ELSIF TG_OP = 'DELETE' THEN
      v_action := 'persona_deleted';
      v_details := jsonb_build_object(
        'dni', OLD.dni,
        'name', OLD.name || ' ' || OLD.second_name,
        'charge', OLD.charge
      );
    END IF;
  END IF;

  -- Insert audit log entry
  IF v_action IS NOT NULL THEN
    INSERT INTO planilla_audit_log (planilla_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      v_planilla_id,
      auth.uid(),
      v_action,
      v_entity_type,
      COALESCE(NEW.id::text, OLD.id::text),
      v_details
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER audit_planillas_changes
  AFTER UPDATE ON planillas
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_jugadores_changes
  AFTER INSERT OR DELETE ON jugadores
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_personas_changes
  AFTER INSERT OR DELETE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log_entry();
