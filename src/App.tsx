import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase'
import { GameBoard } from './components/GameBoard';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { MobileBettingPanel } from './components/MobileBettingPanel';
import { Statistics } from './components/Statistics';
import { Chat } from './components/Chat';
import { LoginScreen } from './components/LoginScreen';
import { AccountPanel } from './components/AccountPanel';
import { AutoBotPanel } from './components/AutoBotPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useGameSocket } from './hooks/useGameSocket';
import { Crown, Menu, BarChart3, RefreshCw, Settings, Users, TrendingUp, Maximize, Volume2, VolumeX, ChevronLeft, ChevronRight, Plus, Minus, X } from 'lucide-react';

function Page() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
   async function getTodos() {
      const { data: todos } = await supabase.from('todos').select()

      if (todos.length > 1) {
        setTodos(todos)
      }
    }
    
    getTodos()
  }, [])

  return (
    <div>
      {todos.map((todo) => (
        <li key={todo}>{todo}</li>
      ))}
    </div>
  )
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

type GamePhase = 'waiting' | 'flying' | 'crashed';

function App() {
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAutoBotPanel, setShowAutoBotPanel] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
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
  
  // Multiplayer mode toggle
  const [useMultiplayer, setUseMultiplayer] = useState(true);
  
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
  const [autoBetAmount, setAutoBetAmount] = useState(5);
  const [autoCashOut, setAutoCashOut] = useState(2.00);
  const [autoCashOut50, setAutoCashOut50] = useState(1.50);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(false);
  const [autoCashOut50Enabled, setAutoCashOut50Enabled] = useState(false);

  // Recent multipliers for statistics
  const [recentMultipliers, setRecentMultipliers] = useState<number[]>([
    1.77, 1.22, 1.34, 1.47, 46.55, 4.98, 9.22, 1.03, 154.88, 1.15, 
    1.05, 1.64, 25.92, 1.94, 1.53, 1.41, 39.83, 4.05, 3.67
  ]);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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

  // Auto cash out logic for multiplayer
  useEffect(() => {
    if (!hasActiveBet || gameData.gameState.phase !== 'flying' || hasCashedOut) return;
    
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
        message: `💰 50% Auto Cashout en ${currentMultiplier.toFixed(2)}x por €${halfWinnings.toFixed(2)}!`,
        timestamp: new Date(),
        type: 'user'
      }]);
      
      setAutoCashOut50Enabled(false);
    }
  }, [gameData.gameState.multiplier, gameData.gameState.phase, hasActiveBet, autoBotConfig, autoCashOutEnabled, autoCashOut, autoCashOut50Enabled, autoCashOut50, currentBet, user?.name, hasCashedOut]);

  // Auto betting logic for multiplayer
  useEffect(() => {
    if (autoBetEnabled && !autoBotConfig.isActive && gameData.gameState.phase === 'waiting' && !hasActiveBet && gameData.gameState.countdown <= 5 && gameData.gameState.countdown > 0) {
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
  }, [autoBetEnabled, autoBotConfig.isActive, gameData.gameState.phase, hasActiveBet, gameData.gameState.countdown, autoBetAmount, balance]);

  // Bet amount control functions
  const increaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive && gameData.gameState.phase === 'waiting') {
      setBetAmount(prev => Math.min(prev + 1, balance));
    }
  };

  const decreaseBet = () => {
    if (!hasActiveBet && !autoBotConfig.isActive && gameData.gameState.phase === 'waiting') {
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
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout exception:', error);
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
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method || user?.isDemo) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      method: method.type === 'card' ? `**** ${method.last4}` : method.email || 'PayPal',
      status: 'completed',
      timestamp: new Date()
    };

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

  // Multiplayer game functions
  const handlePlaceBet = () => {
    if (gameData.gameState.phase === 'waiting' && betAmount <= balance && !hasActiveBet && !autoBotConfig.isActive) {
      const safeBetAmount = Math.min(betAmount, balance);
      
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
        message: `🚀 Apuesta colocada de €${safeBetAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        timestamp: new Date(),
        type: 'user'
      }]);
    }
  };

  const handleCashOut = useCallback(() => {
    if (hasActiveBet && gameData.gameState.phase === 'flying' && gameData.gameState.multiplier >= 1 && !hasCashedOut) {
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
      setHasActiveBet(false);
      setCurrentBet(0);
      
      const netProfit = totalWinnings - currentBet;
      
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        username: user?.name || 'Jugador',
        message: `💰 ¡Retirado en ${gameData.gameState.multiplier.toFixed(2)}x por €${totalWinnings.toLocaleString('es-MX', { minimumFractionDigits: 2 })}! (Ganancia neta: €${netProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })})`,
        timestamp: new Date(),
        type: 'user'
      }]);
    }
  }, [hasActiveBet, gameData.gameState.phase, currentBet, gameData.gameState.multiplier, user?.name, hasCashedOut, cashOut]);

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
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Game state calculations
  const canBet = gameData.gameState.phase === 'waiting' && !hasActiveBet && betAmount <= balance && !autoBotConfig.isActive && !autoBetEnabled;
  const canCashOut = hasActiveBet && gameData.gameState.phase === 'flying' && gameData.gameState.multiplier >= 1 && !hasCashedOut;
  const currentWin = hasActiveBet ? currentBet * gameData.gameState.multiplier : 0;

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
        {/* MOBILE Game Board - Full Screen */}
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
                  <div className="text-white text-xs font-medium">€{balance.toFixed(2)}</div>
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
                  <h3 className="text-white font-bold text-lg">Chat</h3>
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
          />
        )}
      </div>
    );
  }

  // DESKTOP LAYOUT (unchanged)
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
              <div>Spaceman Multijugador €1 - €100</div>
              <div className="text-xs text-white/70">Game ID: {gameData.gameState.gameId}</div>
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
          <div className="text-white font-bold">€{balance.toFixed(2)}</div>
        </div>
      </div>

      {/* Bottom Controls - Horizontal Layout */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Left - Bet Amount Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setBetAmount(1)}
                disabled={hasActiveBet || autoBotConfig.isActive || gameData.gameState.phase !== 'waiting'}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                €1
              </button>
              <button 
                onClick={() => setBetAmount(5)}
                disabled={hasActiveBet || autoBotConfig.isActive || gameData.gameState.phase !== 'waiting'}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                €5
              </button>
              <button 
                onClick={() => handleButtonPress(decreaseBet)}
                disabled={hasActiveBet || autoBotConfig.isActive || gameData.gameState.phase !== 'waiting'}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded text-white font-bold flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="bg-purple-500/80 px-4 py-2 rounded-xl">
                <div className="text-white/80 text-xs">Bet</div>
                <div className="text-white font-bold">€{betAmount}</div>
              </div>
              <button 
                onClick={() => handleButtonPress(increaseBet)}
                disabled={hasActiveBet || autoBotConfig.isActive || gameData.gameState.phase !== 'waiting'}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed rounded text-white font-bold flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setBetAmount(10)}
                disabled={hasActiveBet || autoBotConfig.isActive || gameData.gameState.phase !== 'waiting'}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                €10
              </button>
              <button 
                onClick={() => setBetAmount(25)}
                disabled={hasActiveBet || autoBotConfig.isActive || gameData.gameState.phase !== 'waiting'}
                className="w-8 h-8 bg-green-500/80 hover:bg-green-600/80 disabled:bg-white/20 disabled:cursor-not-allowed rounded-full text-white font-bold flex items-center justify-center"
              >
                €25
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
              {canCashOut ? 'COBRAR' : 'APOSTAR'}
            </button>
            
            <div className="text-white text-lg font-bold">
              {canCashOut ? `€${currentWin.toFixed(2)}` : `${gameData.gameState.multiplier.toFixed(2)}x`}
            </div>
          </div>

          {/* Right - Total Bet */}
          <div className="text-right">
            <div className="text-white/70 text-sm">Total Bet</div>
            <div className="text-white font-bold">€{hasActiveBet ? currentBet.toFixed(2) : betAmount.toFixed(2)}</div>
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
        />
      )}
    </div>
  );
}

export default App;
