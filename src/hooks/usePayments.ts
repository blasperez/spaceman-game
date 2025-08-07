import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PaymentOptions {
  amount: number;
  currency?: string;
  description?: string;
}

interface SubscriptionOptions {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (options: PaymentOptions) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please log in again.');
      }

      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: Math.round(options.amount * 100), // Convert to cents
          currency: options.currency || 'mxn'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Payment intent creation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (options: SubscriptionOptions) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please log in again.');
      }

      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId: options.priceId,
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
          mode: 'subscription'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Checkout session creation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTransactionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      throw err;
    }
  };

  const getUserBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, total_deposits, total_withdrawals')
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching user balance:', err);
      throw err;
    }
  };

  const getSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    createPaymentIntent,
    createCheckoutSession,
    getTransactionHistory,
    getUserBalance,
    getSubscriptionStatus,
    clearError: () => setError(null)
  };
};