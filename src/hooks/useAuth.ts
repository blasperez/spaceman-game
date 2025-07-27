import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  balance: number;
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchProfile(session.user);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user: User) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not found, create it
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
        data = newProfile;
      } else if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error during profile fetch/create:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign in...');
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile'
        }
      });
      
      if (error) {
        console.error('❌ Google sign in error:', error);
        throw error;
      }
      
      console.log('✅ Google sign in initiated successfully');
    } catch (error: any) {
      console.error('💥 Google sign in exception:', error);
      throw new Error(`Error al conectar con Google: ${error.message || 'Por favor, intenta de nuevo.'}`);
    }
  };

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email public_profile'
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Facebook:', error);
      throw new Error('Error al conectar con Facebook. Por favor, intenta de nuevo.');
    }
  };

  const signInWithTwitter = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Twitter:', error);
      throw new Error('Error al conectar con Twitter. Por favor, intenta de nuevo.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh profile
      await fetchProfile(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      if (profile) {
        setProfile({ ...profile, balance: newBalance });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signOut,
    updateProfile,
    updateBalance
  };
};
