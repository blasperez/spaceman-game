import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase'
import EnhancedGameBoard from './components/EnhancedGameBoard';
import { Statistics } from './components/Statistics';
import { Chat } from './components/Chat';
import { LoginScreen } from './components/LoginScreen';
import { AccountPanel } from './components/AccountPanel';
import { AutoBotPanel } from './components/AutoBotPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { StripeCheckout } from './components/StripeCheckout';
import { SuccessPage } from './components/SuccessPage';
import { CancelPage } from './components/CancelPage';
import { SubscriptionStatus } from './components/SubscriptionStatus';

import { useGameSocket } from './hooks/useGameSocket';
import { Menu, BarChart3, Settings, Users, Maximize, Volume2, VolumeX, X, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { BettingPanel } from './components/BettingPanel';
import { MobileBettingPanel } from './components/MobileBettingPanel';
import { ProfileModal } from './components/ProfileModal';
import AuthCallback from './components/AuthCallback';

function calculateAge(birthdate: string): number | null {
  if (!birthdate) return null;
  
  const birthDate = new Date(birthdate);
  if (isNaN(birthDate.getTime())) return null; // Invalid date

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

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

function GameApp() {
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAutoBotPanel, setShowAutoBotPanel] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
  // Removed nextRoundBet - no longer allowing betting on next round
  
  // WebSocket connection for multiplayer
  const { gameData, isConnected, connectionStatus, placeBet, cashOut, reconnect, onChatMessage, sendChatMessage } = useGameSocket(
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Mock payment methods and transactions (temporarily unused)
  const [, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [, setTransactions] = useState<Transaction[]>([]);

  const fetchUserProfileWithRetry = useCallback(async (supabaseUser: any): Promise<UserProfile | null> => {
    try {
      console.log('🔍 Fetching user profile for:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('📝 Creating new profile for user');
          const newProfile = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuario',
            avatar_url: supabaseUser.user_metadata?.avatar_url,
            provider: supabaseUser.app_metadata?.provider || 'google',
            balance: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating profile:', createError);
            return null;
          }

          if (createdProfile) {
            console.log('✅ New profile created successfully');
            return {
              id: createdProfile.id,
              name: createdProfile.full_name || 'Usuario',
              email: createdProfile.email || '',
              avatar: createdProfile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(createdProfile.full_name || 'Usuario')}&background=random`,
              provider: createdProfile.provider || 'google',
              balance: createdProfile.balance || 1000,
              isDemo: false,
              age: createdProfile.age,
              country: createdProfile.country,
              phone: createdProfile.phone,
              kyc_verified: createdProfile.kyc_verified || false,
              withdrawal_methods: createdProfile.withdrawal_methods || [],
              deposit_limit: createdProfile.deposit_limit || 1000,
              withdrawal_limit: createdProfile.withdrawal_limit || 1000,
              total_deposits: createdProfile.total_deposits || 0,
              total_withdrawals: createdProfile.total_withdrawals || 0,
              games_played: createdProfile.games_played || 0,
              total_wagered: createdProfile.total_wagered || 0,
              total_won: createdProfile.total_won || 0
            };
          }
        }
        
        return null;
      }

      if (profile) {
        console.log('✅ Profile loaded from database');
        
        // Enrich profile with Google data if available
        const provider = supabaseUser.app_metadata?.provider;
        if (provider === 'google') {
          const { user_metadata } = supabaseUser;
          const updates: { age?: number; country?: string; birthdate?: string } = {};

          // Check for birthdate from Google
          if (!profile.birthdate && user_metadata?.birthdate) {
            updates.birthdate = user_metadata.birthdate;
            const age = calculateAge(user_metadata.birthdate);
            if (age) updates.age = age;
          } else if (profile.birthdate && !profile.age) {
            // Calculate age from existing birthdate
            const age = calculateAge(profile.birthdate);
            if (age) updates.age = age;
          }

          if (!profile.country && user_metadata?.locale) {
            const countryCode = user_metadata.locale.split('-')[1];
            if (countryCode) updates.country = countryCode.toUpperCase();
          }

          if (Object.keys(updates).length > 0) {
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', supabaseUser.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error enriching profile:', updateError);
            } else if (updatedProfile) {
              // Create a new enriched profile object instead of reassigning
              const enrichedProfile = { ...profile, ...updatedProfile };
              // Use the enriched profile for the return statement
              return {
                id: enrichedProfile.id,
                name: enrichedProfile.full_name || supabaseUser.user_metadata?.full_name || 'Usuario',
                email: enrichedProfile.email || supabaseUser.email || '',
                avatar: enrichedProfile.avatar_url || supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(enrichedProfile.full_name || 'Usuario')}&background=random`,
                provider: enrichedProfile.provider || 'google',
                balance: enrichedProfile.balance || 1000,
                isDemo: false,
                age: enrichedProfile.age,
                country: enrichedProfile.country,
                phone: enrichedProfile.phone,
                kyc_verified: enrichedProfile.kyc_verified || false,
                withdrawal_methods: enrichedProfile.withdrawal_methods || [],
                deposit_limit: enrichedProfile.deposit_limit || 1000,
                withdrawal_limit: enrichedProfile.withdrawal_limit || 1000,
                total_deposits: enrichedProfile.total_deposits || 0,
                total_withdrawals: enrichedProfile.total_withdrawals || 0,
                games_played: enrichedProfile.games_played || 0,
                total_wagered: enrichedProfile.total_wagered || 0,
                total_won: enrichedProfile.total_won || 0
              };
            }
          }
        }
      
        return {
          id: profile.id,
          name: profile.full_name || supabaseUser.user_metadata?.full_name || 'Usuario',
          email: profile.email || supabaseUser.email || '',
          avatar: profile.avatar_url || supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'Usuario')}&background=random`,
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
      }
      
      return null;
    } catch (error) {
      console.error('❌ Unexpected error in fetchUserProfileWithRetry:', error);
      return null;
    }
  }, []);

  const handleLogin = useCallback(async (supabaseUser: any) => {
    const userProfile = await fetchUserProfileWithRetry(supabaseUser);
    if (userProfile) {
      setUser(userProfile);
      setBalance(userProfile.balance);
    }
  }, [fetchUserProfileWithRetry]);

  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        console.log('🔍 Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          throw error;
        }
        
        if (session?.user) {
          console.log('✅ Session found, fetching profile...');
          const profile = await fetchUserProfileWithRetry(session.user);
          if (profile) {
            console.log('✅ Profile loaded, logging in...');
            await handleLogin(session.user);
          } else {
            console.log('❌ Profile fetch failed, signing out...');
            await supabase.auth.signOut();
          }
        } else {
          console.log('ℹ️ No active session found');
        }
      } catch (err) {
        console.error('❌ Initial session check failed:', err);
        // Don't sign out on error, just continue without user
      } finally {
        console.log('✅ Session check completed');
        setSessionChecked(true);
        setIsLoading(false);
      }
    };
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Session check timeout, forcing completion');
        setSessionChecked(true);
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    checkInitialSession();
    
    return () => clearTimeout(timeoutId);
  }, [handleLogin, isLoading]);

  useEffect(() => {
    if (!user) return;
    const off = onChatMessage?.((evt: any) => {
      if (evt.type === 'history') {
        const mapped = (evt.data || []).map((m: any) => ({
          id: m.id,
          username: m.username,
          message: m.message,
          timestamp: new Date(m.timestamp),
          type: (m.type as any) || 'user'
        }));
        setChatMessages(mapped);
      } else if (evt.type === 'message') {
        setChatMessages(prev => [...prev, { ...evt.data, timestamp: new Date(evt.data.timestamp) }]);
      }
    });
    return () => { if (typeof off === 'function') off(); };
  }, [user, onChatMessage]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        await handleLogin(session.user);
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
      }
    });

    return () => subscription.unsubscribe();
  }, [handleLogin]);


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

  const lastRecordedRoundIdRef = useRef<string | null>(null);
  // FIXED: Reset bet state SOLO cuando inicia nueva ronda (countdown === 20)
  useEffect(() => {
    if (gameData.gameState.phase === 'waiting' && gameData.gameState.countdown === 20) {
      setHasActiveBet(false);
      setCurrentBet(0);
      setHasCashedOut(false);
      setBetLocked(false);
      lastRecordedRoundIdRef.current = null; // allow next round logging
    } else if (gameData.gameState.phase === 'crashed') {
      // Handle crash - lose bet if not cashed out
      if (hasActiveBet && !hasCashedOut) {
        const currentRoundId = gameData.gameState.gameId || String(gameData.gameState.crashPoint || 0);
        if (lastRecordedRoundIdRef.current !== currentRoundId) {
          lastRecordedRoundIdRef.current = currentRoundId;
          const lostGame: GameHistory = {
            id: Date.now(),
            multiplier: gameData.gameState.crashPoint || gameData.gameState.multiplier,
            betAmount: currentBet,
            winAmount: 0,
            timestamp: new Date()
          };
          setGameHistory(prev => [...prev, lostGame]);
          saveGameHistory(lostGame);
          // Send one chat message via server
          sendChatMessage?.(`💥 Perdido en ${(gameData.gameState.crashPoint || gameData.gameState.multiplier).toFixed(2)}x - ${currentBet.toFixed(0)} pesos`);
        }
      }
      
      // Reset for next round
      setTimeout(() => {
        setHasActiveBet(false);
        setCurrentBet(0);
        setHasCashedOut(false);
        setBetLocked(false);
      }, 2000);
    }
  }, [gameData.gameState.phase, gameData.gameState.countdown, gameData.gameState.crashPoint, gameData.gameState.gameId, hasActiveBet, hasCashedOut, currentBet, sendChatMessage]);

  // Improved bet locking to prevent race conditions
  useEffect(() => {
    if (betLocked) {
      const unlockTimeout = setTimeout(() => {
        setBetLocked(false);
      }, 3000); // Unlock after 3 seconds to prevent permanent lock
      
      return () => clearTimeout(unlockTimeout);
    }
  }, [betLocked]);

  // Improved error handling for session and profile loading
  useEffect(() => {
    if (!sessionChecked) return;

    const handleErrorLogging = (error: any, context: string) => {
      if (error) {
        console.error(`❌ Error in ${context}:`, error);
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          username: 'Sistema',
          message: `⚠️ Error en ${context}: ${error.message || error}`,
          timestamp: new Date(),
          type: 'system'
        }]);
      }
    };

    // Example usage in session check and auth state change can be added here if needed
  }, [sessionChecked]);

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
        message: `💰 50% Auto Cashout en ${currentMultiplier.toFixed(2)}x por ${halfWinnings.toFixed(0)} pesos!`,
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

  // FIXED: Improved multiplayer game functions with next round betting
  const handlePlaceBet = () => {
    if (
      gameData.gameState.phase === 'waiting' &&
      gameData.gameState.countdown > 0 &&
      gameData.gameState.countdown <= 20 &&
      betAmount <= balance &&
      !betLocked &&
      !autoBotConfig.isActive
    ) {
      const safeBetAmount = Math.min(betAmount, balance);
      setBetLocked(true);
      placeBet(safeBetAmount);
      setBalance(prev => prev - safeBetAmount);
      setCurrentBet(prev => prev + safeBetAmount); // Suma la apuesta
      setHasActiveBet(true);
      setHasCashedOut(false);
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          username: user?.name || 'Jugador',
          message: `🚀 Apuesta colocada de ${safeBetAmount.toFixed(0)} pesos`,
          timestamp: new Date(),
          type: 'user',
        },
      ]);
      setTimeout(() => setBetLocked(false), 1000);
    } else {
      if (gameData.gameState.phase !== 'waiting') {
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            username: 'Sistema',
            message: `⚠️ Solo puedes apostar durante la ventana de apuestas (20 segundos)` ,
            timestamp: new Date(),
            type: 'system',
          },
        ]);
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
        message: `💰 ¡Retirado en ${gameData.gameState.multiplier.toFixed(2)}x por ${totalWinnings.toFixed(0)} pesos! (Ganancia neta: ${netProfit.toFixed(0)} pesos)`,
        timestamp: new Date(),
        type: 'user'
      }]);
      
      // Unlock after delay
      setTimeout(() => setBetLocked(false), 1000);
    }
  }, [hasActiveBet, gameData.gameState.phase, currentBet, gameData.gameState.multiplier, user?.name, hasCashedOut, betLocked, cashOut, saveGameHistory]);

  const handleSendMessage = (message: string) => {
    if (!message) return;
    sendChatMessage?.(message);
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
          <p className="text-white text-lg mb-4">Cargando...</p>
          {/* Removed emergency reload button to avoid confusing UX */}
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

        {/* Mobile Game Board - Now using MultiplayerGameBoard for consistent visuals */}
        <div className="absolute inset-0">
          <MultiplayerGameBoard
            gameState={gameData.gameState}
            activeBets={gameData.activeBets}
            totalPlayers={gameData.totalPlayers}
            isConnected={isConnected}
            currentUserId={user.id}
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
                  <div className="text-white text-xs font-medium">{balance.toFixed(0)} pesos</div>
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
                onClick={() => setShowStripeCheckout(true)}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-md border border-green-400/30 rounded-lg transition-colors"
              >
                <CreditCard size={16} className="text-green-400" />
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

        {/* Removed Next Round Bet Indicator */}

        {/* Mobile Betting Panel - Enhanced for mobile experience */}
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
            onClose={() => setShowAccountPanel(false)}
          />
        )}

        {/* Stripe Checkout */}
        {showStripeCheckout && (
          <StripeCheckout onClose={() => setShowStripeCheckout(false)} amount={50} />
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
              <div>Spaceman Multijugador 1 - 100 pesos</div>
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
              onClick={() => setShowStripeCheckout(true)}
              className="p-2 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-md border border-green-400/30 rounded-lg transition-colors"
            >
              <CreditCard size={16} className="text-green-400" />
            </button>
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
                  ? 'bg-green-500/20 hover:bg-green-500/30' 
                  : 'bg-white/10 hover:bg-white/20'
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
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full pl-1 pr-3 py-1 transition-colors"
            >
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
              <span className="text-white text-sm font-medium">Perfil</span>
            </button>
          </div>
        </div>
      </header>

      {/* Left Side Panel - Balance & Subscription */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 space-y-3">
        <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-3">
          <div className="text-white/70 text-xs">Balance</div>
          <div className="text-white font-bold">{balance.toFixed(0)} pesos</div>
          <div className="text-white/60 text-xs">≈ ${balance.toFixed(0)} MXN</div>
        </div>
        
        {/* Subscription Status */}
        <SubscriptionStatus />
      </div>

      {/* Removed Next Round Bet Indicator - Desktop */}

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
                totalOnline={gameData.totalPlayers}
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
                <div className="text-white font-bold">{betAmount} pesos</div>
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
                  ? 'bg-red-600/90 hover:bg-red-700/90' 
                  : canBet
                  ? 'bg-green-500/80 hover:bg-green-600/80'
                  : 'bg-white/20 cursor-not-allowed'
              }`}
            >
              {canCashOut ? 'RETIRAR' : 'APOSTAR'}
            </button>
            
            <div className="text-white text-lg font-bold">
              {canCashOut ? `${currentWin.toFixed(0)} pesos` : `${gameData.gameState.multiplier.toFixed(2)}x`}
            </div>
          </div>

          {/* Right - Total Bet */}
          <div className="text-right">
            <div className="text-white/70 text-sm">Total Bet</div>
            <div className="text-white font-bold">
              {hasActiveBet ? `${currentBet.toFixed(0)} pesos` : `${betAmount.toFixed(0)} pesos`}
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
            onClose={() => setShowAccountPanel(false)}
          />
        )}

      {/* Stripe Checkout */}
      {showStripeCheckout && (
        <StripeCheckout onClose={() => setShowStripeCheckout(false)} amount={50} />
      )}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
    </div>
  );
}

import InstallPWA from './components/InstallPWA';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameApp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/health" element={
          <div style={{
            padding: '20px', 
            fontFamily: 'monospace',
            backgroundColor: '#1a1a1a',
            color: '#00ff00',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ✅ OK - Spaceman Game Running
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPWA />
    </Router>
  );
}

export default App;
