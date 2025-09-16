import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isRider: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Add a small delay to ensure the database trigger has completed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          full_name,
          phone,
          photo_url,
          email,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        
        // If profile doesn't exist, create it manually
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating manually...');
          await createMissingProfile(userId);
          return;
        }
        
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const createMissingProfile = async (userId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: user.user.user_metadata?.full_name || 'User',
          email: user.user.email,
          phone: user.user.user_metadata?.phone || null,
          role: 'rider',
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating profile:', error);
        setProfile(null);
      } else {
        console.log('Profile created successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating missing profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };
  return {
    user,
    profile,
    loading,
    isRider: profile?.role === 'rider',
  };
};