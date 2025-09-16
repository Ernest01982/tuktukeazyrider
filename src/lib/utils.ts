// Format currency values
export const formatCurrency = (amount: number, currency = 'ZAR'): string =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);

// Format distance in km
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

// Format duration in minutes
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

// Format relative time
export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}min ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return targetDate.toLocaleDateString();
};

// Calculate simple fare based on distance
export const calculateFare = (distanceKm: number): number => {
  const baseFare = 2.50; // Base fare in USD
  const perKmRate = 1.25; // Rate per km in USD
  return baseFare + (distanceKm * perKmRate);
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Mask phone number for privacy
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  const visible = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return masked + visible;
};

// Get status color for ride status
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'REQUESTED':
      return 'bg-accent text-text';
    case 'ASSIGNED':
      return 'bg-primary text-white';
    case 'ENROUTE':
      return 'bg-blue-500 text-white';
    case 'STARTED':
      return 'bg-green-500 text-white';
    case 'COMPLETED':
      return 'bg-gray-500 text-white';
    case 'CANCELLED':
      return 'bg-secondary text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

// Validate environment variables
export const validateEnvVars = (): void => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const optional = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_STRIPE_PUBLIC_KEY',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  const missingOptional = optional.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (missingOptional.length > 0) {
    console.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
  // Validate URL format
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }

  // Validate API key format (basic check)
  if (import.meta.env.VITE_SUPABASE_ANON_KEY.length < 100) {
    throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid');
  }

  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY.length < 30) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY appears to be invalid');
  }
  
  console.log('✅ Environment variables validated successfully');
};