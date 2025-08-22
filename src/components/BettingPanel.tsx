import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StripeCheckout } from './StripeCheckout';
import { TransactionHistory } from './TransactionHistory';
import { SubscriptionStatus } from './SubscriptionStatus';
import { Wallet, CreditCard, History, Crown, Zap, TrendingUp, Coins } from 'lucide-react';

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
  const [balanceAnimation, setBalanceAnimation] = useState(false);

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
        // Trigger balance animation
        setBalanceAnimation(true);
        setTimeout(() => setBalanceAnimation(false), 1000);
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
      <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-white/20 to-white/10 rounded-lg mb-6"></div>
          <div className="h-6 bg-gradient-to-r from-white/20 to-white/10 rounded-lg mb-4"></div>
          <div className="h-6 bg-gradient-to-r from-white/20 to-white/10 rounded-lg w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-xl border border-red-400/30 rounded-2xl p-8 shadow-2xl">
        <div className="text-red-300 mb-6 text-lg font-semibold flex items-center">
          <Zap className="mr-2" />
          Error loading balance
        </div>
        <button
          onClick={fetchUserBalance}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Balance Card */}
      <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl border border-green-400/30">
                <Wallet size={28} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Balance</h2>
                <p className="text-green-300 text-sm">Available funds</p>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <CreditCard size={18} />
              <span>Deposit</span>
            </button>
          </div>

          {/* Enhanced Balance Display */}
          <div className={`text-center p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/20 transition-all duration-500 ${balanceAnimation ? 'scale-105 bg-gradient-to-r from-green-500/20 to-blue-500/20' : ''}`}>
            <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {formatCurrency(userBalance?.balance || 0)}
            </div>
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-1 text-green-300">
                <TrendingUp size={14} />
                <span>Total Deposits: {formatCurrency(userBalance?.total_deposits || 0)}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-300">
                <Coins size={14} />
                <span>Total Withdrawals: {formatCurrency(userBalance?.total_withdrawals || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowTransactionHistory(true)}
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 backdrop-blur-xl border border-blue-400/30 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 shadow-lg group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-lg border border-blue-400/30 group-hover:scale-110 transition-transform duration-300">
              <History size={24} className="text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="text-white text-lg font-semibold">Transaction History</h3>
              <p className="text-blue-300 text-sm">View your betting history</p>
            </div>
          </div>
        </button>

        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-yellow-400/30 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-lg border border-yellow-400/30">
              <Crown size={24} className="text-yellow-400" />
            </div>
            <div className="text-left">
              <h3 className="text-white text-lg font-semibold">VIP Status</h3>
              <p className="text-yellow-300 text-sm">Premium features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-400/20 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-2">
            {formatCurrency(userBalance?.total_deposits || 0)}
          </div>
          <div className="text-green-300 text-sm">Total Deposits</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-400/20 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {formatCurrency(userBalance?.total_withdrawals || 0)}
          </div>
          <div className="text-blue-300 text-sm">Total Withdrawals</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-400/20 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-2">
            {formatCurrency((userBalance?.total_deposits || 0) - (userBalance?.total_withdrawals || 0))}
          </div>
          <div className="text-purple-300 text-sm">Net Profit</div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <StripeCheckout onSuccess={handlePaymentSuccess} onCancel={() => setShowPaymentModal(false)} />
          </div>
        </div>
      )}

      {showTransactionHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <TransactionHistory onClose={() => setShowTransactionHistory(false)} />
          </div>
        </div>
      )}
    </div>
  );
};