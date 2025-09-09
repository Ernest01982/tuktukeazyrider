import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Car, User, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePhone } from '../lib/validation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Sign-up specific validations
    if (isSignUp) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = 'Full name must be at least 2 characters';
      }

      if (formData.phone && !validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName.trim(),
              phone: formData.phone.trim() || null,
              role: 'rider', // ensure rider role is set in auth metadata
            }
          }
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.user) {
          // Create profile for new user with all required fields
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: formData.email,
              full_name: formData.fullName.trim(),
              phone: formData.phone.trim() || null,
              role: 'rider', // Default role for passenger app
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast.error('Account created but profile setup failed. Please contact support.');
          } else {
            toast.success('Account created successfully! Please check your email to verify your account.');
            // Switch to sign-in mode after successful registration
            setIsSignUp(false);
            setFormData({
              email: formData.email,
              password: '',
              fullName: '',
              phone: '',
            });
          }
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please check your credentials.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data.user) {
          toast.success('Successfully logged in!');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred. Please try again.');
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
            <p className="text-sm text-gray-500 mt-1">
              {isSignUp ? 'Create your rider account' : 'Sign in to your account'}
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name - Only for Sign Up */}
            {isSignUp && (
              <Input
                type="text"
                name="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                icon={<User className="w-5 h-5" />}
                placeholder="Your full name"
                error={errors.fullName}
              />
            )}

            <Input
              type="email"
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              icon={<Mail className="w-5 h-5" />}
              placeholder="your.email@example.com"
              error={errors.email}
            />

            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              icon={<Lock className="w-5 h-5" />}
              placeholder={isSignUp ? "Create a secure password" : "Your password"}
              error={errors.password}
            />

            {/* Phone - Only for Sign Up */}
            {isSignUp && (
              <Input
                type="tel"
                name="phone"
                label="Phone Number (Optional)"
                value={formData.phone}
                onChange={handleInputChange}
                icon={<Phone className="w-5 h-5" />}
                placeholder="+1234567890"
                error={errors.phone}
              />
            )}

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="lg"
              className="mt-6"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : 'New to Tuk Tuk Eazy?'}{' '}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setFormData({
                  email: formData.email,
                  password: '',
                 fullName: '',
                  phone: '',
                });
              }}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          {isSignUp && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};