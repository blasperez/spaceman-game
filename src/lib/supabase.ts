import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spaceman-game-production.up.railway.app';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          balance: number;
          phone_number: string | null;
          date_of_birth: string | null;
          country: string | null;
          city: string | null;
          address: string | null;
          document_type: string | null;
          document_number: string | null;
          kyc_status: 'pending' | 'verified' | 'rejected';
          account_status: 'active' | 'suspended' | 'banned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          balance?: number;
          phone_number?: string | null;
          date_of_birth?: string | null;
          country?: string | null;
          city?: string | null;
          address?: string | null;
          document_type?: string | null;
          document_number?: string | null;
          kyc_status?: 'pending' | 'verified' | 'rejected';
          account_status?: 'active' | 'suspended' | 'banned';
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          balance?: number;
          phone_number?: string | null;
          date_of_birth?: string | null;
          country?: string | null;
          city?: string | null;
          address?: string | null;
          document_type?: string | null;
          document_number?: string | null;
          kyc_status?: 'pending' | 'verified' | 'rejected';
          account_status?: 'active' | 'suspended' | 'banned';
          updated_at?: string;
        };
      };
      game_history: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          bet_amount: number;
          multiplier: number;
          win_amount: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          bet_amount: number;
          multiplier: number;
          win_amount: number;
        };
        Update: {
          bet_amount?: number;
          multiplier?: number;
          win_amount?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal';
          amount: number;
          status: 'pending' | 'completed' | 'failed';
          payment_method: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: 'deposit' | 'withdrawal';
          amount: number;
          status?: 'pending' | 'completed' | 'failed';
          payment_method: string;
        };
        Update: {
          status?: 'pending' | 'completed' | 'failed';
        };
      };
    };
  };
}
