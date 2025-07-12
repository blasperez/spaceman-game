import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GameHistory {
  id: string;
  user_id: string;
  game_id: string;
  bet_amount: number;
  multiplier: number;
  win_amount: number;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
}

export const useGameData = (userId: string | undefined) => {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchGameHistory();
    fetchTransactions();
  }, [userId]);

  const fetchGameHistory = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGameHistory(data || []);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGameResult = async (gameResult: {
    game_id: string;
    bet_amount: number;
    multiplier: number;
    win_amount: number;
  }) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('game_history')
        .insert({
          user_id: userId,
          ...gameResult
        });

      if (error) throw error;
      
      // Refresh game history
      await fetchGameHistory();
    } catch (error) {
      console.error('Error adding game result:', error);
      throw error;
    }
  };

  const addTransaction = async (transaction: {
    type: 'deposit' | 'withdrawal';
    amount: number;
    payment_method: string;
    status?: 'pending' | 'completed' | 'failed';
  }) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          status: 'pending',
          ...transaction
        });

      if (error) throw error;
      
      // Refresh transactions
      await fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  return {
    gameHistory,
    transactions,
    loading,
    addGameResult,
    addTransaction,
    refreshGameHistory: fetchGameHistory,
    refreshTransactions: fetchTransactions
  };
};
