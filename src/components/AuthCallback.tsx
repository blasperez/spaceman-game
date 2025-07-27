import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {error ? (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <p className="text-sm text-gray-500">{debugInfo}</p>
            <p className="text-sm text-gray-500 mt-4">Redirigiendo al inicio de sesión...</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Procesando Autenticación</h2>
            <p className="text-gray-700">{debugInfo}</p>
          </>
        )}
      </div>
    </div>
  );
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing auth callback...');
        setDebugInfo('Iniciando proceso de autenticación...');

        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Error getting session:', authError);
          setError(authError.message);
          setDebugInfo(`Error de autenticación: ${authError.message}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!authData.session) {
          console.error('No session found');
          setError('No se encontró sesión');
          setDebugInfo('Error: No se encontró sesión activa');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Si llegamos aquí, la autenticación fue exitosa
        console.log('✅ Authentication successful');
        setDebugInfo('Autenticación exitosa, redirigiendo...');
        navigate('/');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('❌ Error in auth callback:', errorMessage);
        setError(errorMessage);
        setDebugInfo(`Error inesperado: ${errorMessage}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

        // Si llegamos aquí, la autenticación fue exitosa
        console.log('✅ Authentication successful');
        setDebugInfo('Autenticación exitosa, redirigiendo...');
        navigate('/');
      } catch (error) {
        console.error('❌ Error in auth callback:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        setDebugInfo(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">{debugInfo}</p>
          <p className="text-sm text-gray-500 mt-4">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Procesando Autenticación</h2>
        <p className="text-gray-700">{debugInfo}</p>
      </div>
    </div>
  );
        
        console.log('🔍 URL Parameters:', {
          hasCode: !!code,
          error: error,
          errorDescription: errorDescription,
          state: state,
          fullUrl: window.location.href,
          origin: window.location.origin
        });
        
        setDebugInfo(`URL: ${window.location.href}`);
        
        // Check for error in URL
        if (error) {
          console.error('OAuth error from provider:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          setDebugInfo(`Error: ${errorDescription || error}`);
          setTimeout(() => navigate('/login?error=auth_failed'), 5000);
          return;
        }

        // Check for code presence
        if (!code) {
          console.error('❌ No authorization code found in URL');
          setError('No se encontró el código de autorización');
          setDebugInfo('No hay código de autorización en la URL');
          setTimeout(() => navigate('/login?error=no_code'), 5000);
          return;
        }

        // Force refresh session
        console.log('🔄 Forcing session refresh...');
        setDebugInfo('Refrescando sesión...');
        
        const { data: { session }, error: refreshError } = await supabase.auth.getSession();
        
        if (refreshError) {
          console.error('❌ Session refresh error:', refreshError);
          setError('Error al refrescar la sesión');
          setDebugInfo(`Error de sesión: ${refreshError.message}`);
          setTimeout(() => navigate('/login?error=session_refresh'), 5000);
          return;
        }

        if (session) {
          console.log('✅ Session found after refresh:', session.user?.email);
          setDebugInfo(`Sesión encontrada: ${session.user?.email}`);
          
          // Verify user profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Profile check error:', profileError);
            setError('Error al verificar el perfil');
            setDebugInfo(`Error de perfil: ${profileError.message}`);
            setTimeout(() => navigate('/login?error=profile_check'), 5000);
            return;
          }

          console.log('✅ Auth callback successful, redirecting to app...');
          setDebugInfo('Autenticación exitosa, redirigiendo...');
          
          // Small delay to show success
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          console.log('❌ No session found after refresh');
          setError('No se pudo establecer la sesión');
          setDebugInfo('No hay sesión después del refresco');
          setTimeout(() => navigate('/login?error=no_session'), 5000);
        }
      } catch (error) {
        console.error('💥 Auth callback exception:', error);
        setError(`Authentication failed: ${(error as Error).message}`);
        setDebugInfo(`Excepción: ${(error as Error).message}`);
        setTimeout(() => navigate('/login?error=exception'), 5000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Error de Autenticación</h2>
            <p className="mb-4">{error}</p>
            {debugInfo && (
              <div className="bg-black/20 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-300">{debugInfo}</p>
              </div>
            )}
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
        {debugInfo && (
          <div className="mt-4 bg-black/20 p-2 rounded-lg">
            <p className="text-xs text-gray-300">{debugInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
};
