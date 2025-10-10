/*
  # Create Planillas Management System Schema

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `nombre` (text, team name)
      - `category` (integer, year category)
      - `created_at` (timestamp)
    
    - `planillas`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `status` (text, one of: 'Pendiente de envío', 'Pendiente de aprobación', 'Aprobada')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `jugadores`
      - `id` (uuid, primary key)
      - `planilla_id` (uuid, foreign key to planillas)
      - `dni` (text)
      - `number` (integer, dorsal number)
      - `name` (text)
      - `second_name` (text, apellido)
      - `created_at` (timestamp)
    
    - `personas`
      - `id` (uuid, primary key)
      - `planilla_id` (uuid, foreign key to planillas)
      - `dni` (text)
      - `name` (text)
      - `second_name` (text, apellido)
      - `phone_number` (text)
      - `charge` (text, either 'Técnico' or 'Delegado')
      - `created_at` (timestamp)
    
    - `user_planillas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `planilla_id` (uuid, foreign key to planillas)
      - `created_at` (timestamp)
    
    - `profiles`
      - `id` (uuid, primary key, foreign key to auth.users)
      - `username` (text)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to view their assigned planillas
    - Add policies for admins to manage all planillas
    - Add policies for users to update planillas in 'Pendiente de envío' status
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  category integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create planillas table
CREATE TABLE IF NOT EXISTS planillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'Pendiente de envío' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('Pendiente de envío', 'Pendiente de aprobación', 'Aprobada'))
);

ALTER TABLE planillas ENABLE ROW LEVEL SECURITY;

-- Create jugadores table
CREATE TABLE IF NOT EXISTS jugadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planilla_id uuid REFERENCES planillas(id) ON DELETE CASCADE NOT NULL,
  dni text NOT NULL,
  number integer NOT NULL,
  name text NOT NULL,
  second_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;

-- Create personas table (técnicos and delegados)
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planilla_id uuid REFERENCES planillas(id) ON DELETE CASCADE NOT NULL,
  dni text NOT NULL,
  name text NOT NULL,
  second_name text NOT NULL,
  phone_number text NOT NULL,
  charge text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_charge CHECK (charge IN ('Técnico', 'Delegado'))
);

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create user_planillas table (assignment table)
CREATE TABLE IF NOT EXISTS user_planillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  planilla_id uuid REFERENCES planillas(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, planilla_id)
);

ALTER TABLE user_planillas ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Authenticated users can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for planillas
CREATE POLICY "Users can view their assigned planillas"
  ON planillas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_planillas
      WHERE user_planillas.planilla_id = planillas.id
      AND user_planillas.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert planillas"
  ON planillas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can update their assigned planillas if pending"
  ON planillas FOR UPDATE
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM user_planillas
        WHERE user_planillas.planilla_id = planillas.id
        AND user_planillas.user_id = auth.uid()
      )
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM user_planillas
        WHERE user_planillas.planilla_id = planillas.id
        AND user_planillas.user_id = auth.uid()
      )
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for jugadores
CREATE POLICY "Users can view jugadores of their assigned planillas"
  ON jugadores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_planillas
      WHERE user_planillas.planilla_id = jugadores.planilla_id
      AND user_planillas.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert jugadores if planilla is pending"
  ON jugadores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = jugadores.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can update jugadores if planilla is pending"
  ON jugadores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = jugadores.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = jugadores.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can delete jugadores if planilla is pending"
  ON jugadores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = jugadores.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for personas (same as jugadores)
CREATE POLICY "Users can view personas of their assigned planillas"
  ON personas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_planillas
      WHERE user_planillas.planilla_id = personas.planilla_id
      AND user_planillas.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can insert personas if planilla is pending"
  ON personas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = personas.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can update personas if planilla is pending"
  ON personas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = personas.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = personas.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can delete personas if planilla is pending"
  ON personas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM planillas
      JOIN user_planillas ON user_planillas.planilla_id = planillas.id
      WHERE planillas.id = personas.planilla_id
      AND user_planillas.user_id = auth.uid()
      AND planillas.status = 'Pendiente de envío'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for user_planillas
CREATE POLICY "Users can view their own assignments"
  ON user_planillas FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON user_planillas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete assignments"
  ON user_planillas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_planillas_team_id ON planillas(team_id);
CREATE INDEX IF NOT EXISTS idx_planillas_status ON planillas(status);
CREATE INDEX IF NOT EXISTS idx_jugadores_planilla_id ON jugadores(planilla_id);
CREATE INDEX IF NOT EXISTS idx_personas_planilla_id ON personas(planilla_id);
CREATE INDEX IF NOT EXISTS idx_user_planillas_user_id ON user_planillas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_planillas_planilla_id ON user_planillas(planilla_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_planillas_updated_at BEFORE UPDATE ON planillas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
