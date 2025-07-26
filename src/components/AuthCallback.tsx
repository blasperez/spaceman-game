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
        
        // Enhanced URL parameter checking
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        console.log('🔍 URL Parameters:', {
          hasCode: !!code,
          error: error,
          errorDescription: errorDescription,
          fullUrl: window.location.href
        });
        
        // Check for error in URL
        if (error) {
          console.error('OAuth error from provider:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          setTimeout(() => navigate('/login?error=auth_failed'), 3000);
          return;
        }

        // Wait a moment for Supabase to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for session multiple times with retry logic
        let sessionData = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!sessionData && attempts < maxAttempts) {
          attempts++;
          console.log(`🔍 Session check attempt ${attempts}/${maxAttempts}`);
          
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error(`Session check ${attempts} failed:`, sessionError);
            if (attempts === maxAttempts) {
              setError('Failed to retrieve session after multiple attempts');
              setTimeout(() => navigate('/login?error=auth_failed'), 3000);
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

          if (data.session) {
            sessionData = data.session;
            console.log('✅ Session found on attempt', attempts);
            break;
          }
          
          if (attempts < maxAttempts) {
            console.log('⏳ No session yet, retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (sessionData) {
          console.log('✅ Auth callback successful, redirecting to app');
          
          // Ensure profile exists
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sessionData.user.id)
              .single();
            
            if (profileError && profileError.code === 'PGRST116') {
              // Profile doesn't exist, create it
              console.log('📝 Creating user profile...');
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: sessionData.user.id,
                  email: sessionData.user.email,
                  full_name: sessionData.user.user_metadata?.full_name || 'Usuario',
                  avatar_url: sessionData.user.user_metadata?.avatar_url,
                  provider: 'google',
                  balance: 1000.00
                });
              
              if (insertError) {
                console.error('❌ Profile creation failed:', insertError);
                // Continue anyway, profile will be created by trigger
              } else {
                console.log('✅ Profile created successfully');
              }
            }
          } catch (profileError) {
            console.warn('⚠️ Profile check/creation failed:', profileError);
            // Continue anyway
          }
          
          // Navigate to app
          setTimeout(() => navigate('/'), 500);
        } else {
          console.log('❌ No session found after all attempts');
          setError('Authentication could not be completed. Please try again.');
          setTimeout(() => navigate('/login?error=no_session'), 3000);
        }
      } catch (error) {
        console.error('💥 Auth callback exception:', error);
        setError(`Authentication failed: ${(error as Error).message}`);
        setTimeout(() => navigate('/login?error=auth_failed'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // Remove the old useEffect that was using searchParams
  /*
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        } else {
          console.log('❌ No session found in callback');
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
  */

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