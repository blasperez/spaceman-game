import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Procesando autenticación...');

  const handleUserSession = async (user: any) => {
    try {
      console.log('✅ User authenticated:', user.email);
      setStatus('Configurando perfil...');

      // Create or update user profile in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Usuario',
          avatar_url: user.user_metadata?.avatar_url,
          provider: 'google',
          balance: 1000.00, // Default balance for new users
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Profile error:', profileError);
        // Continue anyway, user can still login
      }

      setStatus('¡Autenticación exitosa! Redirigiendo...');
      
      // Redirect to main app
      setTimeout(() => {
        navigate('/?auth=success');
      }, 1000);
    } catch (error) {
      console.error('❌ Error handling user session:', error);
      setStatus('Error inesperado. Redirigiendo...');
      setTimeout(() => navigate('/?error=session_error'), 2000);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Processing Supabase auth callback...');
        setStatus('Verificando sesión...');

        // First try to handle the OAuth callback from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('🔄 Processing OAuth code...');
          setStatus('Procesando código de autenticación...');
          
          // Exchange the code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Code exchange error:', error);
            setStatus('Error en el intercambio de código. Redirigiendo...');
            setTimeout(() => navigate('/?error=code_exchange_failed'), 2000);
            return;
          }
          
          if (data.session?.user) {
            await handleUserSession(data.session.user);
            return;
          }
        }

        // Fallback: try to get existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          setStatus('Error en la autenticación. Redirigiendo...');
          setTimeout(() => navigate('/?error=auth_failed'), 2000);
          return;
        }

        if (data.session?.user) {
          await handleUserSession(data.session.user);
        } else {
          console.error('❌ No session found');
          setStatus('No se pudo obtener la sesión. Redirigiendo...');
          setTimeout(() => navigate('/?error=no_session'), 2000);
        }
      } catch (error) {
        console.error('❌ Auth callback exception:', error);
        setStatus('Error inesperado. Redirigiendo...');
        setTimeout(() => navigate('/?error=callback_error'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Loader2 size={32} className="text-white animate-spin" />
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-4">
          Autenticando...
        </h2>
        
        <p className="text-gray-300 text-sm">
          {status}
        </p>
        
        <div className="mt-6 w-full bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
