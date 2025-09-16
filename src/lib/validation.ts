import { ValidationError } from './errors';
import { APP_CONFIG } from './constants';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (basic international format)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;
  return phoneRegex.test(phone);
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Ride validation
export const validateRideDistance = (distanceKm: number): void => {
  if (distanceKm < APP_CONFIG.ride.minDistance) {
    throw new ValidationError(
      `Distance is too short. Minimum distance is ${APP_CONFIG.ride.minDistance}km`,
      'DISTANCE_TOO_SHORT'
    );
  }
  
  if (distanceKm > APP_CONFIG.ride.maxDistance) {
    throw new ValidationError(
      `Distance is too long. Maximum distance is ${APP_CONFIG.ride.maxDistance}km`,
      'DISTANCE_TOO_LONG'
    );
  }
};

// Rating validation
export const validateRating = (score: number): void => {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new ValidationError(
      'Rating must be an integer between 1 and 5',
      'INVALID_RATING'
    );
  }
};

// Coordinate validation
export const validateCoordinates = (lat: number, lng: number): void => {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new ValidationError(
      'Invalid latitude. Must be between -90 and 90',
      'INVALID_LATITUDE'
    );
  }
  
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new ValidationError(
      'Invalid longitude. Must be between -180 and 180',
      'INVALID_LONGITUDE'
    );
  }
};

// Form validation helper
export const validateForm = (
  data: Record<string, unknown>,
  rules: Record<string, (value: unknown) => void>
): void => {
  const errors: string[] = [];
  
  Object.entries(rules).forEach(([field, validator]) => {
    try {
      validator(data[field]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(`${field}: ${error.message}`);
      }
    }
  });
  
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '), 'FORM_VALIDATION_ERROR');
  }
};

// File validation
export const validateImageFile = (file: File): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError(
      'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      'INVALID_FILE_TYPE'
    );
  }
  
  if (file.size > maxSize) {
    throw new ValidationError(
      'File size too large. Please upload an image smaller than 5MB.',
      'FILE_TOO_LARGE'
    );
  }
};

// Enhanced phone validation for Indonesian numbers
export const validateIndonesianPhone = (phone: string): boolean => {
  // Indonesian phone number patterns
  const patterns = [
    /^\+62[0-9]{9,12}$/, // International format
    /^62[0-9]{9,12}$/, // Without plus
    /^0[0-9]{9,12}$/, // Local format
    /^8[0-9]{8,11}$/, // Mobile without leading 0
  ];
  
  return patterns.some(pattern => pattern.test(phone.replace(/[\s-]/g, '')));
};