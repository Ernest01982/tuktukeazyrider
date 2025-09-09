import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Car } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-text mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/request" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success('Successfully logged in!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Tuk Tuk Eazy
            </h1>
            <p className="text-gray-600">Passenger App</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              icon={<Mail className="w-5 h-5" />}
              placeholder="your.email@example.com"
            />

            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              icon={<Lock className="w-5 h-5" />}
              placeholder="Your secure password"
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            New to Tuk Tuk Eazy?{' '}
            <button 
              className="text-primary font-medium hover:underline"
              onClick={() => toast.error('Sign up not available in demo')}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};