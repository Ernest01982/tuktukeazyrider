import { supabase } from './supabase';
import { AppError, handleError, logError } from './errors';
import { APP_CONFIG } from './constants';

// Generic API response type
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: AppError | null;
  loading: boolean;
}

// Retry utility for failed requests
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = APP_CONFIG.api.retryAttempts,
  delay: number = APP_CONFIG.api.retryDelay
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
};

// Enhanced Supabase client with error handling
export class ApiClient {
  private static instance: ApiClient;

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Rides API
  async createRide(rideData: {
    rider_id: string;
    pickup_address: string;
    dropoff_address: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    estimated_fare: number;
  }): Promise<ApiResponse> {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('rides')
          .insert({
            rider_id: rideData.rider_id,
            pickup_address: rideData.pickup_address,
            dropoff_address: rideData.dropoff_address,
            pickup_lat: rideData.pickup_lat,
            pickup_lng: rideData.pickup_lng,
            dropoff_lat: rideData.dropoff_lat,
            dropoff_lng: rideData.dropoff_lng,
            estimated_fare: rideData.estimated_fare,
          })
          .select()
          .single();
      });

      if (error) {
        const appError = handleError(error);
        logError(appError, { context: 'createRide', rideData });
        return { data: null, error: appError, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, { context: 'createRide', rideData });
      return { data: null, error: appError, loading: false };
    }
  }

  async getRide(rideId: string, userId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('rides')
          .select(`
            *,
            driver:profiles!rides_driver_id_fkey(id, display_name, phone)
          `)
          .eq('id', rideId)
          .eq('rider_id', userId)
          .single();
      });

      if (error) {
        const appError = handleError(error);
        logError(appError, { context: 'getRide', rideId, userId });
        return { data: null, error: appError, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, { context: 'getRide', rideId, userId });
      return { data: null, error: appError, loading: false };
    }
  }

  async cancelRide(rideId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('rides')
          .update({ 
            status: 'CANCELLED',
          })
          .eq('id', rideId)
          .eq('status', 'REQUESTED') // Only allow cancelling requested rides
          .select()
          .single();
      });

      if (error) {
        const appError = handleError(error);
        logError(appError, { context: 'cancelRide', rideId });
        return { data: null, error: appError, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, { context: 'cancelRide', rideId });
      return { data: null, error: appError, loading: false };
    }
  }

  async getRideHistory(userId: string, limit: number = 20): Promise<ApiResponse> {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('rides')
          .select(`
            id,
            pickup_address,
            dropoff_address,
            status,
            estimated_fare,
            final_fare,
            created_at,
            updated_at,
            driver_id,
            driver:profiles!rides_driver_id_fkey(display_name),
            ratings:ratings!ratings_ride_id_fkey(score, note)
          `)
          .eq('rider_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
      });

      if (error) {
        const appError = handleError(error);
        logError(appError, { context: 'getRideHistory', userId });
        return { data: null, error: appError, loading: false };
      }

      return { data: data || [], error: null, loading: false };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, { context: 'getRideHistory', userId });
      return { data: null, error: appError, loading: false };
    }
  }

  // Ratings API
  async submitRating(ratingData: {
    ride_id: string;
    from_user_id: string;
    to_user_id: string;
    score: number;
    note?: string;
  }): Promise<ApiResponse> {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('ratings')
          .insert(ratingData)
          .select()
          .single();
      });

      if (error) {
        const appError = handleError(error);
        logError(appError, { context: 'submitRating', ratingData });
        return { data: null, error: appError, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, { context: 'submitRating', ratingData });
      return { data: null, error: appError, loading: false };
    }
  }

  // Payments API
  async getPaymentStatus(rideId: string): Promise<ApiResponse> {
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('payments')
          .select('*')
          .eq('ride_id', rideId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
      });

      if (error && error.code !== 'PGRST116') { // Not found is OK
        const appError = handleError(error);
        logError(appError, { context: 'getPaymentStatus', rideId });
        return { data: null, error: appError, loading: false };
      }

      return { data: data || null, error: null, loading: false };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, { context: 'getPaymentStatus', rideId });
      return { data: null, error: appError, loading: false };
    }
  }
}