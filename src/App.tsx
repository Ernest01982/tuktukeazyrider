import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkStatus } from './components/NetworkStatus';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { WrongApp } from './pages/WrongApp';
import { RequestRide } from './pages/RequestRide';
import { RideTracking } from './pages/RideTracking';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { validateEnvVars } from './lib/utils';
import { APP_CONFIG } from './lib/constants';

// Validate environment variables on app start
try {
  validateEnvVars();
} catch (error) {
  console.error('Environment validation failed:', error);
  // In production, you might want to show a proper error page
  if (import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
        <div style="text-align: center; padding: 2rem;">
          <h1>Configuration Error</h1>
          <p>The application is not properly configured. Please contact support.</p>
        </div>
      </div>
    `;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <NetworkStatus />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/wrong-app" element={<WrongApp />} />
          
          {/* Protected routes */}
          <Route path="/request" element={
            <ProtectedRoute>
              <RequestRide />
            </ProtectedRoute>
          } />
          
          <Route path="/ride/:rideId" element={
            <ProtectedRoute>
              <RideTracking />
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Landing page */}
          <Route path="/" element={<Landing />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      <Toaster
        position="top-center"
        toastOptions={{
          duration: APP_CONFIG.ui.toastDuration,
          style: {
            background: '#0E172A',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#2EC4B6',
              secondary: '#fff',
            },
            duration: 3000,
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#fff',
            },
            duration: 5000,
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;