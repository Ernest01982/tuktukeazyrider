import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';
import { ApiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { useGoogleMaps, usePlacesAutocomplete } from '../hooks/useGoogleMaps';
import { calculateDistance, calculateFare, formatCurrency } from '../lib/utils';
import { validateCoordinates, validateRideDistance } from '../lib/validation';
import { PerformanceMonitor } from '../lib/performance';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, APP_CONFIG } from '../lib/constants';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

export const RequestRide: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const pickupRef = useRef<HTMLInputElement>(null);
  const dropoffRef = useRef<HTMLInputElement>(null);
  
  const { isLoaded, loadError, map } = useGoogleMaps('map', {
    center: APP_CONFIG.map.defaultCenter,
    zoom: APP_CONFIG.map.defaultZoom,
  });
  
  const { place: pickupPlace } = usePlacesAutocomplete(pickupRef);
  const { place: dropoffPlace } = usePlacesAutocomplete(dropoffRef);
  
  // Debounce place changes to avoid excessive calculations
  const debouncedPickupPlace = useDebounce(pickupPlace, APP_CONFIG.ui.debounceDelay);
  const debouncedDropoffPlace = useDebounce(dropoffPlace, APP_CONFIG.ui.debounceDelay);

  // Calculate fare when both places are selected
  useEffect(() => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const endTiming = performanceMonitor.startTiming('fare_calculation');
    
    if (debouncedPickupPlace?.geometry?.location && debouncedDropoffPlace?.geometry?.location) {
      try {
        const pickupLat = debouncedPickupPlace.geometry.location.lat();
        const pickupLng = debouncedPickupPlace.geometry.location.lng();
        const dropoffLat = debouncedDropoffPlace.geometry.location.lat();
        const dropoffLng = debouncedDropoffPlace.geometry.location.lng();
        
        // Validate coordinates
        validateCoordinates(pickupLat, pickupLng);
        validateCoordinates(dropoffLat, dropoffLng);
      
        const calculatedDistance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
        
        // Validate distance
        validateRideDistance(calculatedDistance);
        
        const estimatedFare = calculateFare(calculatedDistance);
        setDistance(calculatedDistance);
        setFare(estimatedFare);
        setValidationError(null);

        // Update map bounds to show both locations
        if (map) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(debouncedPickupPlace.geometry.location);
          bounds.extend(debouncedDropoffPlace.geometry.location);
          map.fitBounds(bounds);
        
          // Clear existing markers
          // Note: In production, you'd want to manage markers more efficiently
          
          // Add pickup marker
          new google.maps.Marker({
            position: debouncedPickupPlace.geometry.location,
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
        
          // Add dropoff marker
          new google.maps.Marker({
            position: debouncedDropoffPlace.geometry.location,
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
      } catch (error) {
        setValidationError(error instanceof Error ? error.message : 'Invalid locations selected');
        setFare(null);
        setDistance(null);
      }
    } else {
      setFare(null);
      setDistance(null);
      setValidationError(null);
    }
    
    endTiming();
  }, [debouncedPickupPlace, debouncedDropoffPlace, map]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !debouncedPickupPlace || !debouncedDropoffPlace) {
      toast.error(ERROR_MESSAGES.ride.locationRequired);
      return;
    }
    
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    const performanceMonitor = PerformanceMonitor.getInstance();
    const endTiming = performanceMonitor.startTiming('ride_creation');

    try {
      const pickupAddr = debouncedPickupPlace.formatted_address || debouncedPickupPlace.name || '';
      const dropoffAddr = debouncedDropoffPlace.formatted_address || debouncedDropoffPlace.name || '';
      
      const pickupLat = debouncedPickupPlace.geometry?.location?.lat();
      const pickupLng = debouncedPickupPlace.geometry?.location?.lng();
      const dropoffLat = debouncedDropoffPlace.geometry?.location?.lat();
      const dropoffLng = debouncedDropoffPlace.geometry?.location?.lng();

      if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        toast.error(ERROR_MESSAGES.map.geocodingFailed);
        return;
      }

      const apiClient = ApiClient.getInstance();
      const { data, error } = await apiClient.createRide({
        rider_id: user.id,
        pickup_addr: pickupAddr,
        dropoff_addr: dropoffAddr,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        estimated_fare: fare || 0,
      });

      if (error || !data) {
        toast.error(error?.message || ERROR_MESSAGES.general.serverError);
        return;
      }

      toast.success(SUCCESS_MESSAGES.ride.requested);
      navigate(`/ride/${data.id}`);
    } catch (error) {
      console.error('Error requesting ride:', error);
      toast.error(ERROR_MESSAGES.general.unknownError);
    } finally {
      setIsSubmitting(false);
      endTiming();
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">Map Error</h2>
          <p className="text-gray-600">{ERROR_MESSAGES.map.loadFailed}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
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
            error={validationError && debouncedPickupPlace ? validationError : undefined}
          />
          
          <Input
            ref={dropoffRef}
            placeholder="Where to?"
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            fullWidth
            error={validationError && debouncedDropoffPlace ? validationError : undefined}
          />

          {fare && distance && !validationError && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Estimated Fare</span>
                <span className="text-xl font-bold text-text">
                  {formatCurrency(fare)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Distance</span>
                <span>{distance.toFixed(1)} km</span>
              </div>
            </div>
          )}
          
          {validationError && (
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
              <p className="text-secondary text-sm font-medium">
                {validationError}
              </p>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={!debouncedPickupPlace || !debouncedDropoffPlace || !!validationError}
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