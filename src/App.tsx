import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { WrongApp } from './pages/WrongApp';
import { RequestRide } from './pages/RequestRide';
import { RideTracking } from './pages/RideTracking';
import { History } from './pages/History';
import { validateEnvVars } from './lib/utils';

// Validate environment variables on app start
try {
  validateEnvVars();
} catch (error) {
  console.error('Environment validation failed:', error);
}

function App() {
  return (
    <>
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
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/request" replace />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/request" replace />} />
        </Routes>
      </Router>
      
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0E172A',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#2EC4B6',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;