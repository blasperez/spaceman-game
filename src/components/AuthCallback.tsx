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
