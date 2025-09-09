import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Star, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { Button } from '../components/Button';
import { StatusChip } from '../components/StatusChip';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface RideHistory {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  status: 'REQUESTED' | 'ASSIGNED' | 'ENROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  estimated_fare: number;
  final_fare: number | null;
  created_at: string;
  updated_at: string;
  driver_id: string | null;
  driver?: {
    full_name: string;
  };
  ratings?: {
    score: number;
    note: string | null;
  }[];
}

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingNote, setRatingNote] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_address,
          dropoff_address,
          status,
          estimated_fare,
          final_fare,
          created_at,
          updated_at,
          driver_id,
          driver:profiles!rides_driver_id_fkey(full_name),
          ratings:ratings!ratings_ride_id_fkey(score, note)
        `)
        .eq('rider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load ride history');
      } else {
        setRides(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [user]);

  const submitRating = async (rideId: string, driverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          ride_id: rideId,
          rider_id: user.id,
          driver_id: driverId,
          score: rating,
          note: ratingNote.trim() || null,
        });

      if (error) {
        toast.error('Failed to submit rating');
      } else {
        toast.success('Thank you for your feedback!');
        setShowRatingModal(null);
        setRating(5);
        setRatingNote('');
        
        // Refresh the list to show the new rating
        window.location.reload();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  if (loading) {
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
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-text">Ride History</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {rides.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text mb-2">
              No Rides Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Your ride history will appear here after your first trip.
            </p>
            <Button onClick={() => navigate('/request')}>
              Request Your First Ride
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/ride/${ride.id}`)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <StatusChip status={ride.status} size="sm" />
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(ride.created_at)}
                  </span>
                </div>

                {/* Route */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-text text-sm truncate">
                      {ride.pickup_address}
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                    <p className="text-text text-sm truncate">
                      {ride.dropoff_address}
                    </p>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div>
                    {ride.driver && (
                      <p className="text-sm text-gray-600">
                        Driver: {ride.driver.full_name}
                      </p>
                    )}
                    {ride.ratings && ride.ratings.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="text-sm text-gray-600">
                          {ride.ratings[0].score}/5
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-text">
                      {formatCurrency(ride.final_fare || ride.estimated_fare)}
                    </p>
                    
                    {ride.status === 'COMPLETED' && (!ride.ratings || ride.ratings.length === 0) && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRatingModal(ride.id);
                        }}
                        className="mt-1"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Rate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-text mb-2">
                Rate Your Experience
              </h3>
              <p className="text-gray-600">
                How was your ride experience?
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating 
                        ? 'fill-accent text-accent' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Note */}
            <textarea
              placeholder="Add a note (optional)"
              value={ratingNote}
              onChange={(e) => setRatingNote(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg resize-none mb-6"
              rows={3}
            />

            {/* Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowRatingModal(null);
                  setRating(5);
                  setRatingNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  const ride = rides.find(r => r.id === showRatingModal);
                  if (ride?.driver_id) {
                    submitRating(ride.id, ride.driver_id);
                  } else {
                    toast.error('Rating feature requires driver information');
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};