import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('🔄 Processing auth callback...');
        setDebugInfo('Iniciando proceso de autenticación...');

        // Primero intentamos obtener el hash de la URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Si tenemos tokens en la URL, establecerlos en Supabase
          const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            setError(setSessionError.message);
            setDebugInfo(`Error configurando sesión: ${setSessionError.message}`);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (session) {
            console.log('✅ Session set successfully');
            setDebugInfo('Sesión establecida correctamente');
            navigate('/');
            return;
          }
        }

        // Si no hay tokens en la URL, intentar obtener la sesión actual
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

    handleAuth();
  }, [navigate]);

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
};
