-- Core database schema for the Tuk Tuk Eazy passenger application
-- Run this script in the Supabase SQL editor to provision the required tables,
-- enums, policies, and helper functions used by the frontend.

-- Required extensions --------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- Enumerated types ----------------------------------------------------------
do $$
begin
  create type public.user_role as enum ('rider', 'driver', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.ride_status as enum (
    'REQUESTED',
    'ASSIGNED',
    'ENROUTE',
    'STARTED',
    'COMPLETED',
    'CANCELLED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum ('PENDING', 'SUCCEEDED', 'FAILED');
exception
  when duplicate_object then null;
end
$$;

-- Helper functions ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.sync_ride_points()
returns trigger as $$
begin
  if new.pickup_lat is not null and new.pickup_lng is not null then
    new.pickup_point := ST_SetSRID(ST_MakePoint(new.pickup_lng, new.pickup_lat), 4326);
  end if;

  if new.dropoff_lat is not null and new.dropoff_lng is not null then
    new.dropoff_point := ST_SetSRID(ST_MakePoint(new.dropoff_lng, new.dropoff_lat), 4326);
  end if;

  return new;
end;
$$ language plpgsql;

-- Tables --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'rider',
  full_name text,
  email text unique,
  phone text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key references public.profiles(id) on delete cascade,
  vehicle_make text,
  vehicle_model text,
  vehicle_type text,
  vehicle_plate text unique,
  license_number text,
  name text,
  phone text,
  is_verified boolean not null default false,
  online boolean not null default false,
  rating numeric not null default 5.0,
  total_rides integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  pickup_address text,
  dropoff_address text,
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  pickup_point geography(point, 4326),
  dropoff_point geography(point, 4326),
  status public.ride_status not null default 'REQUESTED',
  estimated_fare numeric(10, 2),
  final_fare numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_locations (
  driver_id uuid primary key references public.profiles(id) on delete cascade,
  location geography(point, 4326),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  status public.payment_status not null default 'PENDING',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ride_id)
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

-- Triggers ------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'profiles_set_updated_at'
  ) then
    create trigger profiles_set_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'drivers_set_updated_at'
  ) then
    create trigger drivers_set_updated_at
      before update on public.drivers
      for each row execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'rides_set_updated_at'
  ) then
    create trigger rides_set_updated_at
      before update on public.rides
      for each row execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'rides_sync_points'
  ) then
    create trigger rides_sync_points
      before insert or update on public.rides
      for each row execute function public.sync_ride_points();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'payments_set_updated_at'
  ) then
    create trigger payments_set_updated_at
      before update on public.payments
      for each row execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'driver_locations_set_updated_at'
  ) then
    create trigger driver_locations_set_updated_at
      before update on public.driver_locations
      for each row execute function public.set_updated_at();
  end if;
end
$$;

-- Row Level Security --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.driver_locations enable row level security;
alter table public.payments enable row level security;
alter table public.ratings enable row level security;

-- Profiles policies
DO $$
BEGIN
  CREATE POLICY "Profiles are viewable by owner"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Profiles can be inserted by owner"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Profiles can be updated by owner"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Rides policies
DO $$
BEGIN
  CREATE POLICY "Riders can create rides"
    ON public.rides
    FOR INSERT
    WITH CHECK (auth.uid() = rider_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Participants can view rides"
    ON public.rides
    FOR SELECT
    USING (auth.uid() = rider_id OR auth.uid() = driver_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Participants can update rides"
    ON public.rides
    FOR UPDATE
    USING (auth.uid() = rider_id OR auth.uid() = driver_id)
    WITH CHECK (auth.uid() = rider_id OR auth.uid() = driver_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Driver locations policies
DO $$
BEGIN
  CREATE POLICY "Drivers manage own location"
    ON public.driver_locations
    FOR ALL
    USING (auth.uid() = driver_id)
    WITH CHECK (auth.uid() = driver_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Riders can view assigned driver location"
    ON public.driver_locations
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.rides r
        WHERE r.driver_id = driver_locations.driver_id
          AND r.rider_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Payments policies
DO $$
BEGIN
  CREATE POLICY "Ride participants can view payments"
    ON public.payments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.rides r
        WHERE r.id = payments.ride_id
          AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Ratings policies
DO $$
BEGIN
  CREATE POLICY "Users view related ratings"
    ON public.ratings
    FOR SELECT
    USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Authors can create ratings"
    ON public.ratings
    FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Indexes -------------------------------------------------------------------
create index if not exists idx_rides_rider_id on public.rides (rider_id);
create index if not exists idx_rides_driver_id on public.rides (driver_id);
create index if not exists idx_rides_status on public.rides (status);
create index if not exists idx_rides_created_at on public.rides (created_at desc);
create index if not exists rides_pickup_point_gix on public.rides using gist (pickup_point);
create index if not exists rides_dropoff_point_gix on public.rides using gist (dropoff_point);
create index if not exists driver_locations_location_gix on public.driver_locations using gist (location);
create index if not exists idx_payments_ride_id on public.payments (ride_id);
create index if not exists idx_ratings_ride_id on public.ratings (ride_id);
create index if not exists idx_ratings_to_user on public.ratings (to_user_id);
