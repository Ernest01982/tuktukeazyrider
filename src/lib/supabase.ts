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
          role: 'rider' | 'driver' | 'admin';
          display_name: string | null;
          phone: string | null;
          photo_url: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'rider' | 'driver' | 'admin';
          display_name?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          email?: string | null;
        };
        Update: {
          role?: 'rider' | 'driver' | 'admin';
          display_name?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          email?: string | null;
        };
      };
      rides: {
        Row: {
          id: string;
          rider_id: string;
          driver_id: string | null;
          pickup_address: string | null;
          dropoff_address: string | null;
          pickup_point: string | null;
          dropoff_point: string | null;
          pickup_lat: number | null;
          pickup_lng: number | null;
          dropoff_lat: number | null;
          dropoff_lng: number | null;
          status: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
          estimated_fare: number | null;
          final_fare: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          rider_id: string;
          driver_id?: string | null;
          pickup_address?: string | null;
          dropoff_address?: string | null;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          status?: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
          estimated_fare?: number | null;
          final_fare?: number | null;
        };
        Update: {
          driver_id?: string | null;
          pickup_address?: string | null;
          dropoff_address?: string | null;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          status?: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
          estimated_fare?: number | null;
          final_fare?: number | null;
        };
      };
      drivers: {
        Row: {
          id: string;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_type: string | null;
          vehicle_plate: string | null;
          license_number: string | null;
          name: string | null;
          phone: string | null;
          is_verified: boolean;
          online: boolean;
          rating: number;
          total_rides: number;
          created_at: string;
          updated_at: string;
        };
      };
      driver_locations: {
        Row: {
          driver_id: string;
          location: string | null;
          updated_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          ride_id: string;
          amount: number;
          status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ride_id: string;
          amount: number;
          status?: 'PENDING' | 'SUCCEEDED' | 'FAILED';
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          amount?: number;
          status?: 'PENDING' | 'SUCCEEDED' | 'FAILED';
          stripe_payment_intent_id?: string | null;
        };
      };
      ratings: {
        Row: {
          id: string;
          ride_id: string;
          from_user_id: string;
          to_user_id: string;
          score: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          ride_id: string;
          from_user_id: string;
          to_user_id: string;
          score: number;
          note?: string | null;
        };
      };
    };
  };
};