import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, Download, Upload, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  stripe_payment_id?: string;
}

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setError(null);
        
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching transactions:', error);
          setError('Failed to load transaction history');
        } else {
          setTransactions(data || []);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Download size={16} className="text-green-400" />;
      case 'withdrawal':
        return <Upload size={16} className="text-red-400" />;
      default:
        return <CreditCard size={16} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <h3 className="text-white font-medium mb-4">Transaction History</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <h3 className="text-white font-medium mb-4">Transaction History</h3>
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <span className="text-white/70">{error}</span>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
        <h3 className="text-white font-medium mb-4">Transaction History</h3>
        <div className="text-center py-8">
          <CreditCard size={48} className="text-white/30 mx-auto mb-4" />
          <p className="text-white/50">No transactions yet</p>
          <p className="text-white/30 text-sm">Your transaction history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
      <h3 className="text-white font-medium mb-4">Transaction History</h3>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              {getTransactionIcon(transaction.type)}
              <div>
                <div className="text-white font-medium capitalize">
                  {transaction.type}
                </div>
                <div className="text-white/50 text-sm">
                  {formatDate(transaction.created_at)}
                </div>
                {transaction.payment_method && (
                  <div className="text-white/40 text-xs capitalize">
                    {transaction.payment_method}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-medium ${transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.type === 'deposit' ? '+' : '-'}{formatAmount(transaction.amount)}
              </div>
              <div className={`text-xs ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};