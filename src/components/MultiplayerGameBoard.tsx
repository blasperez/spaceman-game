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
  const [fireParticles, setFireParticles] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number }>>([]);

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

  // Fire trail effect for spaceman during flight
  useEffect(() => {
    if (gameState.phase === 'flying') {
      const interval = setInterval(() => {
        setFireParticles(prevParticles => {
          const newParticles = [...prevParticles];
          
          // Generate fire particles from the left side of spaceman (tail of the ship)
          for (let i = 0; i < 8; i++) {
            const particleId = Date.now() + Math.random() * 1000 + i;
            newParticles.push({
              x: 47, // Left side of spaceman (tail position)
              y: 50 + (Math.random() - 0.5) * 6, // Slight vertical spread
              opacity: 0.9 + Math.random() * 0.1,
              size: 2 + Math.random() * 4,
              id: particleId
            });
          }
          
          // Update existing particles
          const updatedParticles = newParticles.map(particle => ({
            ...particle,
            x: particle.x - 1.5, // Move particles to the left
            y: particle.y + (Math.random() - 0.5) * 0.8,
            opacity: particle.opacity - 0.04,
            size: particle.size * 0.98
          })).filter(particle => particle.opacity > 0 && particle.x > -10);
          
          return updatedParticles.slice(-100); // Keep last 100 particles
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setFireParticles([]);
    }
  }, [gameState.phase]);

  const getMultiplierColor = () => {
    if (gameState.multiplier < 1.5) return 'text-white';
    if (gameState.multiplier < 2) return 'text-yellow-400';
    if (gameState.multiplier < 5) return 'text-orange-400';
    if (gameState.multiplier < 10) return 'text-red-400';
    return 'text-purple-400';
  };

  const getFireParticleStyle = (particle: any) => {
    return {
      background: `radial-gradient(circle, 
        rgba(255, 255, 255, ${particle.opacity}) 0%,
        rgba(255, 255, 0, ${particle.opacity * 0.9}) 20%,
        rgba(255, 165, 0, ${particle.opacity * 0.8}) 50%,
        rgba(255, 69, 0, ${particle.opacity * 0.7}) 80%,
        transparent 100%)`,
      filter: 'blur(0.5px)',
      boxShadow: `0 0 ${particle.size * 2}px rgba(255, 165, 0, ${particle.opacity * 0.8})`
    };
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

      {/* Enhanced space background with animated planets */}
      <div className="absolute inset-0">
        {/* Stars */}
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

        {/* Animated planets for desktop */}
        <div 
          className="absolute rounded-full opacity-80 shadow-2xl planet-animated"
          style={{ 
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle at 30% 30%, #60A5FA, #3B82F6, #1E40AF)',
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.5), inset -12px -12px 25px rgba(0,0,0,0.3)',
            animation: 'planetFloat1 30s linear infinite'
          }}
        />
        
        <div 
          className="absolute rounded-full opacity-70 shadow-2xl planet-animated"
          style={{ 
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle at 30% 30%, #A78BFA, #8B5CF6, #7C3AED)',
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.5), inset -10px -10px 20px rgba(0,0,0,0.3)',
            animation: 'planetFloat2 40s linear infinite'
          }}
        />
        
        <div 
          className="absolute rounded-full opacity-60 shadow-2xl planet-animated"
          style={{ 
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle at 30% 30%, #FB923C, #F97316, #EA580C)',
            boxShadow: '0 0 50px rgba(251, 146, 60, 0.4), inset -15px -15px 30px rgba(0,0,0,0.3)',
            animation: 'planetFloat3 50s linear infinite'
          }}
        />

        {/* Animated moons */}
        <div 
          className="absolute rounded-full opacity-75 shadow-xl moon-animated"
          style={{ 
            width: '40px',
            height: '40px',
            background: 'radial-gradient(circle at 30% 30%, #D1D5DB, #9CA3AF, #6B7280)',
            boxShadow: '0 0 20px rgba(156, 163, 175, 0.6), inset -8px -8px 15px rgba(0,0,0,0.4)',
            animation: 'moonFloat1 25s linear infinite'
          }}
        />
        
        <div 
          className="absolute rounded-full opacity-80 shadow-xl moon-animated"
          style={{ 
            width: '30px',
            height: '30px',
            background: 'radial-gradient(circle at 30% 30%, #FEF3C7, #FBBF24, #F59E0B)',
            boxShadow: '0 0 15px rgba(250, 204, 21, 0.7), inset -6px -6px 10px rgba(0,0,0,0.2)',
            animation: 'moonFloat2 35s linear infinite'
          }}
        />
      </div>

      {/* Fire trail particles */}
      {fireParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            ...getFireParticleStyle(particle)
          }}
        />
      ))}

      {/* Game Status - Waiting with 20 second countdown */}
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
                  strokeDashoffset={`${2 * Math.PI * 50 * (gameState.countdown / 20)}`}
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

      {/* Spaceman with fire trail */}
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

      {/* CSS animations for planets */}
      <style jsx>{`
        @keyframes planetFloat1 {
          0% { 
            transform: translateX(-200px) translateY(15vh) rotate(0deg); 
            left: -200px;
            top: 15%;
          }
          100% { 
            transform: translateX(calc(100vw + 200px)) translateY(25vh) rotate(360deg); 
            left: calc(100vw + 200px);
            top: 25%;
          }
        }
        
        @keyframes planetFloat2 {
          0% { 
            transform: translateX(-200px) translateY(60vh) rotate(0deg); 
            left: -200px;
            top: 60%;
          }
          100% { 
            transform: translateX(calc(100vw + 200px)) translateY(70vh) rotate(-360deg); 
            left: calc(100vw + 200px);
            top: 70%;
          }
        }
        
        @keyframes planetFloat3 {
          0% { 
            transform: translateX(-200px) translateY(80vh) rotate(0deg); 
            left: -200px;
            top: 80%;
          }
          100% { 
            transform: translateX(calc(100vw + 200px)) translateY(90vh) rotate(180deg); 
            left: calc(100vw + 200px);
            top: 90%;
          }
        }
        
        @keyframes moonFloat1 {
          0% { 
            transform: translateX(-100px) translateY(30vh) scale(1); 
            left: -100px;
            top: 30%;
          }
          100% { 
            transform: translateX(calc(100vw + 100px)) translateY(40vh) scale(1.1); 
            left: calc(100vw + 100px);
            top: 40%;
          }
        }
        
        @keyframes moonFloat2 {
          0% { 
            transform: translateX(-100px) translateY(50vh) scale(1); 
            left: -100px;
            top: 50%;
          }
          100% { 
            transform: translateX(calc(100vw + 100px)) translateY(60vh) scale(1.05); 
            left: calc(100vw + 100px);
            top: 60%;
          }
        }
        
        .planet-animated {
          will-change: transform;
        }
        
        .moon-animated {
          will-change: transform;
        }
      `}</style>
    </div>
  );
};