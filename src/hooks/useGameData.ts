import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GameHistory {
  id: string;
  user_id: string;
  game_id: string;
  bet_amount: number;
  multiplier: number;
  win_amount: number;
  game_type: string;
  status: string;
  session_id?: string;
  metadata?: any;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  stripe_payment_id?: string;
  stripe_payment_method_id?: string;
  description?: string;
  fee_amount: number;
  net_amount: number;
  currency: string;
  metadata?: any;
  created_at: string;
}

interface GameStats {
  total_games: number;
  total_bets: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  highest_multiplier: number;
  average_bet: number;
  best_win: number;
}

export const useGameData = (userId: string | undefined) => {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchGameHistory();
    fetchTransactions();
    fetchGameStats();
  }, [userId]);

  const fetchGameHistory = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('id,user_id,game_id,bet_amount,win_amount,multiplier,game_type,status,session_id,metadata,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const normalized = (data || []).map((g: any) => ({
        ...g,
        bet_amount: Number(g.bet_amount) || 0,
        win_amount: Number(g.win_amount) || 0,
        multiplier: Number(g.multiplier) || 0,
      }));
      setGameHistory(normalized);
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
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchGameStats = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('bet_amount, win_amount, multiplier')
        .eq('user_id', userId);

      if (error) throw error;

      if (data && data.length > 0) {
        const normalized = data.map((g: any) => ({
          bet_amount: Number(g.bet_amount) || 0,
          win_amount: Number(g.win_amount) || 0,
          multiplier: Number(g.multiplier) || 0,
        }));
        const totalGames = normalized.length;
        const totalBets = normalized.reduce((sum, game) => sum + game.bet_amount, 0);
        const totalWins = normalized.reduce((sum, game) => sum + Math.max(0, game.win_amount - game.bet_amount), 0);
        const totalLosses = normalized.reduce((sum, game) => sum + Math.max(0, game.bet_amount - game.win_amount), 0);
        const winRate = (normalized.filter(g => g.win_amount > g.bet_amount).length / totalGames) * 100;
        const highestMultiplier = normalized.length ? Math.max(...normalized.map(g => g.multiplier)) : 0;
        const averageBet = totalGames ? totalBets / totalGames : 0;
        const bestWin = normalized.length ? Math.max(...normalized.map(g => g.win_amount - g.bet_amount)) : 0;

        setGameStats({
          total_games: totalGames,
          total_bets: totalBets,
          total_wins: totalWins,
          total_losses: totalLosses,
          win_rate: winRate,
          highest_multiplier: highestMultiplier,
          average_bet: averageBet,
          best_win: bestWin
        });
      } else {
        setGameStats({
          total_games: 0,
          total_bets: 0,
          total_wins: 0,
          total_losses: 0,
          win_rate: 0,
          highest_multiplier: 0,
          average_bet: 0,
          best_win: 0
        });
      }
    } catch (error) {
      console.error('Error fetching game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGameResult = async (gameResult: {
    game_id: string;
    bet_amount: number;
    multiplier: number;
    win_amount: number;
    game_type?: string;
    session_id?: string;
    metadata?: any;
  }) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('game_history')
        .insert({
          user_id: userId,
          game_type: gameResult.game_type || 'spaceman',
          status: 'completed',
          session_id: gameResult.session_id,
          metadata: gameResult.metadata,
          ...gameResult
        });

      if (error) throw error;
      
      // Refresh game history and stats
      await Promise.all([
        fetchGameHistory(),
        fetchGameStats()
      ]);
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
    stripe_payment_id?: string;
    stripe_payment_method_id?: string;
    description?: string;
    fee_amount?: number;
    net_amount?: number;
    currency?: string;
    metadata?: any;
  }) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          status: 'pending',
          fee_amount: 0,
          currency: 'usd',
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

  const updateUserBalance = async (amount: number, type: 'add' | 'subtract') => {
    if (!userId) return;

    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('balance, total_deposits, total_withdrawals')
        .eq('id', userId)
        .single();

      if (!currentProfile) throw new Error('User profile not found');

      const newBalance = type === 'add' 
        ? currentProfile.balance + amount 
        : currentProfile.balance - amount;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  };

  const getRecentGames = (limit: number = 10) => {
    return gameHistory.slice(0, limit);
  };

  const getGameStats = () => {
    return gameStats;
  };

  const getTransactionHistory = () => {
    return transactions;
  };

  const getGameHistory = () => {
    return gameHistory;
  };

  return {
    gameHistory,
    transactions,
    gameStats,
    loading,
    addGameResult,
    addTransaction,
    updateUserBalance,
    getRecentGames,
    getGameStats,
    getTransactionHistory,
    getGameHistory,
    refreshGameHistory: fetchGameHistory,
    refreshTransactions: fetchTransactions,
    refreshGameStats: fetchGameStats
  };
};
