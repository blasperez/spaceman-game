import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'bank_account' | 'paypal';
  brand?: string;
  last4?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'game_win' | 'game_loss';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  description?: string;
  fee_amount: number;
  net_amount: number;
  currency: string;
  metadata?: any;
}

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  payment_method: string;
  account_details: any;
  fee_amount: number;
  net_amount: number;
  currency: string;
  stripe_payout_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

interface UserBalance {
  balance: number;
  total_deposits: number;
  total_withdrawals: number;
  total_wins: number;
  total_losses: number;
}

export const usePayments = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
      fetchTransactions();
      fetchWithdrawals();
      fetchUserBalance();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_transaction_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchWithdrawals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, total_deposits, total_withdrawals')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Calculate totals from transactions
      const { data: transactionData } = await supabase
        .from('user_transaction_history')
        .select('transaction_type, net_amount')
        .eq('user_id', user.id);

      const totalWins = transactionData
        ?.filter(t => t.transaction_type === 'game_win')
        .reduce((sum, t) => sum + (t.net_amount || 0), 0) || 0;

      const totalLosses = transactionData
        ?.filter(t => t.transaction_type === 'game_loss')
        .reduce((sum, t) => sum + Math.abs(t.net_amount || 0), 0) || 0;

      setUserBalance({
        balance: data.balance || 0,
        total_deposits: data.total_deposits || 0,
        total_withdrawals: data.total_withdrawals || 0,
        total_wins: totalWins,
        total_losses: totalLosses
      });
    } catch (error) {
      console.error('Error fetching user balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (amount: number, paymentMethodId?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          amount,
          payment_method_id: paymentMethodId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  const createCheckoutSession = async (amount: number, coins: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          amount,
          coins,
          user_id: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const requestWithdrawal = async (amount: number, paymentMethod: string, accountDetails: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount,
          payment_method: paymentMethod,
          account_details: accountDetails,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh withdrawals list
      await fetchWithdrawals();

      return data;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }
  };

  const savePaymentMethod = async (stripePaymentMethodId: string, paymentMethodData: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          stripe_payment_method_id: stripePaymentMethodId,
          type: paymentMethodData.type,
          brand: paymentMethodData.card?.brand,
          last4: paymentMethodData.card?.last4,
          expiry_month: paymentMethodData.card?.exp_month,
          expiry_year: paymentMethodData.card?.exp_year,
          is_default: paymentMethods.length === 0 // First payment method becomes default
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh payment methods
      await fetchPaymentMethods();

      return data;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  };

  const deletePaymentMethod = async (paymentMethodId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', paymentMethodId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // First, unset all default payment methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh payment methods
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchPaymentMethods(),
      fetchTransactions(),
      fetchWithdrawals(),
      fetchUserBalance()
    ]);
  };

  const payWithSavedMethod = async (amount: number, paymentMethodId?: string) => {
    if (!user) throw new Error('User not authenticated');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'mxn', paymentMethodId }),
    });
    if (!res.ok) throw new Error('Payment failed');
    return res.json();
  };

  return {
    paymentMethods,
    transactions,
    withdrawals,
    userBalance,
    loading,
    createPaymentIntent,
    createCheckoutSession,
    requestWithdrawal,
    savePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    refreshData,
    payWithSavedMethod
  };
};