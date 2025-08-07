import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StripeCheckout } from './StripeCheckout';
import { TransactionHistory } from './TransactionHistory';
import { SubscriptionStatus } from './SubscriptionStatus';
import { Wallet, CreditCard, History, Crown } from 'lucide-react';

interface UserBalance {
  balance: number;
  total_deposits: number;
  total_withdrawals: number;
}

export const BettingPanel: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('balance, total_deposits, total_withdrawals')
        .single();

      if (error) {
        console.error('Error fetching user balance:', error);
        setError('Failed to load balance');
      } else {
        setUserBalance(data);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchUserBalance(); // Refresh balance after successful payment
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="text-red-400 mb-4">Error loading balance</div>
        <button
          onClick={fetchUserBalance}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet size={24} className="text-green-400" />
            <h2 className="text-white text-xl font-bold">Balance</h2>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <CreditCard size={16} />
            <span>Add Funds</span>
          </button>
        </div>

        {userBalance && (
          <div className="space-y-3">
            <div className="text-3xl font-bold text-white">
              {formatCurrency(userBalance.balance)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-white/70">Total Deposits</div>
                <div className="text-green-400 font-medium">
                  {formatCurrency(userBalance.total_deposits)}
                </div>
              </div>
              
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-white/70">Total Withdrawals</div>
                <div className="text-red-400 font-medium">
                  {formatCurrency(userBalance.total_withdrawals)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Status */}
      <SubscriptionStatus />

      {/* Transaction History Toggle */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <button
          onClick={() => setShowTransactionHistory(!showTransactionHistory)}
          className="w-full flex items-center justify-between text-white hover:text-white/80 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <History size={20} />
            <span className="font-medium">Transaction History</span>
          </div>
          <div className="text-white/50">
            {showTransactionHistory ? 'Hide' : 'Show'}
          </div>
        </button>
      </div>

      {/* Transaction History */}
      {showTransactionHistory && (
        <TransactionHistory />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <StripeCheckout
          onClose={() => setShowPaymentModal(false)}
          amount={100} // Default amount, you can make this configurable
        />
      )}
    </div>
  );
};