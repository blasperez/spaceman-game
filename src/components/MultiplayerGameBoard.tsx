import React, { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff, X } from 'lucide-react';

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
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; speed: number }>>([]);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [astronautRotation, setAstronautRotation] = useState(0);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
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

  // Generate parallax background elements
  useEffect(() => {
    // Stars with different speeds
    const generateStars = () => {
      const starCount = 150;
      const newStars = [];
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          x: Math.random() * 200, // Extended for continuous loop
          y: Math.random() * 100,
          size: Math.random() * 3 + 0.5,
          speed: 0.1 + Math.random() * 0.5 // Different speeds for parallax
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  // Animate background elements
  useEffect(() => {
    if (gameState.phase === 'flying') {
      const interval = setInterval(() => {
        // Move stars
        setStars(prevStars => 
          prevStars.map(star => ({
            ...star,
            x: star.x - star.speed < -10 ? 200 : star.x - star.speed
          }))
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [gameState.phase]);

  // Astronaut rotation
  useEffect(() => {
    if (gameState.phase === 'flying') {
      const rotationInterval = setInterval(() => {
        setAstronautRotation(prev => prev + 1);
      }, 50);

      return () => clearInterval(rotationInterval);
    }
  }, [gameState.phase]);

  const calculatePosition = () => {
    if (gameState.phase === 'waiting') return { x: 50, y: 70 };
    if (gameState.phase === 'crashed') return { x: 50, y: 70 + Math.min((gameState.crashPoint || 1) * 5, 20) };
    
    const progress = Math.min((gameState.multiplier - 1) / 10, 1);
    const y = 70 - (progress * 50);
    
    return { x: 50, y };
  };

  const astronautPosition = calculatePosition();

  const getMultiplierColor = () => {
    if (gameState.multiplier < 1.5) return 'text-green-400';
    if (gameState.multiplier < 2) return 'text-yellow-400';
    if (gameState.multiplier < 5) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get current user's bet
  const currentUserBet = activeBets.find(bet => bet.playerId === currentUserId);
  const otherBets = activeBets.filter(bet => bet.playerId !== currentUserId);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900">
      {/* Deep background layer */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black/40" />
      </div>

      {/* Stars layer */}
      <div className="absolute inset-0">
        {stars.map((star, index) => (
          <div
            key={`star-${index}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: 'white',
              boxShadow: `0 0 ${star.size * 2}px white`,
              opacity: 0.8 + Math.random() * 0.2
            }}
          />
        ))}
      </div>

      {/* Moving planets - Improved */}
      <div className="absolute inset-0">
        {/* Big planet */}
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle at 30% 30%, #60A5FA, #3B82F6, #1E40AF)',
            boxShadow: '0 0 50px rgba(59, 130, 246, 0.6), inset -15px -15px 30px rgba(0,0,0,0.4)',
            left: `${120 + (gameState.phase === 'flying' ? -Date.now() * 0.003 % 240 : 0)}%`,
            top: '20%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        />

        {/* Medium planet */}
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle at 30% 30%, #A78BFA, #8B5CF6, #7C3AED)',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.6), inset -10px -10px 20px rgba(0,0,0,0.4)',
            left: `${180 + (gameState.phase === 'flying' ? -Date.now() * 0.005 % 280 : 0)}%`,
            top: '60%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        />

        {/* Small moon */}
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '40px',
            height: '40px',
            background: 'radial-gradient(circle at 30% 30%, #FDE68A, #F59E0B, #D97706)',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.6), inset -5px -5px 10px rgba(0,0,0,0.3)',
            left: `${150 + (gameState.phase === 'flying' ? -Date.now() * 0.007 % 250 : 0)}%`,
            top: '40%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        />
      </div>

      {/* Continuous fire jet effect */}
      {gameState.phase === 'flying' && (
        <div 
          className="absolute"
          style={{
            left: `${astronautPosition.x - 8}%`,
            top: `${astronautPosition.y}%`,
            transform: 'translate(-100%, -50%)',
            zIndex: 5
          }}
        >
          {/* Fire jet layers - creates continuous flame effect */}
          <div 
            className="absolute"
            style={{
              width: '200px',
              height: '80px',
              background: `linear-gradient(to right, 
                transparent 0%,
                rgba(255, 100, 0, 0.1) 30%,
                rgba(255, 200, 0, 0.3) 50%,
                rgba(255, 255, 100, 0.5) 70%,
                rgba(255, 255, 255, 0.8) 90%,
                rgba(255, 255, 255, 0.9) 95%,
                transparent 100%)`,
              filter: 'blur(15px)',
              animation: 'fireJet 0.1s infinite',
              transform: 'scaleY(2)'
            }}
          />
          
          <div 
            className="absolute"
            style={{
              width: '250px',
              height: '60px',
              background: `linear-gradient(to right, 
                transparent 0%,
                rgba(255, 0, 0, 0.1) 20%,
                rgba(255, 100, 0, 0.2) 40%,
                rgba(255, 200, 0, 0.4) 60%,
                rgba(255, 255, 0, 0.6) 80%,
                transparent 100%)`,
              filter: 'blur(20px)',
              animation: 'fireJet2 0.15s infinite',
              transform: 'translateY(-10px)'
            }}
          />
          
          <div 
            className="absolute"
            style={{
              width: '180px',
              height: '40px',
              background: `linear-gradient(to right, 
                transparent 0%,
                rgba(255, 150, 0, 0.2) 30%,
                rgba(255, 200, 50, 0.4) 60%,
                rgba(255, 255, 150, 0.7) 85%,
                transparent 100%)`,
              filter: 'blur(10px)',
              animation: 'fireJet3 0.12s infinite',
              transform: 'translateY(10px) scaleY(1.5)'
            }}
          />

          {/* Inner bright core */}
          <div 
            className="absolute"
            style={{
              width: '100px',
              height: '30px',
              background: `linear-gradient(to left, 
                transparent 0%,
                rgba(255, 255, 255, 0.9) 70%,
                rgba(255, 255, 200, 1) 90%,
                transparent 100%)`,
              filter: 'blur(5px)',
              animation: 'fireCore 0.08s infinite',
              left: '80px',
              top: '25px'
            }}
          />
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fireJet {
          0%, 100% { opacity: 0.8; transform: scaleY(2) translateX(0); }
          50% { opacity: 1; transform: scaleY(2.2) translateX(-5px); }
        }
        
        @keyframes fireJet2 {
          0%, 100% { opacity: 0.7; transform: translateY(-10px) scaleX(1); }
          50% { opacity: 0.9; transform: translateY(-10px) scaleX(1.1); }
        }
        
        @keyframes fireJet3 {
          0%, 100% { opacity: 0.6; transform: translateY(10px) scaleY(1.5); }
          50% { opacity: 0.8; transform: translateY(10px) scaleY(1.7); }
        }
        
        @keyframes fireCore {
          0%, 100% { opacity: 0.9; width: 100px; }
          50% { opacity: 1; width: 120px; }
        }
      `}</style>

      {/* Original Astronaut */}
      <div
        className="absolute transition-all duration-100"
        style={{
          left: `${astronautPosition.x}%`,
          top: `${astronautPosition.y}%`,
          transform: `translate(-50%, -50%)`,
          zIndex: 10,
          filter: gameState.phase === 'crashed' ? 'brightness(0.7)' : 'none'
        }}
      >
        <div className="relative">
          <div className={`w-48 h-48 flex items-center justify-center ${
            gameState.phase === 'flying' ? 'drop-shadow-[0_0_40px_rgba(255,165,0,0.9)]' : 'drop-shadow-2xl'
          }`}
               style={{
                 filter: gameState.phase === 'flying' ? 'brightness(1.2)' : 'brightness(1)'
               }}>
            <img 
              src="/png-png-urbanbrush-13297 copy.png" 
              alt="Spaceman"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Game Status */}
      {gameState.phase === 'waiting' && gameState.countdown > 0 && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-white text-3xl font-bold mb-4 drop-shadow-2xl">
              {gameState.countdown > 0 ? '🚀 COLOCA TUS APUESTAS' : '🚀 PRÓXIMO VUELO'}
            </div>
            
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
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - gameState.countdown / 20)}`}
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
              ✨ ¡Prepárate para despegar! ✨
            </div>
          </div>
        </div>
      )}

      {/* Multiplier Display */}
      {gameState.phase === 'flying' && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <span className={`text-8xl font-bold ${getMultiplierColor()} drop-shadow-2xl`}
                  style={{ 
                    textShadow: '0 0 30px currentColor, 0 0 60px currentColor',
                    animation: 'pulse 0.5s ease-in-out infinite'
                  }}>
              {gameState.multiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      )}

      {/* Crash Display */}
      {gameState.phase === 'crashed' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-xl border-2 border-red-400 rounded-3xl p-8 shadow-2xl animate-bounce">
            <div className="text-white text-4xl font-bold mb-2">💥 CRASH! 💥</div>
            <div className="text-red-200 text-5xl font-bold">{gameState.crashPoint?.toFixed(2)}x</div>
          </div>
        </div>
      )}

      {/* Top Info Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
        <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-2 border border-white/20">
          {isConnected ? (
            <Wifi size={16} className="text-green-400" />
          ) : (
            <WifiOff size={16} className="text-red-400" />
          )}
          <span className="text-white text-sm">{isConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>

        <button 
          onClick={() => setShowPlayersModal(true)}
          className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-2 border border-white/20 hover:bg-white/20 transition-colors"
        >
          <Users size={16} className="text-white" />
          <span className="text-white text-sm">{totalPlayers} jugadores</span>
        </button>
      </div>

      {/* Active Bets Display */}
      <div className="absolute bottom-4 left-4 right-4 max-h-48 overflow-y-auto space-y-2 z-20">
        {currentUserBet && (
          <div className={`bg-gradient-to-r ${
            currentUserBet.cashedOut 
              ? 'from-green-500/30 to-blue-500/30 border-green-400' 
              : 'from-blue-500/30 to-purple-500/30 border-blue-400'
          } backdrop-blur-md rounded-xl p-3 border shadow-lg`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white font-bold">TÚ</span>
                <span className="text-white/80 ml-2">${currentUserBet.betAmount}</span>
              </div>
              {currentUserBet.cashedOut ? (
                <div className="text-green-400 font-bold">
                  ✓ {currentUserBet.cashOutMultiplier?.toFixed(2)}x = ${currentUserBet.winAmount?.toFixed(0)}
                </div>
              ) : (
                <div className="text-yellow-400 font-bold animate-pulse">EN VUELO</div>
              )}
            </div>
          </div>
        )}

        {isMobile ? (
          otherBets.length > 0 && (
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-2 border border-white/10">
              <div className="text-white/60 text-xs text-center">
                +{otherBets.length} jugadores más apostando
              </div>
            </div>
          )
        ) : (
          otherBets.slice(0, 5).map((bet) => (
            <div key={bet.playerId} className={`bg-black/20 backdrop-blur-md rounded-xl p-2 border ${
              bet.cashedOut ? 'border-green-400/30' : 'border-white/10'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white/80 text-sm">{bet.playerName}</span>
                  <span className="text-white/60 text-sm ml-2">${bet.betAmount}</span>
                </div>
                {bet.cashedOut ? (
                  <div className="text-green-400 text-sm">
                    {bet.cashOutMultiplier?.toFixed(2)}x
                  </div>
                ) : gameState.phase === 'flying' ? (
                  <div className="text-yellow-400/60 text-xs">EN VUELO</div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Players Modal */}
      {showPlayersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">Jugadores Activos ({activeBets.length})</h3>
              <button 
                onClick={() => setShowPlayersModal(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] space-y-2">
              {activeBets.map((bet) => (
                <div key={bet.playerId} className={`bg-black/30 rounded-lg p-3 border ${
                  bet.playerId === currentUserId ? 'border-blue-400' : 'border-white/10'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium">
                        {bet.playerId === currentUserId ? 'TÚ' : bet.playerName}
                      </span>
                      <span className="text-white/60 ml-2">${bet.betAmount}</span>
                    </div>
                    {bet.cashedOut ? (
                      <div className="text-right">
                        <div className="text-green-400 font-medium">
                          {bet.cashOutMultiplier?.toFixed(2)}x
                        </div>
                        <div className="text-green-300 text-sm">
                          +${bet.winAmount?.toFixed(0)}
                        </div>
                      </div>
                    ) : gameState.phase === 'flying' ? (
                      <div className="text-yellow-400 animate-pulse">EN VUELO</div>
                    ) : (
                      <div className="text-white/40">ESPERANDO</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};