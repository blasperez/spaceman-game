import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error en la autenticación:', error.message);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!session) {
          console.log('No se encontró sesión, verificando hash de la URL...');
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          if (accessToken) {
            console.log('Token encontrado en URL, estableciendo sesión...');
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            });

            if (setSessionError) {
              console.error('Error estableciendo sesión:', setSessionError.message);
              setTimeout(() => navigate('/login'), 2000);
              return;
            }

            if (data.session) {
              console.log('✅ Sesión establecida correctamente');
              navigate('/');
              return;
            }
          }

          console.log('No se encontró token en la URL');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('✅ Sesión activa encontrada');
        navigate('/');
      } catch (err) {
        console.error('Error inesperado:', err);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Procesando autenticación...
        </h2>
        <p className="text-gray-600">
          Por favor espera mientras completamos el proceso de inicio de sesión.
        </p>
      </div>
    </div>
  );
};

// Exportación por defecto
export default AuthCallback;
