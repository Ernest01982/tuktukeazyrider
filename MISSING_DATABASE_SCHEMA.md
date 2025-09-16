# Missing Database Schema Analysis
## Tuk Tuk Eazy Passenger App - Required Database Structure

The application is failing because the Supabase database is missing the complete schema. Here's what needs to be created:

---

## 🗄️ **CORE TABLES MISSING:**

### 1. **`profiles` Table** (CRITICAL - Causing current errors)
```sql
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,                    -- ❌ MISSING - causing "full_name column not found"
  email text UNIQUE,
  phone text,
  photo_url text,
  role user_role DEFAULT 'rider' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```
**Purpose:** Stores user profile information extending Supabase auth.users

### 2. **`rides` Table** (CRITICAL)
```sql
CREATE TABLE public.rides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id uuid REFERENCES profiles(id) NOT NULL,
  driver_id uuid REFERENCES profiles(id),
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
```
**Purpose:** Core ride booking and tracking functionality

### 3. **`drivers` Table** (HIGH PRIORITY)
```sql
CREATE TABLE public.drivers (
  id uuid REFERENCES profiles(id) PRIMARY KEY,
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
```
**Purpose:** Driver information and vehicle details

### 4. **`driver_locations` Table** (HIGH PRIORITY)
```sql
CREATE TABLE public.driver_locations (
  driver_id uuid REFERENCES profiles(id) PRIMARY KEY,
  location geography(Point, 4326),
  updated_at timestamptz DEFAULT now() NOT NULL
);
```
**Purpose:** Real-time driver location tracking

### 5. **`payments` Table** (HIGH PRIORITY)
```sql
CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) UNIQUE NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status payment_status DEFAULT 'PENDING' NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```
**Purpose:** Payment processing and tracking

### 6. **`ratings` Table** (MEDIUM PRIORITY)
```sql
CREATE TABLE public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id uuid REFERENCES rides(id) NOT NULL,
  from_user_id uuid REFERENCES profiles(id) NOT NULL,
  to_user_id uuid REFERENCES profiles(id) NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  note text,
  created_at timestamptz DEFAULT now() NOT NULL
);
```
**Purpose:** Driver and rider rating system

---

## 🔧 **REQUIRED CUSTOM TYPES:**

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'rider');

-- Ride status workflow
CREATE TYPE ride_status AS ENUM (
  'REQUESTED',   -- Initial state
  'ASSIGNED',    -- Driver assigned
  'ENROUTE',     -- Driver heading to pickup
  'STARTED',     -- Trip in progress
  'COMPLETED',   -- Trip finished
  'CANCELLED'    -- Trip cancelled
);

-- Payment status
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- Account types for ledger
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
```

---

## 🛡️ **MISSING SECURITY (RLS POLICIES):**

### Critical Security Policies:
```sql
-- Profiles security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Rides security  
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own rides" ON rides FOR SELECT 
  USING (rider_id = auth.uid() OR driver_id = auth.uid());
CREATE POLICY "Riders can create rides" ON rides FOR INSERT 
  WITH CHECK (rider_id = auth.uid());

-- Payments security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own payments" ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rides r 
    WHERE r.id = payments.ride_id 
    AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())
  ));
```

---

## ⚙️ **MISSING HELPER FUNCTIONS:**

```sql
-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync ride coordinates to geography points
CREATE OR REPLACE FUNCTION sync_ride_points()
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
```

---

## 📊 **MISSING INDEXES (Performance):**

```sql
-- Critical indexes for performance
CREATE INDEX idx_rides_rider_id ON rides (rider_id);
CREATE INDEX idx_rides_driver_id ON rides (driver_id);
CREATE INDEX idx_rides_status ON rides (status);
CREATE INDEX idx_rides_created_at ON rides (created_at DESC);

-- Geospatial indexes
CREATE INDEX rides_pickup_gix ON rides USING GIST (pickup_point);
CREATE INDEX rides_dropoff_gix ON rides USING GIST (dropoff_point);
CREATE INDEX driver_locations_gix ON driver_locations USING GIST (location);

-- Payment indexes
CREATE INDEX idx_payments_ride_id ON payments (ride_id);
CREATE INDEX idx_ratings_ride_id ON ratings (ride_id);
```

---

## 🚨 **IMPACT OF MISSING SCHEMA:**

| **Missing Component** | **App Impact** | **Error Messages** |
|----------------------|----------------|-------------------|
| `profiles.full_name` | ❌ Registration fails | "Could not find 'full_name' column" |
| `rides` table | ❌ Cannot book rides | "Table 'rides' doesn't exist" |
| RLS policies | ❌ Security violations | "RLS policy violation" |
| Helper functions | ❌ Auth checks fail | "Function 'is_admin' doesn't exist" |
| Indexes | ⚠️ Slow queries | Performance issues |

---

## ✅ **SOLUTION:**

**Run the complete migration SQL** that I provided earlier. It includes:
- ✅ All 6+ required tables
- ✅ Custom types and enums  
- ✅ Row Level Security policies
- ✅ Helper functions
- ✅ Performance indexes
- ✅ Triggers for automation
- ✅ PostGIS extension for geospatial data

**After migration, the app will have:**
- ✅ Working user registration with `full_name`
- ✅ Complete ride booking functionality
- ✅ Payment processing capability
- ✅ Real-time driver tracking
- ✅ Rating and feedback system
- ✅ Proper security and permissions

The database is essentially **completely empty** right now - that's why the app is failing! 🎯