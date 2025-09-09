import { useState, useEffect, useMemo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
  map: google.maps.Map | null;
  geocoder: google.maps.Geocoder | null;
}

interface MapConfig {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  mapId?: string;
}

export const useGoogleMaps = (elementId: string, config: MapConfig = {}): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const defaultConfig = useMemo(
    () => ({
      center: { lat: -6.2088, lng: 106.8456 }, // Jakarta, Indonesia (Tuk Tuk country!)
      zoom: 13,
      ...config,
    }),
    [config]
  );

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setLoadError('Google Maps API key not found');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then(() => {
        const mapElement = document.getElementById(elementId);
        if (!mapElement) {
          setLoadError('Map element not found');
          return;
        }

        const mapInstance = new google.maps.Map(mapElement, {
          center: defaultConfig.center,
          zoom: defaultConfig.zoom,
          styles: APP_CONFIG.map.styles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          scaleControl: true,
          rotateControl: false,
        });

        const geocoderInstance = new google.maps.Geocoder();
        
        setMap(mapInstance);
        setGeocoder(geocoderInstance);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
        setLoadError('Failed to load Google Maps');
      });
  }, [elementId, defaultConfig]);

  return { isLoaded, loadError, map, geocoder };
};

// Hook for Places Autocomplete
export const usePlacesAutocomplete = (
  inputRef: React.RefObject<HTMLInputElement>,
  isLoaded = false
) => {
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [place, setPlace] = useState<google.maps.places.PlaceResult | null>(null);

  useEffect(() => {
    if (
      !isLoaded ||
      !inputRef.current ||
      !window.google?.maps?.places?.Autocomplete
    ) {
      return;
    }

    const autocompleteInstance = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'id' }, // Indonesia
      }
    );

    autocompleteInstance.addListener('place_changed', () => {
      const selectedPlace = autocompleteInstance.getPlace();
      setPlace(selectedPlace);
    });

    setAutocomplete(autocompleteInstance);
  }, [inputRef, isLoaded]);

  return { autocomplete, place, setPlace };
};

// Utility function to geocode address
export const geocodeAddress = async (
  geocoder: google.maps.Geocoder,
  address: string
): Promise<google.maps.LatLng | null> => {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].geometry.location);
      } else {
        console.error('Geocoding failed:', status);
        resolve(null);
      }
    });
  });
};