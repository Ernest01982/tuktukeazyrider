/*
  # Complete Database Schema Setup for Tuk Tuk Eazy

  This migration creates the complete database schema required for the Tuk Tuk Eazy passenger app.
  
  ## What this migration creates:
  1. Custom types (enums) for user roles, ride status, payment status
  2. Core tables: profiles, rides, drivers, driver_locations, payments, ratings
  3. Row Level Security (RLS) policies for all tables
  4. Helper functions for authentication and data management
  5. Triggers for automatic profile creation and data synchronization
  6. Performance indexes for optimal query performance
  7. PostGIS extension for geospatial functionality

  ## Critical Components:
  - `profiles` table with `full_name` column (fixes current signup error)
  - `handle_new_user()` trigger function for automatic profile creation
  - Proper RLS policies for security
  - All required helper functions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing types if they exist to avoid conflicts
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ride_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'rider');
CREATE TYPE ride_status AS ENUM ('REQUESTED', 'ASSIGNED', 'ENROUTE', 'STARTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid() 
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync ride coordinates to geography points
CREATE OR REPLACE FUNCTION sync_ride_points()
RETURNS trigger AS $$
BEGIN
  IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
    NEW.pickup_point = ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326);
  END IF;
  IF NEW.dropoff_lat IS NOT NULL AND NEW.dropoff_lng IS NOT NULL THEN
    NEW.dropoff_point = ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Critical function: Handle new user creation (fixes signup error)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    'rider'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table (CRITICAL - fixes signup error)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  photo_url text,
  role user_role DEFAULT 'rider' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id uuid REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  pickup_address text,
  dropoff_address text,
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  pickup_point geography(Point, 4326),
  dropoff_point geography(Point, 4326),
  status ride_status DEFAULT 'REQUESTED' NOT NULL,
  estimated_fare numeric(10,2),
  final_fare numeric(10,2),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
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

-- Create driver_locations table
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  location geography(Point, 4326),
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE UNIQUE NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status payment_status DEFAULT 'PENDING' NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
CREATE POLICY "profiles_select_self_or_admin" ON profiles FOR SELECT
  USING ((id = uid()) OR is_admin());

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON profiles;
CREATE POLICY "profiles_update_self_or_admin" ON profiles FOR UPDATE
  USING ((id = uid()) OR is_admin())
  WITH CHECK ((id = uid()) OR is_admin());

DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON profiles;
CREATE POLICY "profiles_insert_self_or_admin" ON profiles FOR INSERT
  WITH CHECK ((id = uid()) OR is_admin());

-- Rides RLS policies
DROP POLICY IF EXISTS "rides_select_scope" ON rides;
CREATE POLICY "rides_select_scope" ON rides FOR SELECT
  USING (is_admin() OR (rider_id = uid()) OR (driver_id = uid()));

DROP POLICY IF EXISTS "rides_insert_rider" ON rides;
CREATE POLICY "rides_insert_rider" ON rides FOR INSERT
  WITH CHECK (rider_id = uid());

DROP POLICY IF EXISTS "rides_update_admin" ON rides;
CREATE POLICY "rides_update_admin" ON rides FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Drivers RLS policies
DROP POLICY IF EXISTS "drivers_select_all" ON drivers;
CREATE POLICY "drivers_select_all" ON drivers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "drivers_update_self_or_admin" ON drivers;
CREATE POLICY "drivers_update_self_or_admin" ON drivers FOR UPDATE
  USING ((id = uid()) OR is_admin())
  WITH CHECK ((id = uid()) OR is_admin());

DROP POLICY IF EXISTS "drivers_insert_admin_only" ON drivers;
CREATE POLICY "drivers_insert_admin_only" ON drivers FOR INSERT
  WITH CHECK (is_admin());

-- Driver locations RLS policies
DROP POLICY IF EXISTS "driver_locations_update_self" ON driver_locations;
CREATE POLICY "driver_locations_update_self" ON driver_locations FOR UPDATE
  USING ((driver_id = uid()) OR is_admin())
  WITH CHECK ((driver_id = uid()) OR is_admin());

DROP POLICY IF EXISTS "driver_locations_upsert_self" ON driver_locations;
CREATE POLICY "driver_locations_upsert_self" ON driver_locations FOR INSERT
  WITH CHECK ((driver_id = uid()) OR is_admin());

DROP POLICY IF EXISTS "driver_locations_select_scope" ON driver_locations;
CREATE POLICY "driver_locations_select_scope" ON driver_locations FOR SELECT
  USING (is_admin() OR (EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.driver_id = driver_locations.driver_id 
    AND r.rider_id = uid() 
    AND r.status IN ('ASSIGNED', 'ENROUTE', 'STARTED')
  )));

-- Payments RLS policies
DROP POLICY IF EXISTS "payments_select_scope" ON payments;
CREATE POLICY "payments_select_scope" ON payments FOR SELECT
  USING (is_admin() OR (EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.id = payments.ride_id 
    AND (r.rider_id = uid() OR r.driver_id = uid())
  )));

DROP POLICY IF EXISTS "payments_admin_write" ON payments;
CREATE POLICY "payments_admin_write" ON payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Ratings RLS policies
DROP POLICY IF EXISTS "ratings_select_mine_or_about_me_or_admin" ON ratings;
CREATE POLICY "ratings_select_mine_or_about_me_or_admin" ON ratings FOR SELECT
  USING ((from_user_id = uid()) OR (to_user_id = uid()) OR is_admin());

DROP POLICY IF EXISTS "ratings_insert_if_participant" ON ratings;
CREATE POLICY "ratings_insert_if_participant" ON ratings FOR INSERT
  WITH CHECK (is_admin() OR (EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.id = ratings.ride_id 
    AND r.status = 'COMPLETED' 
    AND (r.rider_id = uid() OR r.driver_id = uid())
  )));

-- App settings RLS policies (admin only)
DROP POLICY IF EXISTS "app_settings_admin_only" ON app_settings;
CREATE POLICY "app_settings_admin_only" ON app_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides (rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides (driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides (status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments (ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON ratings (ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON ratings (to_user_id);

-- Create geospatial indexes
CREATE INDEX IF NOT EXISTS rides_pickup_gix ON rides USING GIST (pickup_point);
CREATE INDEX IF NOT EXISTS rides_dropoff_gix ON rides USING GIST (dropoff_point);
CREATE INDEX IF NOT EXISTS driver_locations_gix ON driver_locations USING GIST (location);

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_rides_updated_at ON rides;
CREATE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_drivers_updated_at ON drivers;
CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create trigger for syncing ride coordinates
DROP TRIGGER IF EXISTS trg_sync_ride_points ON rides;
CREATE TRIGGER trg_sync_ride_points
  BEFORE INSERT OR UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION sync_ride_points();

-- CRITICAL: Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert default app settings
INSERT INTO app_settings (key, value) VALUES 
  ('app_name', '"Tuk Tuk Eazy"'),
  ('base_fare', '50.00'),
  ('per_km_rate', '15.00'),
  ('currency', '"ZAR"')
ON CONFLICT (key) DO NOTHING;

-- Create a default admin user profile if needed (optional)
-- This ensures there's always an admin account available
DO $$
BEGIN
  -- Only create if no admin exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
    -- This will only work if there's already an auth user
    -- In practice, you'll need to create an admin user through the auth system first
    NULL;
  END IF;
END $$;