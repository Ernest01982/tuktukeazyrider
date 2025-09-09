import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useGoogleMaps, usePlacesAutocomplete } from '../hooks/useGoogleMaps';
import { calculateDistance, calculateFare, formatCurrency } from '../lib/utils';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

export const RequestRide: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fare, setFare] = useState<number | null>(null);

  const pickupRef = useRef<HTMLInputElement>(null);
  const dropoffRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded, loadError, map, geocoder } = useGoogleMaps('map', {
    center: { lat: -6.2088, lng: 106.8456 },
    zoom: 13,
  });
  
  const { place: pickupPlace } = usePlacesAutocomplete(pickupRef);
  const { place: dropoffPlace } = usePlacesAutocomplete(dropoffRef);

  // Calculate fare when both places are selected
  useEffect(() => {
    if (pickupPlace?.geometry?.location && dropoffPlace?.geometry?.location) {
      const pickupLat = pickupPlace.geometry.location.lat();
      const pickupLng = pickupPlace.geometry.location.lng();
      const dropoffLat = dropoffPlace.geometry.location.lat();
      const dropoffLng = dropoffPlace.geometry.location.lng();
      
      const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      const estimatedFare = calculateFare(distance);
      setFare(estimatedFare);

      // Update map bounds to show both locations
      if (map) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(pickupPlace.geometry.location);
        bounds.extend(dropoffPlace.geometry.location);
        map.fitBounds(bounds);
        
        // Add markers
        new google.maps.Marker({
          position: pickupPlace.geometry.location,
          map: map,
          title: 'Pickup Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2EC4B6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
        
        new google.maps.Marker({
          position: dropoffPlace.geometry.location,
          map: map,
          title: 'Drop-off Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#FF6B6B',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }
    } else {
      setFare(null);
    }
  }, [pickupPlace, dropoffPlace, map]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !pickupPlace || !dropoffPlace || !geocoder) {
      toast.error('Please select both pickup and drop-off locations');
      return;
    }

    setIsSubmitting(true);

    try {
      const pickupAddr = pickupPlace.formatted_address || pickupPlace.name || '';
      const dropoffAddr = dropoffPlace.formatted_address || dropoffPlace.name || '';
      
      const pickupLat = pickupPlace.geometry?.location?.lat();
      const pickupLng = pickupPlace.geometry?.location?.lng();
      const dropoffLat = dropoffPlace.geometry?.location?.lat();
      const dropoffLng = dropoffPlace.geometry?.location?.lng();

      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        toast.error('Unable to get location coordinates');
        return;
      }

      const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      const estimatedFare = calculateFare(distance);

      // Insert ride request
      const { data, error } = await supabase
        .from('rides')
        .insert({
          rider_id: user.id,
          pickup_addr: pickupAddr,
          dropoff_addr: dropoffAddr,
          pickup_point: `POINT(${pickupLng} ${pickupLat})`,
          dropoff_point: `POINT(${dropoffLng} ${dropoffLat})`,
          estimated_fare: estimatedFare,
          distance_km: distance,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ride:', error);
        toast.error('Failed to request ride');
        return;
      }

      toast.success('Ride requested successfully!');
      navigate(`/ride/${data.id}`);
    } catch (error) {
      console.error('Error requesting ride:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">Map Error</h2>
          <p className="text-gray-600">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-text text-center">
          Request a Ride
        </h1>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div id="map" className="w-full h-full min-h-[300px] bg-gray-200">
          {!isLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Navigation className="w-8 h-8 text-gray-400 mx-auto animate-spin mb-2" />
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Form */}
      <div className="bg-white shadow-lg rounded-t-3xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={pickupRef}
            placeholder="Pickup location"
            icon={<MapPin className="w-5 h-5 text-primary" />}
            fullWidth
          />
          
          <Input
            ref={dropoffRef}
            placeholder="Where to?"
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            fullWidth
          />

          {fare && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated Fare</span>
                <span className="text-xl font-bold text-text">
                  {formatCurrency(fare)}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={!pickupPlace || !dropoffPlace}
            className="shadow-lg"
          >
            <span>Request Tuk Tuk</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
};