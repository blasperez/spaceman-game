import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing auth callback...');
        
        // Check for error in URL
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription || 'Authentication failed');
          setTimeout(() => navigate('/login?error=auth_failed'), 3000);
          return;
        }

        // Handle the OAuth callback
        const code = searchParams.get('code');
        if (code) {
          console.log('🔑 Processing OAuth code...');
          
          // Use the recommended method for handling OAuth callbacks
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session retrieval error:', error);
            setError('Failed to retrieve session');
            setTimeout(() => navigate('/login?error=auth_failed'), 3000);
            return;
          }

          if (data.session) {
            console.log('✅ Auth successful, session found');
            // Small delay to ensure state is properly set
            setTimeout(() => navigate('/'), 1000);
            return;
          }
        }

        // Check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          setError('Failed to check session');
          setTimeout(() => navigate('/login?error=auth_failed'), 3000);
          return;
        }

        if (sessionData.session) {
          console.log('✅ Existing session found');
          setTimeout(() => navigate('/'), 1000);
        } else {
          console.log('❌ No session found');
          setError('No active session found');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError('Authentication failed');
        setTimeout(() => navigate('/login?error=auth_failed'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Error de Autenticación</h2>
            <p className="mb-4">{error}</p>
            <p className="text-sm opacity-75">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Completando autenticación...</p>
        <p className="text-white text-sm opacity-75 mt-2">Por favor espera...</p>
      </div>
    </div>
  );
};
