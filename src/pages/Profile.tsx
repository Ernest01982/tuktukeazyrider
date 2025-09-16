import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Camera, Save, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePhone } from '../lib/validation';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

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

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to update profile');
        console.error('Profile update error:', error);
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/request')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-text">Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                {profile.photo_url ? (
                  <img 
                    src={profile.photo_url} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <button className="absolute bottom-4 right-0 bg-accent text-text p-2 rounded-full shadow-lg hover:bg-accent-dark transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">Tap to change photo</p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              type="text"
              name="full_name"
              label="Full Name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              icon={<User className="w-5 h-5" />}
              placeholder="Your full name"
              error={errors.full_name}
            />

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
              type="tel"
              name="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              icon={<Phone className="w-5 h-5" />}
              placeholder="+62 812 3456 7890"
              error={errors.phone}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={saving}
              className="mt-6"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </form>

          {/* Account Info */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Account Type</span>
              <span className="font-medium text-text capitalize">{profile.role}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium text-text">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="secondary"
            fullWidth
            onClick={handleLogout}
            className="mt-6"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};