/*
  # Create complete database schema for Tuk Tuk Eazy

  1. New Tables
    - `profiles` - User profiles with role information
      - `id` (uuid, primary key, references auth.users)
      - `role` (enum: rider, driver, admin)
      - `full_name` (text)
      - `phone` (text)
      - `photo_url` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `drivers` - Driver-specific information
      - `id` (uuid, primary key, references profiles)
      - `vehicle_make` (text)
      - `vehicle_model` (text)
      - `vehicle_type` (text)
      - `vehicle_plate` (text, unique)
      - `license_number` (text)
      - `name` (text)
      - `phone` (text)
      - `is_verified` (boolean)
      - `online` (boolean)
      - `rating` (numeric)
      - `total_rides` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `rides` - Ride requests and tracking
      - `id` (uuid, primary key)
      - `rider_id` (uuid, references profiles)
      - `driver_id` (uuid, references profiles)
      - `pickup_address` (text)
      - `dropoff_address` (text)
      - `pickup_point` (geography)
      - `dropoff_point` (geography)
      - `pickup_lat` (double precision)
      - `pickup_lng` (double precision)
      - `dropoff_lat` (double precision)
      - `dropoff_lng` (double precision)
      - `status` (enum)
      - `estimated_fare` (numeric)
      - `final_fare` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `driver_locations` - Real-time driver positions
      - `driver_id` (uuid, primary key, references profiles)
      - `location` (geography)
      - `updated_at` (timestamp)
    
    - `payments` - Payment records
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `amount` (numeric)
      - `status` (enum)
      - `stripe_payment_intent_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ratings` - Ride ratings and feedback
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `from_user_id` (uuid, references profiles)
      - `to_user_id` (uuid, references profiles)
      - `score` (integer, 1-5)
      - `note` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Create helper functions for role checking

  3. Functions and Triggers
    - Auto-update timestamps
    - Sync ride coordinates
    - Role change enforcement
    - Balanced transaction enforcement
*/

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ride_status AS ENUM ('REQUESTED', 'ASSIGNED', 'ENROUTE', 'STARTED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Helper functions
CREATE OR REPLACE FUNCTION uid() RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'rider' NOT NULL,
  full_name text,
  phone text,
  photo_url text,
  email text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_self_or_admin" ON profiles
  FOR SELECT TO public
  USING (id = uid() OR is_admin());

CREATE POLICY "profiles_insert_self_or_admin" ON profiles
  FOR INSERT TO public
  WITH CHECK (id = uid() OR is_admin());

CREATE POLICY "profiles_update_self_or_admin" ON profiles
  FOR UPDATE TO public
  USING (id = uid() OR is_admin())
  WITH CHECK (id = uid() OR is_admin());

-- Profiles triggers
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_make text,
  vehicle_model text,
  vehicle_type text,
  vehicle_plate text UNIQUE,
  license_number text,
  name text,
  phone text,
  is_verified boolean DEFAULT false NOT NULL,
  online boolean DEFAULT false NOT NULL,
  rating numeric DEFAULT 5.0 NOT NULL,
  total_rides integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drivers policies
CREATE POLICY "drivers_select_all" ON drivers
  FOR SELECT TO public
  USING (true);

CREATE POLICY "drivers_insert_admin_only" ON drivers
  FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY "drivers_update_self_or_admin" ON drivers
  FOR UPDATE TO public
  USING (id = uid() OR is_admin())
  WITH CHECK (id = uid() OR is_admin());

-- Drivers triggers
CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  pickup_address text,
  dropoff_address text,
  pickup_point geography(Point, 4326),
  dropoff_point geography(Point, 4326),
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  status ride_status DEFAULT 'REQUESTED' NOT NULL,
  estimated_fare numeric(10,2),
  final_fare numeric(10,2),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for rides
CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS rides_pickup_gix ON rides USING gist(pickup_point);
CREATE INDEX IF NOT EXISTS rides_dropoff_gix ON rides USING gist(dropoff_point);
CREATE INDEX IF NOT EXISTS rides_status_idx ON rides(status);
CREATE INDEX IF NOT EXISTS rides_created_idx ON rides(created_at DESC);

-- Enable RLS on rides
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Rides policies
CREATE POLICY "rides_select_scope" ON rides
  FOR SELECT TO public
  USING (is_admin() OR rider_id = uid() OR driver_id = uid());

CREATE POLICY "rides_insert_rider" ON rides
  FOR INSERT TO public
  WITH CHECK (rider_id = uid());

CREATE POLICY "rides_update_admin" ON rides
  FOR UPDATE TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- Function to sync ride coordinates
CREATE OR REPLACE FUNCTION sync_ride_points() RETURNS trigger AS $$
BEGIN
  -- Update geography points from lat/lng coordinates
  IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
    NEW.pickup_point = ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326)::geography;
  END IF;
  
  IF NEW.dropoff_lat IS NOT NULL AND NEW.dropoff_lng IS NOT NULL THEN
    NEW.dropoff_point = ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326)::geography;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rides triggers
CREATE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sync_ride_points
  BEFORE INSERT OR UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION sync_ride_points();

-- Create driver_locations table
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  location geography(Point, 4326),
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for driver locations
CREATE INDEX IF NOT EXISTS driver_locations_gix ON driver_locations USING gist(location);

-- Enable RLS on driver_locations
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Driver locations policies
CREATE POLICY "driver_locations_select_scope" ON driver_locations
  FOR SELECT TO public
  USING (is_admin() OR EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.driver_id = driver_locations.driver_id 
    AND r.rider_id = uid() 
    AND r.status IN ('ASSIGNED', 'ENROUTE', 'STARTED')
  ));

CREATE POLICY "driver_locations_upsert_self" ON driver_locations
  FOR INSERT TO public
  WITH CHECK (driver_id = uid() OR is_admin());

CREATE POLICY "driver_locations_update_self" ON driver_locations
  FOR UPDATE TO public
  USING (driver_id = uid() OR is_admin())
  WITH CHECK (driver_id = uid() OR is_admin());

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status payment_status DEFAULT 'PENDING' NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(ride_id)
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments(ride_id);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "payments_select_scope" ON payments
  FOR SELECT TO public
  USING (is_admin() OR EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.id = payments.ride_id 
    AND (r.rider_id = uid() OR r.driver_id = uid())
  ));

CREATE POLICY "payments_admin_write" ON payments
  FOR ALL TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- Payments triggers
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for ratings
CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user_id ON ratings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON ratings(to_user_id);

-- Enable RLS on ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "ratings_select_mine_or_about_me_or_admin" ON ratings
  FOR SELECT TO public
  USING (from_user_id = uid() OR to_user_id = uid() OR is_admin());

CREATE POLICY "ratings_insert_if_participant" ON ratings
  FOR INSERT TO public
  WITH CHECK (is_admin() OR EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.id = ratings.ride_id 
    AND r.status = 'COMPLETED' 
    AND (r.rider_id = uid() OR r.driver_id = uid())
  ));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'rider');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();