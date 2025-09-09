import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, X, CreditCard, Star, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { formatCurrency, maskPhone, formatRelativeTime } from '../lib/utils';
import { Button } from '../components/Button';
import { StatusChip } from '../components/StatusChip';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup_addr: string;
  dropoff_addr: string;
  pickup_point: any;
  dropoff_point: any;
  status: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  estimated_fare: number;
  actual_fare: number | null;
  requested_at: string;
  driver?: {
    full_name: string;
    phone: string;
  };
}

interface DriverLocation {
  driver_id: string;
  location: any;
  updated_at: string;
}

interface Payment {
  id: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  stripe_session_id: string | null;
}

export const RideTracking: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingNote, setRatingNote] = useState('');

  const { isLoaded, map } = useGoogleMaps('ride-map', {
    center: { lat: -6.2088, lng: 106.8456 },
    zoom: 15,
  });

  // Fetch initial ride data
  useEffect(() => {
    if (!rideId || !user) return;

    const fetchRide = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey(full_name, phone)
        `)
        .eq('id', rideId)
        .eq('rider_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching ride:', error);
        toast.error('Ride not found');
        navigate('/request');
        return;
      }

      setRide(data);
      setLoading(false);
    };

    fetchRide();
  }, [rideId, user, navigate]);

  // Subscribe to ride updates
  useEffect(() => {
    if (!rideId) return;

    const subscription = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        async (payload) => {
          const updatedRide = payload.new as Ride;
          
          // Fetch driver details if assigned
          if (updatedRide.driver_id && !updatedRide.driver) {
            const { data: driver } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', updatedRide.driver_id)
              .single();
            
            if (driver) {
              updatedRide.driver = driver;
            }
          }
          
          setRide(updatedRide);
          
          // Show rating modal for completed rides
          if (updatedRide.status === 'COMPLETED') {
            toast.success('Ride completed!');
            setTimeout(() => setShowRatingModal(true), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [rideId]);

  // Subscribe to driver location updates
  useEffect(() => {
    if (!ride?.driver_id) return;

    const subscription = supabase
      .channel(`driver-location-${ride.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${ride.driver_id}`,
        },
        (payload) => {
          setDriverLocation(payload.new as DriverLocation);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ride?.driver_id]);

  // Fetch payment status
  useEffect(() => {
    if (!rideId) return;

    const fetchPayment = async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPayment(data);
      }
    };

    fetchPayment();

    // Subscribe to payment updates
    const subscription = supabase
      .channel(`payment-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          setPayment(payload.new as Payment);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [rideId]);

  // Update map when locations change
  useEffect(() => {
    if (!map || !ride || !isLoaded) return;

    const bounds = new google.maps.LatLngBounds();
    
    // Parse pickup and dropoff points (PostGIS format)
    const pickupMatch = ride.pickup_point.match(/POINT\(([^ ]+) ([^ )]+)\)/);
    const dropoffMatch = ride.dropoff_point.match(/POINT\(([^ ]+) ([^ )]+)\)/);
    
    if (pickupMatch && dropoffMatch) {
      const pickupLng = parseFloat(pickupMatch[1]);
      const pickupLat = parseFloat(pickupMatch[2]);
      const dropoffLng = parseFloat(dropoffMatch[1]);
      const dropoffLat = parseFloat(dropoffMatch[2]);
      
      const pickup = new google.maps.LatLng(pickupLat, pickupLng);
      const dropoff = new google.maps.LatLng(dropoffLat, dropoffLng);
      
      bounds.extend(pickup);
      bounds.extend(dropoff);

      // Clear existing markers
      map.data.forEach((feature) => {
        map.data.remove(feature);
      });

      // Add pickup marker
      new google.maps.Marker({
        position: pickup,
        map: map,
        title: 'Pickup',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2EC4B6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add dropoff marker
      new google.maps.Marker({
        position: dropoff,
        map: map,
        title: 'Drop-off',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF6B6B',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Add driver marker if available
      if (driverLocation) {
        const driverMatch = driverLocation.location.match(/POINT\(([^ ]+) ([^ )]+)\)/);
        if (driverMatch) {
          const driverLng = parseFloat(driverMatch[1]);
          const driverLat = parseFloat(driverMatch[2]);
          const driverPos = new google.maps.LatLng(driverLat, driverLng);
          
          bounds.extend(driverPos);
          
          new google.maps.Marker({
            position: driverPos,
            map: map,
            title: 'Driver',
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#F2C94C',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
        }
      }

      map.fitBounds(bounds);
    }
  }, [map, ride, driverLocation, isLoaded]);

  const handleCancelRide = async () => {
    if (!ride || ride.status !== 'REQUESTED') return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('rides')
        .update({ 
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', ride.id);

      if (error) {
        toast.error('Failed to cancel ride');
      } else {
        toast.success('Ride cancelled');
        navigate('/request');
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('An error occurred');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async () => {
    if (!ride) return;

    try {
      const { data } = await supabase.functions.invoke('stripe/create-checkout-session', {
        body: {
          ride_id: ride.id,
          amount: ride.estimated_fare,
        },
      });

      if (data.sessionId) {
        const stripe = (await import('@stripe/stripe-js')).loadStripe(
          import.meta.env.VITE_STRIPE_PUBLIC_KEY
        );
        
        if (await stripe) {
          const stripeInstance = await stripe;
          await stripeInstance?.redirectToCheckout({
            sessionId: data.sessionId,
          });
        }
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      toast.error('Failed to initiate payment');
    }
  };

  const submitRating = async () => {
    if (!ride || !user || !ride.driver_id) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: ride.id,
          rider_id: user.id,
          driver_id: ride.driver_id,
          score: rating,
          note: ratingNote.trim() || null,
        });

      if (error) {
        toast.error('Failed to submit rating');
      } else {
        toast.success('Thank you for your feedback!');
        setShowRatingModal(false);
        navigate('/history');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">Ride Not Found</h2>
          <Button onClick={() => navigate('/request')}>
            Request New Ride
          </Button>
        </div>
      </div>
    );
  }

  const showPaymentButton = ['ASSIGNED', 'STARTED'].includes(ride.status) && 
                           (!payment || payment.status !== 'paid');

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/request')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
        
        <div className="text-center">
          <StatusChip status={ride.status} />
          <p className="text-xs text-gray-500 mt-1">
            {formatRelativeTime(ride.requested_at)}
          </p>
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div id="ride-map" className="w-full h-full min-h-[300px] bg-gray-200">
          {!isLoaded && (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Card */}
      <div className="bg-white shadow-lg rounded-t-3xl p-6 space-y-4">
        {/* Route Info */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">From</p>
              <p className="text-text font-medium">{ride.pickup_addr}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">To</p>
              <p className="text-text font-medium">{ride.dropoff_addr}</p>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        {ride.driver && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-text">{ride.driver.full_name}</p>
                <p className="text-sm text-gray-600">Your Driver</p>
              </div>
              <button 
                className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors"
                onClick={() => window.open(`tel:${ride.driver?.phone}`)}
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Fare Info */}
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Estimated Fare</span>
          <span className="text-xl font-bold text-text">
            {formatCurrency(ride.estimated_fare)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {showPaymentButton && (
            <Button
              fullWidth
              size="lg"
              onClick={handlePayment}
              className="shadow-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Now
            </Button>
          )}

          {ride.status === 'REQUESTED' && (
            <Button
              variant="secondary"
              fullWidth
              loading={cancelling}
              onClick={handleCancelRide}
            >
              Cancel Ride
            </Button>
          )}

          {ride.status === 'COMPLETED' && (
            <Button
              variant="accent"
              fullWidth
              onClick={() => setShowRatingModal(true)}
            >
              <Star className="w-5 h-5 mr-2" />
              Rate Driver
            </Button>
          )}
        </div>

        {payment?.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium">
              ✅ Payment completed
            </p>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-text mb-2">
                Rate Your Experience
              </h3>
              <p className="text-gray-600">
                How was your ride with {ride.driver?.full_name}?
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating 
                        ? 'fill-accent text-accent' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Note */}
            <textarea
              placeholder="Add a note (optional)"
              value={ratingNote}
              onChange={(e) => setRatingNote(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none mb-6"
              rows={3}
            />

            {/* Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowRatingModal(false)}
              >
                Skip
              </Button>
              <Button
                fullWidth
                onClick={submitRating}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};