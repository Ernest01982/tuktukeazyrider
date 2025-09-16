import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, isRider } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold text-text mb-2">Setting up your profile...</h2>
          <p className="text-gray-600 mb-4">This may take a moment.</p>
          <LoadingSpinner />
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline text-sm"
            >
              Refresh if this takes too long
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isRider) {
    return <Navigate to="/wrong-app" replace />;
  }

  return <>{children}</>;
};