// Security utilities for production

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000); // Limit length
};

// Mask sensitive data for logging
export const maskSensitiveData = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'phone', 'email'];
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      if (typeof masked[key] === 'string') {
        masked[key] = masked[key].length > 4 
          ? `${masked[key].slice(0, 2)}***${masked[key].slice(-2)}`
          : '***';
      }
    }
  });
  
  return masked;
};

// Rate limiting helper (client-side)
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
  
  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Content Security Policy headers (for server-side implementation)
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    'https://maps.googleapis.com',
    'https://js.stripe.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://api.stripe.com',
    'https://maps.googleapis.com',
  ],
  'frame-src': [
    'https://js.stripe.com',
  ],
};

// Generate CSP header string
export const generateCSPHeader = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};