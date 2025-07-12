import React, { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface GameState {
  gameId: string;
  phase: 'waiting' | 'flying' | 'crashed';
  multiplier: number;
  countdown: number;
  crashPoint?: number;
}

interface PlayerBet {
  playerId: string;
  playerName: string;
  betAmount: number;
  cashedOut?: boolean;
  cashOutMultiplier?: number;
  winAmount?: number;
}

interface MultiplayerGameBoardProps {
  gameState: GameState;
  activeBets: PlayerBet[];
  totalPlayers: number;
  isConnected: boolean;
  currentUserId: string;
}

export const MultiplayerGameBoard: React.FC<MultiplayerGameBoardProps> = ({
  gameState,
  activeBets,
  totalPlayers,
  isConnected,
  currentUserId
}) => {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number }>>([]);

  // Generate stars background
  useEffect(() => {
    const generateStars = () => {
      const starCount = 80;
      const newStars = [];
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 0.5
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  const getMultiplierColor = () => {
    if (gameState.multiplier < 1.5) return 'text-white';
    if (gameState.multiplier < 2) return 'text-yellow-400';
    if (gameState.multiplier < 5) return 'text-orange-400';
    if (gameState.multiplier < 10) return 'text-red-400';
    return 'text-purple-400';
  };

  

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 overflow-hidden">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl backdrop-blur-md border ${
          isConnected 
            ? 'bg-green-500/20 border-green-400/30 text-green-300' 
            : 'bg-red-500/20 border-red-400/30 text-red-300'
        }`}>
          {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="text-sm font-medium">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Stars background */}
      <div className="absolute inset-0">
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.3 + Math.random() * 0.7,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Game Status - Waiting */}
      {gameState.phase === 'waiting' && gameState.countdown > 0 && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-white text-3xl font-bold mb-4 drop-shadow-2xl">🚀 PRÓXIMO VUELO</div>
            
            {/* Countdown Circle */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (gameState.countdown / 10)}`}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-white drop-shadow-2xl animate-pulse">
                  {gameState.countdown}
                </span>
              </div>
            </div>
            
            <div className="text-blue-200 text-xl drop-shadow-xl animate-pulse">
              ✨ ¡Coloca tus apuestas! ✨
            </div>
          </div>
        </div>
      )}

      {/* Multiplier Display - Flying */}
      {gameState.phase === 'flying' && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <span className={`text-8xl font-bold ${getMultiplierColor()} drop-shadow-2xl animate-pulse`}
                  style={{ 
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.7)',
                    filter: 'brightness(1.3)',
                    transform: `scale(${1 + (gameState.multiplier - 1) * 0.1})`
                  }}>
              {gameState.multiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      )}

      {/* Spaceman */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 ${
        gameState.phase === 'crashed' ? 'animate-bounce scale-125' : ''
      } ${gameState.phase === 'flying' ? 'animate-pulse scale-110' : 'scale-100'}`}>
        <div className="relative">
          <div className={`w-32 h-32 flex items-center justify-center overflow-hidden ${
            gameState.phase === 'flying' ? 'drop-shadow-[0_0_40px_rgba(255,165,0,0.9)]' : 'drop-shadow-2xl'
          }`}
               style={{
                 filter: gameState.phase === 'flying' ? 'brightness(1.4) saturate(1.4) drop-shadow(0 0 25px rgba(255,165,0,0.8))' : 'brightness(1.1)',
                 transform: gameState.phase === 'flying' ? `scale(${1 + (gameState.multiplier - 1) * 0.05})` : 'scale(1)'
               }}>
            <img 
              src="/png-png-urbanbrush-13297 copy.png" 
              alt="Spaceman"
              className="w-full h-full object-contain"
              style={{
                filter: gameState.phase === 'flying' ? 'brightness(1.3) saturate(1.3) drop-shadow(0 0 15px rgba(255,165,0,0.7))' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Crash Message */}
      {gameState.phase === 'crashed' && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500/90 border-4 border-red-300/90 rounded-3xl px-12 py-6 backdrop-blur-sm animate-bounce"
               style={{ boxShadow: '0 0 40px rgba(239, 68, 68, 0.8)' }}>
            <span className="text-red-50 font-bold text-3xl drop-shadow-2xl">
              💥 CRASHED at {gameState.crashPoint?.toFixed(2)}x!
            </span>
          </div>
        </div>
      )}

      {/* Active Players Panel */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40">
        <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center">
              <Users size={20} className="mr-2 text-purple-400" />
              Jugadores Activos
            </h3>
            <div className="text-white/70 text-sm">
              {totalPlayers} online
            </div>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 text-white/70 text-xs mb-2 border-b border-white/20 pb-2">
            <div>Jugador</div>
            <div className="text-right">Apuesta</div>
            <div className="text-right">Multi.</div>
            <div className="text-right">Ganancia</div>
          </div>
          
          {/* Players List */}
          <div className="space-y-1">
            {activeBets.map((bet) => (
              <div
                key={bet.playerId}
                className={`grid grid-cols-4 gap-2 text-xs py-2 px-2 rounded ${
                  bet.playerId === currentUserId 
                    ? 'bg-blue-500/20 border border-blue-400/30' 
                    : 'bg-white/5'
                } ${bet.cashedOut ? 'text-green-300' : 'text-white'}`}
              >
                <div className="truncate">
                  {bet.playerId === currentUserId ? '👤 ' : ''}{bet.playerName}
                </div>
                <div className="text-right">€{bet.betAmount}</div>
                <div className="text-right">
                  {bet.cashedOut ? `${bet.cashOutMultiplier?.toFixed(2)}x` : 
                   gameState.phase === 'flying' ? `${gameState.multiplier.toFixed(2)}x` : '-'}
                </div>
                <div className="text-right">
                  {bet.cashedOut ? `€${bet.winAmount?.toFixed(2)}` : 
                   gameState.phase === 'flying' ? `€${(bet.betAmount * gameState.multiplier).toFixed(2)}` : '-'}
                </div>
              </div>
            ))}
          </div>
          
          {activeBets.length === 0 && (
            <div className="text-white/60 text-center py-4 text-sm">
              Esperando jugadores...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
