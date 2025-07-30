import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

export type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error.message);
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (session?.user) {
          setAuthState({
            user: session.user,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({ user: null, loading: false, error: null });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setAuthState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Error inesperado',
          loading: false,
        }));
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: session.user,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error.message);
        setAuthState(prev => ({ ...prev, error: error.message }));
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error iniciando sesión',
      }));
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        setAuthState(prev => ({ ...prev, error: error.message }));
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error cerrando sesión',
      }));
    }
  };

  return {
    ...authState,
    signInWithGoogle,
    signOut,
  };
};
