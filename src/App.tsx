import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase'
import EnhancedGameBoard from './components/EnhancedGameBoard';
import { Statistics } from './components/Statistics';
import { Chat } from './components/Chat';
import { LoginScreen } from './components/LoginScreen';
import { AccountPanel } from './components/AccountPanel';
import { AutoBotPanel } from './components/AutoBotPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useGameSocket } from './hooks/useGameSocket';
import { Menu, BarChart3, Settings, Users, Maximize, Volume2, VolumeX, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { MobileBettingPanel } from './components/MobileBettingPanel';

interface GameHistory {
  id: number;
  multiplier: number;
  betAmount: number;
  winAmount: number;
  timestamp: Date;
}

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system';
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'facebook' | 'twitter' | 'demo';
  balance: number;
  isDemo: boolean;
  // Casino specific fields
  age?: number;
  country?: string;
  phone?: string;
  kyc_verified?: boolean;
  withdrawal_methods?: any[];
  deposit_limit?: number;
  withdrawal_limit?: number;
  total_deposits?: number;
  total_withdrawals?: number;
  games_played?: number;
  total_wagered?: number;
  total_won?: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  email?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

interface AutoBotConfig {
  isActive: boolean;
  autoCashOut: number;
  betAmount: number;
  maxRounds: number;
  maxLoss: number;
  maxWin: number;
  currentRounds: number;
  totalProfit: number;
  strategy: 'fixed' | 'martingale' | 'fibonacci';
  stopOnWin: boolean;
  stopOnLoss: boolean;
}

function App() {
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAutoBotPanel, setShowAutoBotPanel] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Mobile orientation detection
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Game state
  const [balance, setBalance] = useState(1000.00);
  const [betAmount, setBetAmount] = useState(5);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [currentBet, setCurrentBet] = useState(0);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [betLocked, setBetLocked] = useState(false);
  const [nextRoundBet, setNextRoundBet] = useState<number | null>(null); // For betting on next round
  
  // WebSocket connection for multiplayer
  const { gameData, isConnected, connectionStatus, placeBet, cashOut, reconnect } = useGameSocket(
    user?.id || '',
    user?.name || ''
  );
  
  // Auto Bot Configuration
  const [autoBotConfig, setAutoBotConfig] = useState<AutoBotConfig>({
    isActive: false,
    autoCashOut: 2.0,
    betAmount: 5,
    maxRounds: 10,
    maxLoss: 100,
    maxWin: 200,
    currentRounds: 0,
    totalProfit: 0,
    strategy: 'fixed',
    stopOnWin: true,
    stopOnLoss: true
  });

  // Auto Bet States
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [autoBetAmount] = useState(5);
  const [autoCashOut, setAutoCashOut] = useState(2.00);
  const [autoCashOut50] = useState(1.50);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(false);
  const [autoCashOut50Enabled, setAutoCashOut50Enabled] = useState(false);

  // Recent multipliers for statistics
  const [recentMultipliers, setRecentMultipliers] = useState<number[]>([
    1.77, 1.22, 1.34, 1.47, 46.55, 4.98, 9.22, 1.03, 154.88, 1.15, 
    1.05, 1.64, 25.92, 1.94, 1.53, 1.41, 39.83, 4.05, 3.67
  ]);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      username: 'Sistema',
      message: '¡Bienvenido a Spaceman Multijugador! ¡Buena suerte!',
      timestamp: new Date(),
      type: 'system'
    }
  ]);

  // Mock payment methods and transactions
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // FIXED: Improved session checking with timeout
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('⏰ Session check timeout, proceeding without session');
          setIsLoading(false);
          setSessionChecked(true);
        }, 5000);

        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Session check error:', error);
          setIsLoading(false);
          setSessionChecked(true);
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          
          // Load or create profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Profile fetch error:', profileError);
          }

          let userProfile: UserProfile;

          if (profile) {
            userProfile = {
              id: profile.id,
              name: profile.full_name || session.user.user_metadata?.full_name || 'Usuario',
              email: profile.email || session.user.email || '',
              avatar: profile.avatar_url || session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'Usuario')}&background=random`,
              provider: profile.provider || 'google',
              balance: profile.balance || 1000,
              isDemo: false,
              age: profile.age,
              country: profile.country,
              phone: profile.phone,
              kyc_verified: profile.kyc_verified || false,
              withdrawal_methods: profile.withdrawal_methods || [],
              deposit_limit: profile.deposit_limit || 1000,
              withdrawal_limit: profile.withdrawal_limit || 1000,
              total_deposits: profile.total_deposits || 0,
              total_withdrawals: profile.total_withdrawals || 0,
              games_played: profile.games_played || 0,
              total_wagered: profile.total_wagered || 0,
              total_won: profile.total_won || 0
            };
          } else {
            // Create basic profile if doesn't exist
            userProfile = {
              id: session.user.id,
              name: session.user.user_metadata?.full_name || 'Usuario',
              email: session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || 'Usuario')}&background=random`,
              provider: 'google',
              balance: 1000,
              isDemo: false
            };
            
            // Try to create profile in background
            try {
              await supabase.from('profiles').insert([{
                id: userProfile.id,
                email: userProfile.email,
                full_name: userProfile.name,
                avatar_url: userProfile.avatar,
                balance: userProfile.balance
              }]);
            } catch (insertError) {
              console.warn('⚠️ Could not create profile:', insertError);
            }
          }

          setUser(userProfile);
          setBalance(userProfile.balance);
          console.log('✅ User profile loaded successfully');
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('💥 Session check failed:', error);
      } finally {
        setIsLoading(false);
        setSessionChecked(true);
      }
    };
    
    if (!sessionChecked) {
      checkExistingSession();
    }
  }, [sessionChecked]);

  // FIXED: Improved auth state listener
  useEffect(() => {
    if (!sessionChecked) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const userProfile: UserProfile = {
              id: profile.id,
              name: profile.full_name || session.user.user_metadata?.full_name || 'Usuario',
              email: profile.email || session.user.email || '',
              avatar: profile.avatar_url || session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'Usuario')}&background=random`,
              provider: profile.provider || 'google',
              balance: profile.balance || 1000.00,
              isDemo: false,
              age: profile.age,
              country: profile.country,
              phone: profile.phone,
              kyc_verified: profile.kyc_verified || false,
              withdrawal_methods: profile.withdrawal_methods || [],
              deposit_limit: profile.deposit_limit || 1000,
              withdrawal_limit: profile.withdrawal_limit || 1000,
              total_deposits: profile.total_deposits || 0,
              total_withdrawals: profile.total_withdrawals || 0,
              games_played: profile.games_played || 0,
              total_wagered: profile.total_wagered || 0,
              total_won: profile.total_won || 0
            };
            
            setUser(userProfile);
            setBalance(userProfile.balance);
          }
        } catch (error) {
          console.error('❌ Error loading profile after sign in:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setBalance(1000.00);
        setGameHistory([]);
        setTransactions([]);
        setPaymentMethods([]);
        setAutoBotConfig(prev => ({ ...prev, isActive: false, currentRounds: 0, totalProfit: 0 }));
        setAutoBetEnabled(false);
        setHasActiveBet(false);
        setCurrentBet(0);
        setHasCashedOut(false);
        setBetLocked(false);
        setNextRoundBet(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [sessionChecked]);

  // Save user data to database when balance changes
  useEffect(() => {
    if (user && !user.isDemo && sessionChecked) {
      const saveUserData = async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              balance: balance,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (error) {
            console.error('❌ Error saving user data:', error);
          }
        } catch (error) {
          console.error('❌ Error saving user data:', error);
        }
      };
      
      // Debounce the save operation
      const timeoutId = setTimeout(saveUserData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [balance, user, sessionChecked]);

  // Save game history to database
  const saveGameHistory = async (gameHistory: GameHistory) => {
    if (user && !user.isDemo) {
      try {
        const { error } = await supabase
          .from('game_history')
          .insert([{
            user_id: user.id,
            game_id: gameData.gameState.gameId,
            bet_amount: gameHistory.betAmount,
            multiplier: gameHistory.multiplier,
            win_amount: gameHistory.winAmount
          }]);
        
        if (error) {
          console.error('❌ Error saving game history:', error);
        }
      } catch (error) {
        console.error('❌ Error saving game history:', error);
      }
    }
  };

  // Mobile detection and orientation
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      
      setIsMobile(isMobileDevice);
      setIsLandscape(isLandscapeMode);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100);
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Update recent multipliers when game crashes
  useEffect(() => {
    if (gameData.gameState.phase === 'crashed' && gameData.gameState.crashPoint) {
      setRecentMultipliers(prev => [...prev, gameData.gameState.crashPoint!].slice(-50));
    }
  }, [gameData.gameState.phase, gameData.gameState.crashPoint]);

  // FIXED: Reset bet state when game phase changes with next round betting
  useEffect(() => {
    if (gameData.gameState.phase === 'waiting' && gameData.gameState.countdown <= 20 && gameData.gameState.countdown > 0) {
      // Handle next round bet
      if (nextRoundBet && nextRoundBet <= balance && !hasActiveBet && !betLocked) {
        const safeBetAmount = Math.min(nextRoundBet, balance);
        
        setBetLocked(true);
        placeBet(safeBetAmount);
        setBalance(prev => prev - safeBetAmount);
        setCurrentBet(safeBetAmount);
        setHasActiveBet(true);
        setHasCashedOut(false);
        setNextRoundBet(null);
        
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: user?.name || 'Jugador',
          message: `🚀 Apuesta automática de ${safeBetAmount.toFixed(0)} monedas para la nueva ronda`,
          timestamp: new Date(),
          type: 'user'
        }]);
        
        setTimeout(() => setBetLocked(false), 1000);
      } else {
        // Reset bet state for new round
        setHasActiveBet(false);
        setCurrentBet(0);
        setHasCashedOut(false);
        setBetLocked(false);
      }
    } else if (gameData.gameState.phase === 'crashed') {
      // Handle crash - lose bet if not cashed out
      if (hasActiveBet && !hasCashedOut) {
        const lostGame: GameHistory = {
          id: Date.now(),
          multiplier: gameData.gameState.crashPoint || gameData.gameState.multiplier,
          betAmount: currentBet,
          winAmount: 0,
          timestamp: new Date()
        };
        
        setGameHistory(prev => [...prev, lostGame]);
        saveGameHistory(lostGame);
        
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: user?.name || 'Jugador',
          message: `💥 Perdido en ${(gameData.gameState.crashPoint || gameData.gameState.multiplier).toFixed(2)}x - ${currentBet.toFixed(0)} monedas`,
          timestamp: new Date(),
          type: 'user'
        }]);
      }
      
      // Reset for next round
      setTimeout(() => {
        setHasActiveBet(false);
        setCurrentBet(0);
        setHasCashedOut(false);
        setBetLocked(false);
      }, 2000);
    }
  }, [gameData.gameState.phase, gameData.gameState.crashPoint, hasActiveBet, hasCashedOut, currentBet, user?.name, nextRoundBet, balance, betLocked, placeBet]);

  // Auto cash out logic for multiplayer
  useEffect(() => {
    if (!hasActiveBet || gameData.gameState.phase !== 'flying' || hasCashedOut || betLocked) return;
    
    const currentMultiplier = gameData.gameState.multiplier;
    
    // Auto Bot cash out
    if (autoBotConfig.isActive && currentMultiplier >= autoBotConfig.autoCashOut) {
      handleCashOut();
      return;
    }
    
    // Regular auto cash out
    if (autoCashOutEnabled && currentMultiplier >= autoCashOut) {
      handleCashOut();
      return;
    }
    
    // 50% auto cash out
    if (autoCashOut50Enabled && currentMultiplier >= autoCashOut50) {
      const halfBet = currentBet / 2;
      const halfWinnings = halfBet * currentMultiplier;
      
      setBalance(prev => prev + halfWinnings);
      setCurrentBet(prev => prev - halfBet);
      
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        username: user?.name || 'Jugador',
        message: `💰 50% Auto Cashout en ${currentMultiplier.toFixed(2)}x por ${halfWinnings.toFixed(0)} monedas!`,
        timestamp: new Date(),
        type: 'user'
      }]);
      
      setAutoCashOut50Enabled(false);
    }
  }, [gameData.gameState.multiplier, gameData.gameState.phase, hasActiveBet, autoBotConfig, autoCashOutEnabled, autoCashOut, autoCashOut50Enabled, autoCashOut50, currentBet, user?.name, hasCashedOut, betLocked]);

  // Auto betting logic for multiplayer
  useEffect(() => {
    if (autoBetEnabled && !autoBotConfig.isActive && gameData.gameState.phase === 'waiting' && !hasActiveBet && !betLocked && gameData.gameState.countdown <= 5 && gameData.gameState.countdown > 0) {
      if (autoBetAmount > balance) {
        setAutoBetEnabled(false);
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: 'Sistema',
          message: `🤖 Apuesta automática detenida: Saldo insuficiente`,
          timestamp: new Date(),
          type: 'system'
        }]);
        return;
      }
      
      handlePlaceBet();
    }
  }, [autoBetEnabled, autoBotConfig.isActive, gameData.gameState.phase, hasActiveBet, betLocked, gameData.gameState.countdown, autoBetAmount, balance]);

  // Bet amount control functions
  const increaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive && !betLocked && gameData.gameState.phase === 'waiting') {
      setBetAmount(prev => Math.min(prev + 1, balance));
    }
  };

  const decreaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive && !betLocked && gameData.gameState.phase === 'waiting') {
      setBetAmount(prev => Math.max(prev - 1, 1));
    }
  };

  const handleButtonPress = (action: () => void) => {
    action();
  };

  // Auth functions
  const handleLogin = (userProfile: UserProfile) => {
    setUser(userProfile);
    setBalance(userProfile.balance);
  };

  const handleDemoMode = () => {
    const demoUser: UserProfile = {
      id: 'demo_user',
      name: 'Jugador Demo',
      email: 'demo@spaceman.com',
      avatar: 'https://ui-avatars.com/api/?name=Demo+Player&background=6366f1',
      provider: 'demo',
      balance: 1000.00,
      isDemo: true
    };
    setUser(demoUser);
    setBalance(1000.00);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
      }
    } catch (error) {
      console.error('❌ Logout exception:', error);
    }
    
    // Reset local state
    setUser(null);
    setShowAccountPanel(false);
    setBalance(1000.00);
    setGameHistory([]);
    setTransactions([]);
    setPaymentMethods([]);
    setAutoBotConfig(prev => ({ ...prev, isActive: false, currentRounds: 0, totalProfit: 0 }));
    setAutoBetEnabled(false);
    setHasActiveBet(false);
    setCurrentBet(0);
    setHasCashedOut(false);
    setBetLocked(false);
    setNextRoundBet(null);
  };

  // Payment functions
  const handleAddPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Date.now().toString()
    };
    setPaymentMethods(prev => [...prev, newMethod]);
  };

  const handleDeposit = (amount: number, methodId: string) => {
    if (user?.isDemo) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      method: 'Compra rápida',
      status: 'completed',
      timestamp: new Date()
    };

    // Save to Supabase
    (async () => {
      try {
        await supabase.from('transactions').insert([
          {
            user_id: user?.id,
            type: 'deposit',
            amount,
            status: 'completed',
            payment_method: 'Compra rápida'
          }
        ]);
      } catch (e) {
        console.error('❌ Error inserting deposit transaction', e);
      }
    })();

    setTransactions(prev => [...prev, transaction]);
    setBalance(prev => prev + amount);
    if (user) {
      setUser({ 
        ...user, 
        balance: user.balance + amount,
        total_deposits: (user.total_deposits || 0) + amount
      });
    }
  };

  const handleWithdrawal = (amount: number, method: string) => {
    if (!user || user.isDemo || amount > balance) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      method,
      status: 'pending',
      timestamp: new Date()
    };

    // Save to Supabase
    (async () => {
      try {
        await supabase.from('transactions').insert([
          {
            user_id: user.id,
            type: 'withdrawal',
            amount,
            status: 'pending',
            payment_method: method
          }
        ]);
      } catch (e) {
        console.error('❌ Error inserting withdrawal transaction', e);
      }
    })();

    setTransactions(prev => [...prev, transaction]);
    setBalance(prev => prev - amount);
    if (user) {
      setUser({ 
        ...user, 
        balance: user.balance - amount,
        total_withdrawals: (user.total_withdrawals || 0) + amount
      });
    }
  };

  // FIXED: Improved multiplayer game functions with next round betting
  const handlePlaceBet = () => {
    if (gameData.gameState.phase === 'waiting' && gameData.gameState.countdown > 0 && gameData.gameState.countdown <= 20 && betAmount <= balance && !hasActiveBet && !betLocked && !autoBotConfig.isActive) {
      const safeBetAmount = Math.min(betAmount, balance);
      
      // Lock betting to prevent double bets
      setBetLocked(true);
      
      // Place bet via WebSocket
      placeBet(safeBetAmount);
      
      // Update local state
      setBalance(prev => prev - safeBetAmount);
      setCurrentBet(safeBetAmount);
      setHasActiveBet(true);
      setHasCashedOut(false);
      
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        username: user?.name || 'Jugador',
        message: `🚀 Apuesta colocada de ${safeBetAmount.toFixed(0)} monedas`,
        timestamp: new Date(),
        type: 'user'
      }]);
      
      // Unlock after a short delay
      setTimeout(() => setBetLocked(false), 1000);
    } else {
      // Show message when betting is not allowed
      if (gameData.gameState.phase !== 'waiting') {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: 'Sistema',
          message: `⚠️ Solo puedes apostar durante la ventana de apuestas (20 segundos)`,
          timestamp: new Date(),
          type: 'system'
        }]);
      }
    }
  };

  const handleCashOut = useCallback(() => {
    if (hasActiveBet && gameData.gameState.phase === 'flying' && gameData.gameState.multiplier >= 1 && !hasCashedOut && !betLocked) {
      // Lock to prevent double cash out
      setBetLocked(true);
      
      // Cash out via WebSocket
      cashOut();
      
      const totalWinnings = currentBet * gameData.gameState.multiplier;
      
      setBalance(prev => prev + totalWinnings);
      setHasCashedOut(true);
      
      const newGame: GameHistory = {
        id: Date.now(),
        multiplier: gameData.gameState.multiplier,
        betAmount: currentBet,
        winAmount: totalWinnings,
        timestamp: new Date()
      };
      
      setGameHistory(prev => [...prev, newGame]);
      
      // Save game history to database
      saveGameHistory(newGame);
      
      const netProfit = totalWinnings - currentBet;
      
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        username: user?.name || 'Jugador',
        message: `💰 ¡Retirado en ${gameData.gameState.multiplier.toFixed(2)}x por ${totalWinnings.toFixed(0)} monedas! (Ganancia neta: ${netProfit.toFixed(0)} monedas)`,
        timestamp: new Date(),
        type: 'user'
      }]);
      
      // Unlock after delay
      setTimeout(() => setBetLocked(false), 1000);
    }
  }, [hasActiveBet, gameData.gameState.phase, currentBet, gameData.gameState.multiplier, user?.name, hasCashedOut, betLocked, cashOut, saveGameHistory]);

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now(),
      username: user?.name || 'Jugador',
      message,
      timestamp: new Date(),
      type: 'user'
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Game state calculations
  const canBet = gameData.gameState.phase === 'waiting' && gameData.gameState.countdown > 0 && gameData.gameState.countdown <= 20 && !hasActiveBet && betAmount <= balance && !autoBotConfig.isActive && !autoBetEnabled && !betLocked;
  const canCashOut = hasActiveBet && gameData.gameState.phase === 'flying' && gameData.gameState.multiplier >= 1 && !hasCashedOut && !betLocked;
  const currentWin = hasActiveBet ? currentBet * gameData.gameState.multiplier : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onDemoMode={handleDemoMode} />;
  }

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden space-background ${
        isLandscape ? 'landscape-mode' : 'portrait-mode'
      }`}>
        {/* Space Background Animations */}
        <div className="stars"></div>
        <div className="planet planet-1"></div>
        <div className="planet planet-2"></div>
        <div className="planet planet-3"></div>
        <div className="spaceship"></div>
        <div className="meteor"></div>
        <div className="meteor"></div>
        <div className="meteor"></div>
        <div className="meteor"></div>
        <div className="meteor"></div>
        <div className="nebula"></div>
        <div className="nebula"></div>

        {/* Enhanced Game Board - Mobile Full Screen */}
        <div className="absolute inset-0">
          <EnhancedGameBoard
            multiplier={gameData.gameState.multiplier}
            gamePhase={gameData.gameState.phase}
            countdown={gameData.gameState.countdown}
            soundEnabled={soundEnabled}
            onSoundToggle={() => setSoundEnabled(!soundEnabled)}
            balance={balance}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            onPlaceBet={handlePlaceBet}
            onCashOut={handleCashOut}
            canBet={canBet}
            canCashOut={canCashOut}
            hasActiveBet={hasActiveBet}
            currentWin={currentWin}
            autoCashOutEnabled={autoCashOutEnabled}
            setAutoCashOutEnabled={setAutoCashOutEnabled}
            autoCashOut={autoCashOut}
            setAutoCashOut={setAutoCashOut}
          />
        </div>

        {/* MOBILE Top Header - Compact */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10 p-2">
          <div className="flex items-center justify-between">
            {/* Left - Balance & User */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAccountPanel(true)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 transition-colors"
              >
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
                <div className="text-left">
                  <div className="text-white text-xs font-medium">{balance.toFixed(0)} monedas</div>
                  {user.isDemo && <div className="text-purple-300 text-xs">Demo</div>}
                </div>
              </button>
            </div>

            {/* Center - Connection Status */}
            <ConnectionStatus
              isConnected={isConnected}
              connectionStatus={connectionStatus}
              onReconnect={reconnect}
            />

            {/* Right - Controls */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 backdrop-blur-md border border-white/20 rounded-lg transition-colors ${
                  soundEnabled 
                    ? 'bg-green-500/20 hover:bg-green-500/30 border-green-400/30' 
                    : 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 size={16} className="text-green-400" />
                ) : (
                  <VolumeX size={16} className="text-red-400" />
                )}
              </button>
              
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg transition-colors"
              >
                <Menu size={16} className="text-white" />
              </button>
            </div>
          </div>
        </header>

        {/* MOBILE Side Menu */}
        {showMobileMenu && (
          <div className="absolute top-16 right-2 z-50 bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-3 space-y-2">
            <button
              onClick={() => {
                setShowStatistics(!showStatistics);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center space-x-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
            >
              <BarChart3 size={16} />
              <span>Estadísticas</span>
            </button>
            
            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center space-x-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
            >
              <Users size={16} />
              <span>Chat</span>
            </button>
          </div>
        )}

        {/* Recent Multipliers - Top of screen */}
        <div className="absolute top-16 left-0 right-0 z-30 p-2">
          <div className="flex items-center justify-center space-x-1 overflow-x-auto">
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              gameData.gameState.phase === 'flying' ? 'bg-green-500/80 text-white' : 
              gameData.gameState.phase === 'crashed' ? 'bg-red-500/80 text-white' : 
              'bg-yellow-500/80 text-black'
            }`}>
              {gameData.gameState.phase === 'flying' ? 'VOLANDO' : 
               gameData.gameState.phase === 'crashed' ? 'ESTRELLADO' : 
               'ESPERANDO'}
            </div>
            {recentMultipliers.slice(-8).reverse().map((mult, index) => (
              <div
                key={index}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  mult < 1.5 ? 'bg-red-500/80 text-white' :
                  mult < 2 ? 'bg-yellow-500/80 text-black' :
                  mult < 5 ? 'bg-green-500/80 text-white' :
                  'bg-purple-500/80 text-white'
                }`}
              >
                {mult.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        {/* Next Round Bet Indicator */}
        {nextRoundBet && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40">
            <div className="bg-blue-500/80 backdrop-blur-md border border-blue-400/30 rounded-xl px-4 py-2">
              <div className="text-white text-sm font-medium">
                ⏳ Próxima ronda: {nextRoundBet.toFixed(0)} monedas
              </div>
            </div>
          </div>
        )}

        {/* NEW Mobile Betting Panel */}
        <MobileBettingPanel
          balance={balance}
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          onPlaceBet={handlePlaceBet}
          onCashOut={handleCashOut}
          canBet={canBet}
          canCashOut={canCashOut}
          currentWin={currentWin}
          autoCashOut={autoCashOut}
          setAutoCashOut={setAutoCashOut}
          hasActiveBet={hasActiveBet}
          gamePhase={gameData.gameState.phase}
          currentBet={currentBet}
          autoBotConfig={autoBotConfig}
          autoCashOutEnabled={autoCashOutEnabled}
          setAutoCashOutEnabled={setAutoCashOutEnabled}
          multiplier={gameData.gameState.multiplier}
          onShowAutoBotPanel={() => setShowAutoBotPanel(true)}
        />

        {/* MOBILE Modals */}
        {showStatistics && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="h-full overflow-y-auto p-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Estadísticas</h3>
                  <button
                    onClick={() => setShowStatistics(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
                <Statistics gameHistory={gameHistory} recentMultipliers={recentMultipliers} />
              </div>
            </div>
          </div>
        )}

        {showChat && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="h-full overflow-y-auto p-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Chat Global</h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
                <Chat 
                  messages={chatMessages} 
                  onSendMessage={handleSendMessage} 
                  username={user?.name || 'Jugador'} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Auto Bot Panel */}
        {showAutoBotPanel && (
          <AutoBotPanel
            config={autoBotConfig}
            onConfigChange={setAutoBotConfig}
            onClose={() => setShowAutoBotPanel(false)}
            balance={balance}
          />
        )}

        {/* Account Panel */}
        {showAccountPanel && (
          <AccountPanel
            user={user}
            balance={balance}
            gameHistory={gameHistory}
            transactions={transactions}
            paymentMethods={paymentMethods}
            onClose={() => setShowAccountPanel(false)}
            onLogout={handleLogout}
            onAddPaymentMethod={handleAddPaymentMethod}
            onDeposit={handleDeposit}
            onWithdrawal={handleWithdrawal}
            autoCashOutEnabled={autoCashOutEnabled}
            setAutoCashOutEnabled={setAutoCashOutEnabled}
            autoCashOut={autoCashOut}
            setAutoCashOut={setAutoCashOut}
          />
        )}
      </div>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden space-background">
      {/* Space Background Animations */}
      <div className="stars"></div>
      <div className="planet planet-1"></div>
      <div className="planet planet-2"></div>
      <div className="planet planet-3"></div>
      <div className="spaceship"></div>
      <div className="meteor"></div>
      <div className="meteor"></div>
      <div className="meteor"></div>
      <div className="meteor"></div>
      <div className="meteor"></div>
      <div className="nebula"></div>
      <div className="nebula"></div>
      
      {/* FULL SCREEN Game Board */}
      <div className="absolute inset-0">
        <MultiplayerGameBoard
          gameState={gameData.gameState}
          activeBets={gameData.activeBets}
          totalPlayers={gameData.totalPlayers}
          isConnected={isConnected}
          currentUserId={user.id}
        />
      </div>

      {/* Top Header Bar - Horizontal Layout */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10 p-2">
        <div className="flex items-center justify-between">
          {/* Left Side - Game Info */}
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              <div>Spaceman Multijugador 1 - 100 monedas</div>
              <div className="text-xs text-white/70">Jugador: {user.name}</div>
            </div>
          </div>

          {/* Center - Connection Status */}
          <ConnectionStatus
            isConnected={isConnected}
            connectionStatus={connectionStatus}
            onReconnect={reconnect}
          />

          {/* Right Side - Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowChat(!showChat)}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg transition-colors"
            >
              <Users size={16} className="text-white" />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 backdrop-blur-md border border-white/20 rounded-lg transition-colors ${
                soundEnabled 
                  ? 'bg-green-500/20 hover:bg-green-500/30 border-green-400/30' 
                  : 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30'
              }`}
            >
              {soundEnabled ? (
                <Volume2 size={16} className="text-green-400" />
              ) : (
                <VolumeX size={16} className="text-red-400" />
              )}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg transition-colors"
            >
              <Maximize size={16} className="text-white" />
            </button>
            <button 
              onClick={() => setShowAccountPanel(true)}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg transition-colors"
            >
              <Settings size={16} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Left Side Panel - Balance */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 space-y-3">
        <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-3">
          <div className="text-white/70 text-xs">Balance</div>
          <div className="text-white font-bold">{balance.toFixed(0)} monedas</div>
          <div className="text-white/60 text-xs">≈ ${balance.toFixed(0)} MXN</div>
        </div>
      </div>

      {/* Next Round Bet Indicator */}
      {nextRoundBet && (
        <div className="absolute left-4 top-1/3 z-40">
          <div className="bg-blue-500/80 backdrop-blur-md border border-blue-400/30 rounded-xl p-3">
            <div className="text-white/70 text-xs">Próxima Ronda</div>
            <div className="text-white font-bold">{nextRoundBet.toFixed(0)} monedas</div>
          </div>
        </div>
      )}

      {/* Chat Panel - Desktop */}
      {showChat && (
        <div className="absolute right-4 top-20 bottom-20 z-40 w-80">
          <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-white font-bold">Chat Global</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="h-full">
              <Chat 
                messages={chatMessages} 
                onSendMessage={handleSendMessage} 
                username={user?.name || 'Jugador'} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls - Horizontal Layout */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Left - Bet Amount Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setBetAmount(1)}
                disabled={hasActiveBet || autoBotConfig.isActive || betLocked}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                1
              </button>
              <button 
                onClick={() => setBetAmount(5)}
                disabled={hasActiveBet || autoBotConfig.isActive || betLocked}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                5
              </button>
              <button 
                onClick={() => handleButtonPress(decreaseBet)}
                disabled={hasActiveBet || autoBotConfig.isActive || betLocked}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded text-white font-bold flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="bg-purple-500/80 px-4 py-2 rounded-xl">
                <div className="text-white/80 text-xs">Bet</div>
                <div className="text-white font-bold">{betAmount} monedas</div>
              </div>
              <button 
                onClick={() => handleButtonPress(increaseBet)}
                disabled={hasActiveBet || autoBotConfig.isActive || betLocked}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded text-white font-bold flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setBetAmount(10)}
                disabled={hasActiveBet || autoBotConfig.isActive || betLocked}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                10
              </button>
              <button 
                onClick={() => setBetAmount(25)}
                disabled={hasActiveBet || autoBotConfig.isActive || betLocked}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                25
              </button>
            </div>
          </div>

          {/* Center - Main Action Button */}
          <div className="flex items-center space-x-4">
            <button className="p-2 bg-white/20 hover:bg-white/30 rounded">
              <BarChart3 size={20} className="text-white" />
            </button>
            
            <button
              onClick={canCashOut ? handleCashOut : handlePlaceBet}
              disabled={!canBet && !canCashOut}
              className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${
                canCashOut 
                  ? 'bg-green-500/80 hover:bg-green-600/80' 
                  : canBet
                  ? 'bg-green-500/80 hover:bg-green-600/80'
                  : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              {canCashOut ? 'COBRAR' : 
               gameData.gameState.phase === 'flying' && !hasActiveBet ? 'PRÓXIMA RONDA' : 
               'APOSTAR'}
            </button>
            
            <div className="text-white text-lg font-bold">
              {canCashOut ? `${currentWin.toFixed(0)} monedas` : `${gameData.gameState.multiplier.toFixed(2)}x`}
            </div>
          </div>

          {/* Right - Total Bet */}
          <div className="text-right">
            <div className="text-white/70 text-sm">Total Bet</div>
            <div className="text-white font-bold">
              {hasActiveBet ? `${currentBet.toFixed(0)} monedas` : 
               nextRoundBet ? `${nextRoundBet.toFixed(0)} monedas (próxima)` :
               `${betAmount.toFixed(0)} monedas`}
            </div>
          </div>
        </div>

        {/* Bottom Multipliers Bar */}
        <div className="mt-4 flex items-center justify-center space-x-2 overflow-x-auto">
          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
            gameData.gameState.phase === 'flying' ? 'bg-green-500/80 text-white' : 
            gameData.gameState.phase === 'crashed' ? 'bg-red-500/80 text-white' : 
            'bg-yellow-500/80 text-black'
          }`}>
            {gameData.gameState.phase === 'flying' ? 'VOLANDO' : 
             gameData.gameState.phase === 'crashed' ? 'ESTRELLADO' : 
             'ESPERANDO'}
          </div>
          {recentMultipliers.slice(-15).reverse().map((mult, index) => (
            <div
              key={index}
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                mult < 1.5 ? 'bg-red-500/80 text-white' :
                mult < 2 ? 'bg-yellow-500/80 text-black' :
                mult < 5 ? 'bg-green-500/80 text-white' :
                'bg-purple-500/80 text-white'
              }`}
            >
              {mult.toFixed(2)}x
            </div>
          ))}
        </div>
      </div>

      {/* Auto Bot Panel */}
      {showAutoBotPanel && (
        <AutoBotPanel
          config={autoBotConfig}
          onConfigChange={setAutoBotConfig}
          onClose={() => setShowAutoBotPanel(false)}
          balance={balance}
        />
      )}

      {/* Account Panel */}
      {showAccountPanel && (
        <AccountPanel
          user={user}
          balance={balance}
          gameHistory={gameHistory}
          transactions={transactions}
          paymentMethods={paymentMethods}
          onClose={() => setShowAccountPanel(false)}
          onLogout={handleLogout}
          onAddPaymentMethod={handleAddPaymentMethod}
          onDeposit={handleDeposit}
          onWithdrawal={handleWithdrawal}
          autoCashOutEnabled={autoCashOutEnabled}
          setAutoCashOutEnabled={setAutoCashOutEnabled}
          autoCashOut={autoCashOut}
          setAutoCashOut={setAutoCashOut}
        />
      )}
    </div>
  );
}

export default App;