import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'rider' | 'driver';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: 'rider' | 'driver';
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
        };
      };
      rides: {
        Row: {
          id: string;
          rider_id: string;
          driver_id: string | null;
          pickup_addr: string;
          dropoff_addr: string;
          pickup_point: string;
          dropoff_point: string;
          status: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
          estimated_fare: number;
          actual_fare: number | null;
          distance_km: number | null;
          duration_minutes: number | null;
          requested_at: string;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          rider_id: string;
          pickup_addr: string;
          dropoff_addr: string;
          pickup_point: string;
          dropoff_point: string;
          estimated_fare: number;
          distance_km?: number | null;
        };
        Update: {
          status?: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
          actual_fare?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
        };
      };
      driver_locations: {
        Row: {
          id: string;
          driver_id: string;
          location: string;
          heading: number | null;
          speed_kmh: number | null;
          accuracy_meters: number | null;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          ride_id: string;
          rider_id: string;
          amount: number;
          currency: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          status: 'pending' | 'paid' | 'failed' | 'cancelled';
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          ride_id: string;
          rider_id: string;
          amount: number;
          stripe_session_id?: string | null;
          status?: 'pending' | 'paid' | 'failed' | 'cancelled';
        };
      };
      ratings: {
        Row: {
          id: string;
          ride_id: string;
          rider_id: string;
          driver_id: string;
          score: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          ride_id: string;
          rider_id: string;
          driver_id: string;
          score: number;
          note?: string | null;
        };
      };
    };
  };
};