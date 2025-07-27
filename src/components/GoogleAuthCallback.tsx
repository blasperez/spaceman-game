import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const GoogleAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 Processing Google auth callback...');
        
        // Esperar a que Supabase procese el callback
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          navigate('/login', { 
            state: { error: 'Error de autenticación. Por favor, intenta de nuevo.' } 
          });
          return;
        }

        if (session) {
          console.log('✅ Auth successful, user:', session.user.email);
          
          // Crear perfil si no existe
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url,
              balance: 0
            });
          }

          navigate('/');
        } else {
          console.log('❌ No session found');
          navigate('/login');
        }
      } catch (error) {
        console.error('💥 Callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Procesando autenticación...
        </h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};
