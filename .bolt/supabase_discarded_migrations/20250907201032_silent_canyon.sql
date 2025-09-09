/*
  # Tuk Tuk Eazy Database Schema

  1. New Tables
    - `profiles` - User profiles with roles (rider, driver)
    - `rides` - Ride requests and tracking
    - `driver_locations` - Real-time driver positions
    - `payments` - Payment records
    - `ratings` - Ride ratings and reviews

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Restrict access based on user roles

  3. Realtime
    - Enable realtime on rides and driver_locations tables
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL CHECK (role IN ('rider', 'driver')) DEFAULT 'rider',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  pickup_addr text NOT NULL,
  dropoff_addr text NOT NULL,
  pickup_point geography(POINT) NOT NULL,
  dropoff_point geography(POINT) NOT NULL,
  status text NOT NULL CHECK (status IN ('REQUESTED', 'ASSIGNED', 'ENROUTE', 'STARTED', 'COMPLETED', 'CANCELLED')) DEFAULT 'REQUESTED',
  estimated_fare decimal(10,2) NOT NULL,
  actual_fare decimal(10,2),
  distance_km decimal(8,2),
  duration_minutes integer,
  requested_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

-- Create driver_locations table for real-time tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location geography(POINT) NOT NULL,
  heading decimal(5,2), -- Direction in degrees
  speed_kmh decimal(5,2), -- Speed in km/h
  accuracy_meters decimal(8,2),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(driver_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ride_id, rider_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Rides policies
CREATE POLICY "Riders can read own rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (rider_id = auth.uid());

CREATE POLICY "Drivers can read assigned rides"
  ON rides
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Riders can insert own rides"
  ON rides
  FOR INSERT
  TO authenticated
  WITH CHECK (rider_id = auth.uid());

CREATE POLICY "Riders can update own rides"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (rider_id = auth.uid());

-- Driver locations policies
CREATE POLICY "Anyone can read driver locations"
  ON driver_locations
  FOR SELECT
  TO authenticated;

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (rider_id = auth.uid());

CREATE POLICY "Users can insert own payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (rider_id = auth.uid());

-- Ratings policies
CREATE POLICY "Users can read own ratings"
  ON ratings
  FOR SELECT
  TO authenticated
  USING (rider_id = auth.uid() OR driver_id = auth.uid());

CREATE POLICY "Riders can insert own ratings"
  ON ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (rider_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS rides_rider_id_idx ON rides(rider_id);
CREATE INDEX IF NOT EXISTS rides_driver_id_idx ON rides(driver_id);
CREATE INDEX IF NOT EXISTS rides_status_idx ON rides(status);
CREATE INDEX IF NOT EXISTS driver_locations_driver_id_idx ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS payments_ride_id_idx ON payments(ride_id);
CREATE INDEX IF NOT EXISTS ratings_ride_id_idx ON ratings(ride_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();