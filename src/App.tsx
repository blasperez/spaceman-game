<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import { MultiplayerGameBoard } from './components/MultiplayerGameBoard';
import { MobileBettingPanel } from './components/MobileBettingPanel';
import { Statistics } from './components/Statistics';
import { Chat } from './components/Chat';
=======
import { useState, useEffect } from 'react';
>>>>>>> d9949890a7c7ebf738e71e211a9736420e38ae49
import { LoginScreen } from './components/LoginScreen';
import { SimpleAccountPanel } from './components/SimpleAccountPanel';
import { SimpleStats } from './components/SimpleStats';
import { SimpleGameBoard } from './components/SimpleGameBoard';
import { useAuth } from './hooks/useAuth';
import { DollarSign, Play, Square } from 'lucide-react';

<<<<<<< HEAD
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
  
=======
const App = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const { user } = useAuth();

>>>>>>> d9949890a7c7ebf738e71e211a9736420e38ae49
  // Game state
  const [betAmount, setBetAmount] = useState(10);
  const [userBalance, setUserBalance] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [totalWon, setTotalWon] = useState(0);
  const [gameHistory, setGameHistory] = useState<Array<{multiplier: number; won: number; bet: number}>>([]);

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos) || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Simple game simulation
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + 0.01;
          // Random crash chance increases with multiplier
          const crashChance = Math.random() * 100;
          const crashThreshold = Math.max(5, 100 - (newMultiplier * 20));
          
          if (crashChance < crashThreshold) {
            setGamePhase('crashed');
            setTimeout(() => {
              setGamePhase('waiting');
              setMultiplier(1.00);
              setCurrentBet(0);
              setHasCashedOut(false);
            }, 3000);
            return newMultiplier;
          }
          
          return newMultiplier;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  const handleBet = () => {
    if (gamePhase === 'waiting' && betAmount <= userBalance && betAmount > 0) {
      setCurrentBet(betAmount);
      setUserBalance(prev => prev - betAmount);
      setHasCashedOut(false);
      setGamePhase('flying');
    }
  };

  const handleCashOut = () => {
    if (gamePhase === 'flying' && currentBet > 0 && !hasCashedOut) {
      const winAmount = currentBet * multiplier;
      setUserBalance(prev => prev + winAmount);
      setTotalWon(prev => prev + winAmount - currentBet);
      setGameHistory(prev => [...prev, { 
        multiplier, 
        won: winAmount - currentBet,
        bet: currentBet 
      }]);
      setHasCashedOut(true);
      setGamePhase('waiting');
      setMultiplier(1.00);
      setCurrentBet(0);
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  const hasActiveBet = currentBet > 0 && !hasCashedOut;
  const currentWin = hasActiveBet ? currentBet * multiplier : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      <div className="grid grid-cols-12 h-screen gap-4 p-4">
        {/* Left Sidebar - Account & Stats */}
        <div className="col-span-3 space-y-4">
          <SimpleAccountPanel userBalance={userBalance} setUserBalance={setUserBalance} />
          <SimpleStats gameHistory={gameHistory} totalWon={totalWon} />
        </div>

        {/* Game Area */}
        <div className="col-span-6 relative">
          <div className="h-full bg-gradient-to-br from-gray-900/50 via-purple-900/30 to-blue-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900/70 backdrop-blur-sm border-b border-gray-700/50 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <h1 className="text-white font-bold text-2xl flex items-center">
                  🚀 Spaceman 
                  <span className="ml-2 text-sm text-gray-400">v2.0</span>
                </h1>
              </div>
              
              <div className="bg-gray-800/70 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <DollarSign size={16} />
                <span className="font-medium">${userBalance.toFixed(2)}</span>
              </div>
            </div>

            {/* Game Board */}
            <div className="flex-1 relative h-[calc(100%-80px)]">
              <SimpleGameBoard multiplier={multiplier} gamePhase={gamePhase} />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Betting */}
        <div className="col-span-3">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4">
            <h2 className="text-white font-semibold mb-4">Panel de Apuestas</h2>
            
            <div className="space-y-4">
              {/* Bet Amount */}
              <div>
                <label className="text-gray-300 text-sm block mb-2">Cantidad de Apuesta</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setBetAmount(Math.max(1, betAmount - 5))}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
                    disabled={gamePhase === 'flying'}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-gray-800 text-white p-2 rounded text-center"
                    disabled={gamePhase === 'flying'}
                  />
                  <button
                    onClick={() => setBetAmount(betAmount + 5)}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
                    disabled={gamePhase === 'flying'}
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Current Bet Info */}
              {hasActiveBet && (
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-300 text-sm">Ganancia Potencial</div>
                    <div className="text-green-400 text-xl font-bold">
                      ${currentWin.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {gamePhase === 'waiting' && !hasActiveBet && (
                  <button
                    onClick={handleBet}
                    disabled={betAmount > userBalance || betAmount <= 0}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play size={16} />
                    <span>Apostar ${betAmount}</span>
                  </button>
                )}

                {gamePhase === 'flying' && hasActiveBet && !hasCashedOut && (
                  <button
                    onClick={handleCashOut}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 animate-pulse"
                  >
                    <Square size={16} />
                    <span>Retirar ${currentWin.toFixed(2)}</span>
                  </button>
                )}

                {gamePhase === 'crashed' && (
                  <div className="w-full bg-red-500 text-white py-3 px-4 rounded-lg text-center">
                    ¡Crashed en {multiplier.toFixed(2)}x!
                  </div>
                )}
              </div>

              {/* Game Status */}
              <div className="text-center text-gray-400 text-sm">
                {gamePhase === 'waiting' && 'Esperando siguiente ronda...'}
                {gamePhase === 'flying' && 'Ronda en progreso'}
                {gamePhase === 'crashed' && 'Ronda terminada'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;