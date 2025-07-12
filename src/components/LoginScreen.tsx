import React, { useState, useEffect } from 'react';
import { Rocket, Play, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (user: any) => void;
  onDemoMode: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onDemoMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already logged in, create user profile
        const userProfile = await createUserProfile(session.user);
        onLogin(userProfile);
      }
    };
    
    checkSession();
  }, [onLogin]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await createUserProfile(session.user);
        onLogin(userProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  const createUserProfile = async (supabaseUser: any) => {
    try {
      // Check if user profile exists in our database
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (existingProfile) {
        return {
          id: existingProfile.id,
          name: existingProfile.full_name || supabaseUser.user_metadata?.full_name || 'Usuario',
          email: existingProfile.email || supabaseUser.email,
          avatar: existingProfile.avatar_url || supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(existingProfile.full_name || 'Usuario')}&background=random`,
          provider: existingProfile.provider || 'google',
          balance: existingProfile.balance || 1000.00,
          isDemo: false,
          // Casino specific fields
          age: existingProfile.age,
          country: existingProfile.country,
          phone: existingProfile.phone,
          kyc_verified: existingProfile.kyc_verified || false,
          withdrawal_methods: existingProfile.withdrawal_methods || [],
          deposit_limit: existingProfile.deposit_limit || 1000,
          withdrawal_limit: existingProfile.withdrawal_limit || 1000,
          total_deposits: existingProfile.total_deposits || 0,
          total_withdrawals: existingProfile.total_withdrawals || 0,
          games_played: existingProfile.games_played || 0,
          total_wagered: existingProfile.total_wagered || 0,
          total_won: existingProfile.total_won || 0
        };
      } else {
        // Create new user profile
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: supabaseUser.user_metadata?.full_name || 'Usuario',
          avatar_url: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.user_metadata?.full_name || 'Usuario')}&background=random`,
          provider: 'google',
          balance: 1000.00,
          created_at: new Date().toISOString(),
          // Casino specific fields
          age: null,
          country: null,
          phone: null,
          kyc_verified: false,
          withdrawal_methods: [],
          deposit_limit: 1000,
          withdrawal_limit: 1000,
          total_deposits: 0,
          total_withdrawals: 0,
          games_played: 0,
          total_wagered: 0,
          total_won: 0
        };

        const { error } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (error) {
          console.error('Error creating user profile:', error);
          // If table doesn't exist, create a mock profile
          return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.full_name || 'Usuario',
            email: supabaseUser.email,
            avatar: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.user_metadata?.full_name || 'Usuario')}&background=random`,
            provider: 'google',
            balance: 1000.00,
            isDemo: false,
            age: null,
            country: null,
            phone: null,
            kyc_verified: false,
            withdrawal_methods: [],
            deposit_limit: 1000,
            withdrawal_limit: 1000,
            total_deposits: 0,
            total_withdrawals: 0,
            games_played: 0,
            total_wagered: 0,
            total_won: 0
          };
        }

        return {
          id: newProfile.id,
          name: newProfile.full_name,
          email: newProfile.email,
          avatar: newProfile.avatar_url,
          provider: newProfile.provider,
          balance: newProfile.balance,
          isDemo: false,
          age: newProfile.age,
          country: newProfile.country,
          phone: newProfile.phone,
          kyc_verified: newProfile.kyc_verified,
          withdrawal_methods: newProfile.withdrawal_methods,
          deposit_limit: newProfile.deposit_limit,
          withdrawal_limit: newProfile.withdrawal_limit,
          total_deposits: newProfile.total_deposits,
          total_withdrawals: newProfile.total_withdrawals,
          games_played: newProfile.games_played,
          total_wagered: newProfile.total_wagered,
          total_won: newProfile.total_won
        };
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      // Return a fallback profile if database is not available
      return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.full_name || 'Usuario',
        email: supabaseUser.email,
        avatar: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.user_metadata?.full_name || 'Usuario')}&background=random`,
        provider: 'google',
        balance: 1000.00,
        isDemo: false,
        age: null,
        country: null,
        phone: null,
        kyc_verified: false,
        withdrawal_methods: [],
        deposit_limit: 1000,
        withdrawal_limit: 1000,
        total_deposits: 0,
        total_withdrawals: 0,
        games_played: 0,
        total_wagered: 0,
        total_won: 0
      };
    }
  };

  // --- EMAIL / PASSWORD ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          setMessage('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (error.message.includes('Password should be at least')) {
          setMessage('La contraseña debe tener al menos 6 caracteres.');
        } else {
          setMessage('Error al registrar: ' + error.message);
        }
      } else {
        setMessage('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      }
    } catch (error) {
      console.error('Signup exception:', error);
      setMessage('Error al registrar: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setMessage('Email o contraseña incorrectos. Intenta de nuevo.');
        } else if (error.message.includes('Email not confirmed')) {
          setMessage('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          setMessage('Error al iniciar sesión: ' + error.message);
        }
        setLoading(false);
        return;
      }
      
      if (data.user) {
        console.log('Login successful:', data.user);
        // Create user profile and login
        const userProfile = await createUserProfile(data.user);
        onLogin(userProfile);
        setMessage('¡Bienvenido! Sesión iniciada.');
        setLoading(false);
      } else {
        console.error('No user data received');
        setMessage('Error: No se pudo obtener información del usuario');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login exception:', error);
      setMessage('Error al iniciar sesión: ' + (error as Error).message);
      setLoading(false);
    }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    setMessage('');
    setAuthLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setMessage('Error con Google: ' + error.message);
        setAuthLoading(false);
      }
      // La redirección ocurre automáticamente
    } catch (error) {
      setMessage('Error al conectar con Google: ' + (error as Error).message);
      setAuthLoading(false);
    }
  };

  // --- DEMO MODE ---
  const handleDemoMode = () => {
    onDemoMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket size={32} className="text-white sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Spaceman Casino</h1>
          <p className="text-gray-300 text-sm sm:text-base">¡Vuela alto y gana más!</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-4 sm:mb-6">
            {isLogin ? 'Inicia Sesión' : 'Registrarse'}
          </h2>
          
          {/* SOLO Google */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 active:bg-gray-200 disabled:bg-gray-300 text-gray-900 font-medium py-3 sm:py-3 px-4 rounded-xl transition-colors active:scale-95 disabled:scale-100"
              type="button"
            >
              {authLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-sm sm:text-base">
                {authLoading ? 'Conectando...' : 'Continuar con Google'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">o</span>
            </div>
          </div>

          {/* Formulario email/password */}
          <form
            onSubmit={isLogin ? handleSignIn : handleSignUp}
            className="space-y-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-lg px-3 py-2 w-full text-black"
              placeholder="Correo electrónico"
            />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="rounded-lg px-3 py-2 w-full text-black"
              placeholder="Contraseña"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 w-full text-white py-2 rounded-lg transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isLogin ? "Entrando..." : "Registrando..."}</span>
                </div>
              ) : (
                isLogin ? "Entrar" : "Registrarse"
              )}
            </button>
          </form>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-gray-300 hover:underline focus:outline-none"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Entrar"}
            </button>
          </div>
          
          {message && (
            <div className={`text-center text-sm ${message.includes('¡') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </div>
          )}

          {/* Demo mode button */}
          <button
            onClick={handleDemoMode}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white font-medium py-3 px-4 rounded-xl transition-all transform active:scale-95 mt-2"
            type="button"
          >
            <Play size={20} />
            <span className="text-sm sm:text-base">Jugar en Modo Demo</span>
          </button>

          <p className="text-xs text-gray-400 text-center mt-3 sm:mt-4">
            En modo demo juegas con dinero virtual sin riesgo real
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6 text-gray-400 text-xs sm:text-sm">
          <p>Al continuar, aceptas nuestros términos y condiciones</p>
          <p className="mt-1">Juego responsable - +18 años</p>
        </div>
      </div>
    </div>
  );
};
