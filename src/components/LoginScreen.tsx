import React from 'react';
import { Rocket, Play } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (provider: 'google' | 'facebook' | 'twitter') => void;
  onDemoMode: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onDemoMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo - Mobile optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket size={32} className="text-white sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Spaceman</h1>
          <p className="text-gray-300 text-sm sm:text-base">¡Vuela alto y gana más!</p>
        </div>

        {/* Login Card - Mobile optimized */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-4 sm:mb-6">
            Inicia Sesión o Juega Demo
          </h2>

          {/* Social Login Buttons - Touch optimized */}
          <div className="space-y-3">
            <button
              onClick={() => onLogin('google')}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-medium py-3 sm:py-3 px-4 rounded-xl transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm sm:text-base">Continuar con Google</span>
            </button>

            <button
              onClick={() => onLogin('facebook')}
              className="w-full flex items-center justify-center space-x-3 bg-[#1877F2] hover:bg-[#166FE5] active:bg-[#1565D8] text-white font-medium py-3 px-4 rounded-xl transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm sm:text-base">Continuar con Facebook</span>
            </button>

            <button
              onClick={() => onLogin('twitter')}
              className="w-full flex items-center justify-center space-x-3 bg-black hover:bg-gray-900 active:bg-gray-800 text-white font-medium py-3 px-4 rounded-xl transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm sm:text-base">Continuar con X</span>
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

          {/* Demo Mode Button - Touch optimized */}
          <button
            onClick={onDemoMode}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white font-medium py-3 px-4 rounded-xl transition-all transform active:scale-95"
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
        </div>
      </div>
    </div>
  );
};
