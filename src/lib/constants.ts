// App configuration constants
export const APP_CONFIG = {
  name: 'Tuk Tuk Eazy',
  version: '1.0.1',
  description: 'Your reliable ride-sharing companion',
  
  // Ride configuration
  ride: {
    baseFare: 2.50,
    perKmRate: 1.25,
    maxDistance: 50, // km
    minDistance: 0.1, // km
    cancelTimeLimit: 5, // minutes
    searchRadius: 10, // km for driver search
  },
  
  // Map configuration
  map: {
    defaultCenter: { lat: -6.2088, lng: 106.8456 }, // Jakarta, Indonesia
    defaultZoom: 13,
    maxZoom: 18,
    minZoom: 10,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }],
      },
    ],
  },
  
  // API configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    maxConcurrentRequests: 5,
  },
  
  // UI configuration
  ui: {
    toastDuration: 4000,
    animationDuration: 300,
    debounceDelay: 500,
    loadingTimeout: 10000, // 10 seconds
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    sessionExpired: 'Your session has expired. Please log in again.',
    unauthorized: 'You are not authorized to access this resource',
    networkError: 'Network error. Please check your connection.',
  },
  ride: {
    notFound: 'Ride not found',
    alreadyCancelled: 'This ride has already been cancelled',
    cannotCancel: 'Cannot cancel ride at this stage',
    locationRequired: 'Please select both pickup and drop-off locations',
    distanceTooLong: 'Distance is too long for this service',
    distanceTooShort: 'Distance is too short for this service',
  },
  payment: {
    failed: 'Payment failed. Please try again.',
    cancelled: 'Payment was cancelled',
    processing: 'Payment is being processed',
  },
  map: {
    loadFailed: 'Failed to load map. Please refresh the page.',
    locationNotFound: 'Location not found',
    geocodingFailed: 'Unable to find location coordinates',
  },
  general: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unknownError: 'An unexpected error occurred',
  },
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  auth: {
    loginSuccess: 'Successfully logged in!',
    logoutSuccess: 'Successfully logged out',
  },
  ride: {
    requested: 'Ride requested successfully!',
    cancelled: 'Ride cancelled successfully',
    completed: 'Ride completed!',
  },
  payment: {
    success: 'Payment completed successfully!',
  },
  rating: {
    submitted: 'Thank you for your feedback!',
  },
} as const;