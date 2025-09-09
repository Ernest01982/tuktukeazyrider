import React from 'react';
import { Car, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import toast from 'react-hot-toast';

export const WrongApp: React.FC = () => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center animate-slide-up">
          {/* Icon */}
          <div className="bg-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <Car className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-text mb-4">
            Wrong App!
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            This is the <strong>Passenger App</strong>. It looks like you're registered as a driver. 
            Please download the <strong>Driver App</strong> instead.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={() => window.open('https://play.google.com/store', '_blank')}
            >
              Get Driver App
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};