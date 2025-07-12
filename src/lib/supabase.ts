import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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
          provider: string;
          age: number | null;
          country: string | null;
          phone: string | null;
          kyc_verified: boolean;
          withdrawal_methods: any[];
          deposit_limit: number;
          withdrawal_limit: number;
          total_deposits: number;
          total_withdrawals: number;
          games_played: number;
          total_wagered: number;
          total_won: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          balance?: number;
          provider?: string;
          age?: number | null;
          country?: string | null;
          phone?: string | null;
          kyc_verified?: boolean;
          withdrawal_methods?: any[];
          deposit_limit?: number;
          withdrawal_limit?: number;
          total_deposits?: number;
          total_withdrawals?: number;
          games_played?: number;
          total_wagered?: number;
          total_won?: number;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          balance?: number;
          provider?: string;
          age?: number | null;
          country?: string | null;
          phone?: string | null;
          kyc_verified?: boolean;
          withdrawal_methods?: any[];
          deposit_limit?: number;
          withdrawal_limit?: number;
          total_deposits?: number;
          total_withdrawals?: number;
          games_played?: number;
          total_wagered?: number;
          total_won?: number;
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
