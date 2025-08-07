import { supabase } from '../lib/supabase';

export interface AuthError {
  message: string;
  code?: string;
  type: 'oauth' | 'session' | 'network' | 'unknown';
}

export class AuthHelper {
  /**
   * Enhanced OAuth callback handler with retry logic
   */
  static async handleOAuthCallback(retryCount = 3): Promise<{ success: boolean; error?: AuthError }> {
    try {
      // First, check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check failed:', sessionError);
        return {
          success: false,
          error: {
            message: 'Failed to check session',
            code: sessionError.code,
            type: 'session'
          }
        };
      }

      if (session) {
        console.log('✅ Session already exists');
        return { success: true };
      }

      // If no session, try to recover from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        return {
          success: false,
          error: {
            message: 'No authorization code found',
            type: 'oauth'
          }
        };
      }

      // Retry logic for code exchange
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          console.log(`🔑 Attempt ${attempt} to exchange code for session...`);
          
          // Use getSession instead of exchangeCodeForSession for PKCE flow
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            if (attempt === retryCount) {
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          if (data.session) {
            console.log('✅ Session established successfully');
            return { success: true };
          }

          // Small delay before retry
          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        } catch (retryError) {
          if (attempt === retryCount) {
            throw retryError;
          }
        }
      }

      return {
        success: false,
        error: {
          message: 'Failed to establish session after retries',
          type: 'oauth'
        }
      };

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      
      return {
        success: false,
        error: {
          message: error.message || 'Authentication failed',
          code: error.code,
          type: this.getErrorType(error)
        }
      };
    }
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: AuthError): string {
    switch (error.type) {
      case 'oauth':
        return 'Error al conectar con el proveedor. Por favor, intenta de nuevo.';
      case 'session':
        return 'Error de sesión. Por favor, inicia sesión nuevamente.';
      case 'network':
        return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      default:
        return 'Error de autenticación. Por favor, intenta de nuevo.';
    }
  }

  /**
   * Determine error type from Supabase error
   */
  private static getErrorType(error: any): AuthError['type'] {
    if (error.code?.includes('oauth')) return 'oauth';
    if (error.code?.includes('session')) return 'session';
    if (error.code?.includes('network') || error.message?.includes('network')) return 'network';
    return 'unknown';
  }

  /**
   * Check if user is properly authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }

  /**
   * Clear auth state and redirect to login
   */
  static async signOutAndRedirect(navigate: (path: string) => void) {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      navigate('/login');
    }
  }

  /**
   * Clear authentication state and force reload
   */
  static async clearAuthState() {
    try {
      console.log('🧹 Clearing authentication state...');
      
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('spaceman-auth-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear session storage
      sessionStorage.clear();
      
      // Force page reload
      window.location.reload();
    } catch (error) {
      console.error('Error clearing auth state:', error);
      // Force reload anyway
      window.location.reload();
    }
  }

  /**
   * Check if auth is stuck in loading state
   */
  static isAuthStuck() {
    const authToken = localStorage.getItem('spaceman-auth-token');
    const supabaseToken = localStorage.getItem('supabase.auth.token');
    
    // If we have tokens but no valid session, auth might be stuck
    return (authToken || supabaseToken) && !supabase.auth.getSession();
  }

  /**
   * Get current auth state with detailed info
   */
  static async getAuthState() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      return {
        isAuthenticated: !!session,
        user: session?.user || null,
        session: session || null,
        error: error || null
      };
    } catch (error: any) {
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        error
      };
    }
  }
}

// Export utility functions for direct use
export const handleOAuthCallback = AuthHelper.handleOAuthCallback;
export const isAuthenticated = AuthHelper.isAuthenticated;
export const signOutAndRedirect = AuthHelper.signOutAndRedirect;
export const getAuthState = AuthHelper.getAuthState;
