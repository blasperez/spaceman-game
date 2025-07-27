 import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthDebugProps {
  onClose?: () => void;
}

export const AuthDebug: React.FC<AuthDebugProps> = ({ onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      const info = {
        session: session ? {
          user: session.user?.email,
          provider: session.user?.app_metadata?.provider,
          expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
        } : null,
        user: user ? {
          email: user.email,
          id: user.id,
          provider: user.app_metadata?.provider,
          confirmed: user.confirmed_at
        } : null,
        errors: {
          session: sessionError?.message,
          user: userError?.message
        },
        env: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
          googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing',
          currentOrigin: window.location.origin,
          currentPath: window.location.pathname
        }
      };
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const testGoogleAuth = async () => {
    try {
      console.log('🧪 Testing Google Auth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile'
        }
      });
      
      if (error) {
        console.error('❌ Google auth test failed:', error);
        alert(`Error: ${error.message}`);
      } else {
        console.log('✅ Google auth test initiated');
      }
    } catch (error) {
      console.error('💥 Google auth test exception:', error);
      alert(`Exception: ${(error as Error).message}`);
    }
  };

  const clearSession = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Auth Debug Panel</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading debug info...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Environment</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.env, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Session</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.session, null, 2) || 'No session'}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">User</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.user, null, 2) || 'No user'}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Errors</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo.errors, null, 2) || 'No errors'}
              </pre>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={testGoogleAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Test Google Auth
              </button>
              <button
                onClick={clearSession}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Session
              </button>
              <button
                onClick={loadDebugInfo}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
