/*
  # Complete Database Schema Setup for Tuk Tuk Eazy

  This migration creates all required tables, types, functions, and policies
  needed for the Tuk Tuk Eazy passenger application to function properly.
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing types if they exist to recreate them properly
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.ride_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.account_type CASCADE;

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('rider', 'driver', 'admin');
CREATE TYPE public.ride_status AS ENUM (
  'REQUESTED',
  'ASSIGNED', 
  'ENROUTE',
  'STARTED',
  'COMPLETED',
  'CANCELLED'
);
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE public.account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- Helper functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_ride_points()
RETURNS TRIGGER AS $$
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.uid()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'rider'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'rider',
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_type TEXT,
  vehicle_plate TEXT UNIQUE,
  license_number TEXT,
  name TEXT,
  phone TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  total_rides INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  pickup_point GEOGRAPHY(POINT, 4326),
  dropoff_point GEOGRAPHY(POINT, 4326),
  status public.ride_status NOT NULL DEFAULT 'REQUESTED',
  estimated_fare NUMERIC(10, 2),
  final_fare NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ride_id)
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS drivers_set_updated_at ON public.drivers;
CREATE TRIGGER drivers_set_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS rides_set_updated_at ON public.rides;
CREATE TRIGGER rides_set_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS rides_sync_points ON public.rides;
CREATE TRIGGER rides_sync_points
  BEFORE INSERT OR UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.sync_ride_points();

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS driver_locations_set_updated_at ON public.driver_locations;
CREATE TRIGGER driver_locations_set_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON public.profiles;
DROP POLICY IF EXISTS "Riders can create rides" ON public.rides;
DROP POLICY IF EXISTS "Participants can view rides" ON public.rides;
DROP POLICY IF EXISTS "Participants can update rides" ON public.rides;
DROP POLICY IF EXISTS "Drivers manage own location" ON public.driver_locations;
DROP POLICY IF EXISTS "Riders can view assigned driver location" ON public.driver_locations;
DROP POLICY IF EXISTS "Ride participants can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users view related ratings" ON public.ratings;
DROP POLICY IF EXISTS "Authors can create ratings" ON public.ratings;

-- Create RLS policies
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles can be inserted by owner"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles can be updated by owner"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Riders can create rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Participants can view rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE POLICY "Participants can update rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = rider_id OR auth.uid() = driver_id)
  WITH CHECK (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE POLICY "Drivers manage own location"
  ON public.driver_locations FOR ALL
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Riders can view assigned driver location"
  ON public.driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.driver_id = driver_locations.driver_id
        AND r.rider_id = auth.uid()
    )
  );

CREATE POLICY "Ride participants can view payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = payments.ride_id
        AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users view related ratings"
  ON public.ratings FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Authors can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON public.rides (rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides (driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides (status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON public.rides (created_at DESC);
CREATE INDEX IF NOT EXISTS rides_pickup_point_gix ON public.rides USING GIST (pickup_point);
CREATE INDEX IF NOT EXISTS rides_dropoff_point_gix ON public.rides USING GIST (dropoff_point);
CREATE INDEX IF NOT EXISTS driver_locations_location_gix ON public.driver_locations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON public.payments (ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON public.ratings (ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON public.ratings (to_user_id);