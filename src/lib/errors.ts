// Custom error classes for better error handling
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code, 401);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code, 400);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, code: string = 'NETWORK_ERROR') {
    super(message, code, 503);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, code: string = 'PAYMENT_ERROR') {
    super(message, code, 402);
  }
}

// Error handler utility
export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError('Network connection failed');
    }
    
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return new AuthError('Authentication failed');
    }

    return new AppError(error.message, 'UNKNOWN_ERROR');
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
};

// Error logging utility
export const logError = (error: AppError, context?: Record<string, any>) => {
  const errorInfo = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, send to error tracking service (e.g., Sentry)
  if (import.meta.env.PROD) {
    console.error('Production Error:', errorInfo);
    // TODO: Send to error tracking service
  } else {
    console.error('Development Error:', errorInfo);
  }
};