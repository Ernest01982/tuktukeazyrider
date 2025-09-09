import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Landing: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <Navigate to={user ? '/request' : '/login'} replace />;
};

