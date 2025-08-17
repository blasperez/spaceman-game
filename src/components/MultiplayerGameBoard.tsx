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
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; speed: number; depth: number }>>([]);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [astronautRotation, setAstronautRotation] = useState(0);
  const [planetPositions, setPlanetPositions] = useState({
    planet1: { x: 150, y: 15 + Math.random() * 60 },
    planet2: { x: 180, y: 25 + Math.random() * 50 },
    planet3: { x: 160, y: 20 + Math.random() * 60 },
    planet4: { x: 200, y: 10 + Math.random() * 50 },
    planet5: { x: 170, y: 30 + Math.random() * 50 },
    planet1b: { x: 220, y: 20 + Math.random() * 60 },
    planet3b: { x: 240, y: 15 + Math.random() * 60 }
  });
  
  const [nebulaPositions, setNebulaPositions] = useState({
    nebula1: { x: 120, y: 10 },
    nebula2: { x: 160, y: 60 },
    nebula3: { x: 110, y: 70 },
    nebula4: { x: 180, y: 20 }
  });

  const [platformX, setPlatformX] = useState(55);
  const [platformVisible, setPlatformVisible] = useState(true);

  // Removed launch platform state

  // Removed launch platform effects

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
      const newStars = [] as Array<{x:number;y:number;size:number;speed:number;depth:number}>;
      for (let i = 0; i < starCount; i++) {
        const depth = Math.random(); // 0 far, 1 near
        const baseSpeed = 0.08 + Math.random() * 0.4;
        newStars.push({
          x: Math.random() * 200,
          y: Math.random() * 100,
          size: 0.5 + depth * 3, // near stars look bigger
          speed: baseSpeed * (0.6 + depth * 1.4),
          depth
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  // Warp lines configuration (generated once)
  const [warpLines] = useState(() => Array.from({ length: 24 }, () => ({
    top: Math.random() * 100,
    delay: Math.random() * 1.2,
    dur: 0.8 + Math.random() * 0.9,
    heightVh: 20 + Math.random() * 40,
    opacity: 0.15 + Math.random() * 0.5
  })));

  // Shockwave trigger key on crash
  const [crashKey, setCrashKey] = useState<number | null>(null);
  useEffect(() => {
    if (gameState.phase === 'crashed') {
      setCrashKey(Date.now());
    }
  }, [gameState.phase]);

  // Animate background elements
  useEffect(() => {
    if (gameState.phase === 'flying') {
      const interval = setInterval(() => {
        // Move stars diagonally: decrease x and increase y to simulate upward right-to-left motion
        setStars(prevStars => 
          prevStars.map(star => ({
            ...star,
            x: star.x - star.speed < -10 ? 200 : star.x - star.speed,
            y: star.y + star.speed * 0.35 > 110 ? (star.y + star.speed * 0.35 - 110) : star.y + star.speed * 0.35
          }))
        );
        
        // Helper to update planets with diagonal motion and randomized Y on reset
        const update = (pos: {x:number;y:number}, sx: number, sy: number, resetX: number) => {
          const nextX = pos.x - sx;
          const nextY = pos.y + sy;
          if (nextX < -50) {
            const randY = Math.max(5, Math.min(90, 10 + Math.random() * 80));
            return { x: resetX, y: randY };
          }
          const clampedY = nextY > 110 ? (nextY - 110) : (nextY < -10 ? nextY + 110 : nextY);
          return { x: nextX, y: clampedY };
        };
        
        // Move planets diagonally from top-right to bottom-left
        setPlanetPositions(prev => ({
          planet1: update(prev.planet1, 0.3, 0.08, 150),
          planet2: update(prev.planet2, 0.25, 0.06, 180),
          planet3: update(prev.planet3, 0.4, 0.10, 160),
          planet4: update(prev.planet4, 0.35, 0.05, 200),
          planet5: update(prev.planet5, 0.5, 0.12, 170),
          planet1b: update(prev.planet1b, 0.45, 0.09, 220),
          planet3b: update(prev.planet3b, 0.38, 0.07, 240),
        }));
        
        // Move nebula clouds diagonally
        setNebulaPositions(prev => ({
          nebula1: update(prev.nebula1, 0.1, 0.04, 120),
          nebula2: update(prev.nebula2, 0.08, 0.035, 160),
          nebula3: update(prev.nebula3, 0.12, 0.045, 110),
          nebula4: update(prev.nebula4, 0.09, 0.04, 180),
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [gameState.phase]);

  // No rotation - astronaut stays static

  // Astronaut always in the center
  const astronautPosition = { x: 50, y: 50 };

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
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 space-background" style={{ perspective: '900px' }}>
      {/* Diagonal drift layers removed per request. We'll incline movement for stars/planets instead. */}
      {/* Deep background layer */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black/40" />
      </div>

      {/* Stars layer */}
      {/* Enhanced parallax stars background */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        {stars.map((star, index) => (
          <div
            key={`star-${index}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: star.size > 2 ? 
                `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,255,0.6) 50%, transparent 100%)` :
                `rgba(255, 255, 255, 0.8)`,
              opacity: 0.4 + star.depth * 0.5,
              boxShadow: star.size > 2 ? 
                `0 0 ${star.size * 3}px rgba(255, 255, 255, 0.7), 0 0 ${star.size * 6}px rgba(200, 200, 255, 0.3)` :
                `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.5)`,
              animationDelay: `${index * 0.1}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
              transform: `rotate(-12deg) scale(${0.8 + star.depth * 0.6})`,
              filter: `blur(${(1 - star.depth) * 1.5}px)`,
              zIndex: Math.round(3 + star.depth * 4) as any
            }}
          />
        ))}
      </div>

      {/* Far mega-nebula layers are injected by parent background; nothing to place here */}

      {/* Moving nebula clouds and gas */}
      <div className="absolute inset-0" style={{ zIndex: 4 }}>
        <div 
          className="absolute opacity-20 animate-pulse transition-all duration-300 ease-linear"
          style={{
            width: '400px',
            height: '200px',
            left: `${nebulaPositions.nebula1.x}%`,
            top: `${nebulaPositions.nebula1.y}%`,
            background: 'radial-gradient(ellipse, rgba(138, 43, 226, 0.3) 0%, rgba(75, 0, 130, 0.2) 40%, transparent 70%)',
            filter: 'blur(15px)',
            animationDuration: '8s'
          }}
        />
        
        <div 
          className="absolute opacity-15 animate-pulse transition-all duration-300 ease-linear"
          style={{
            width: '300px',
            height: '150px',
            left: `${nebulaPositions.nebula2.x}%`,
            top: `${nebulaPositions.nebula2.y}%`,
            background: 'radial-gradient(ellipse, rgba(30, 144, 255, 0.3) 0%, rgba(0, 100, 200, 0.2) 40%, transparent 70%)',
            filter: 'blur(20px)',
            animationDuration: '12s',
            animationDelay: '2s'
          }}
        />
        
        <div 
          className="absolute opacity-10 animate-pulse transition-all duration-300 ease-linear"
          style={{
            width: '500px',
            height: '100px',
            left: `${nebulaPositions.nebula3.x}%`,
            top: `${nebulaPositions.nebula3.y}%`,
            background: 'radial-gradient(ellipse, rgba(255, 20, 147, 0.2) 0%, rgba(139, 69, 19, 0.1) 50%, transparent 80%)',
            filter: 'blur(25px)',
            animationDuration: '15s',
            animationDelay: '5s'
          }}
        />
        
        <div 
          className="absolute opacity-25 animate-pulse transition-all duration-300 ease-linear"
          style={{
            width: '200px',
            height: '300px',
            left: `${nebulaPositions.nebula4.x}%`,
            top: `${nebulaPositions.nebula4.y}%`,
            background: 'radial-gradient(ellipse, rgba(50, 205, 50, 0.2) 0%, rgba(34, 139, 34, 0.1) 40%, transparent 70%)',
            filter: 'blur(18px)',
            animationDuration: '10s',
            animationDelay: '3s'
          }}
        />
      </div>

      {/* Moving planets - Fixed animation with proper layering */}
      <div className="absolute inset-0">
        {/* Far planets (background) */}
        <img
          src="/Planeta (2).png"
          alt="Planet 2"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '250px',
            height: '250px',
            left: `${planetPositions.planet2.x}%`,
            top: `${planetPositions.planet2.y}%`,
            transform: 'translateX(-50%) rotate(-12deg)',
            zIndex: 2,
            opacity: 0.4,
            filter: 'blur(1px)'
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (2).svg';
          }}
        />

        <img
          src="/Planeta (4).png"
          alt="Planet 4"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '200px',
            height: '200px',
            left: `${planetPositions.planet4.x}%`,
            top: `${planetPositions.planet4.y}%`,
            transform: 'translateX(-50%) rotate(-12deg)',
            zIndex: 2,
            opacity: 0.5,
            filter: 'blur(0.5px)'
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (4).svg';
          }}
        />

        {/* Medium distance planets */}
        <img
          src="/Planeta (1).png"
          alt="Planet 1"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '180px',
            height: '180px',
            left: `${planetPositions.planet1.x}%`,
            top: `${planetPositions.planet1.y}%`,
            transform: 'translateX(-50%) rotate(-12deg)',
            zIndex: 3,
            opacity: 0.7
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (1).svg';
          }}
        />

        <img
          src="/Planeta (3).png"
          alt="Planet 3"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '140px',
            height: '140px',
            left: `${planetPositions.planet3.x}%`,
            top: `${planetPositions.planet3.y}%`,
            transform: 'translateX(-50%) rotate(-12deg)',
            zIndex: 3,
            opacity: 0.75
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (3).svg';
          }}
        />

        {/* Close planets (foreground) */}
        <img
          src="/Planeta (5).png"
          alt="Planet 5"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '80px',
            height: '80px',
            left: `${planetPositions.planet5.x}%`,
            top: `${planetPositions.planet5.y}%`,
            transform: 'translateX(-50%) rotate(-12deg)',
            zIndex: 5,
            opacity: 0.9
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (5).svg';
          }}
        />

        <img
          src="/Planeta (1).png"
          alt="Planet 1b"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '100px',
            height: '100px',
            left: `${planetPositions.planet1b.x}%`,
            top: `${planetPositions.planet1b.y}%`,
            transform: 'translateX(-50%) rotate(33deg)',
            zIndex: 6,
            opacity: 0.8
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (1).svg';
          }}
        />

        <img
          src="/Planeta (3).png"
          alt="Planet 3b"
          className="absolute transition-all duration-75 ease-linear"
          style={{
            width: '120px',
            height: '120px',
            left: `${planetPositions.planet3b.x}%`,
            top: `${planetPositions.planet3b.y}%`,
            transform: 'translateX(-50%) rotate(-30deg)',
            zIndex: 4,
            opacity: 0.7
          }}
          onError={(e) => {
            e.currentTarget.src = '/Planeta (3).svg';
          }}
        />
      </div>

      {/* Warp speed lines during flight */}
      {gameState.phase === 'flying' && (
        <div className="absolute inset-0 warp-container">
          {warpLines.map((line, i) => (
            <div
              key={`warp-${i}`}
              className="warp-line"
              style={{
                top: `${line.top}%`,
                height: `${line.heightVh}vh`,
                opacity: line.opacity as any,
                animationDuration: `${line.dur}s`,
                animationDelay: `${line.delay}s`
              }}
            />
          ))}
        </div>
      )}



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
          {/* Fire Jets - only when flying - HORIZONTAL */}
          {gameState.phase === 'flying' && (
             <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6" style={{ transform: 'translate(-36px, 18%) rotate(-12deg)' }}>
               {/* Core fire jet - RED ONLY */}
               <div 
                 className="absolute left-0 transform"
                 style={{
                   top: '68%',
                   width: `${Math.min(120 * (1.1 + gameState.multiplier * 0.12), 360)}px`,
                   height: '40px',
                  background: 'linear-gradient(to left, #cc1100 0%, #ff3300 30%, #ff5500 60%, transparent 100%)',
                  filter: 'blur(8px)',
                  animation: 'fireCore 0.2s ease-in-out infinite alternate',
                  borderRadius: '0 50% 50% 0',
                  transform: 'skewX(-6deg)',
                  transition: 'width 0.08s ease'
                }}
              />
              
              {/* Secondary red jet */}
              <div 
                className="absolute left-0 transform"
                 style={{
                   top: '70%',
                   width: `${Math.min(100 * (1.1 + gameState.multiplier * 0.12), 300)}px`,
                   height: '25px',
                  background: 'linear-gradient(to left, #ff3300 0%, #ff6600 40%, transparent 100%)',
                  filter: 'blur(6px)',
                  animation: 'fireJet 0.15s ease-in-out infinite alternate',
                  borderRadius: '0 50% 50% 0',
                  transform: 'skewX(-6deg)',
                  transition: 'width 0.08s ease'
                }}
              />
              
              {/* Third fire layer - yellow/orange */}
              <div 
                className="absolute left-0 transform"
                 style={{
                   top: '72%',
                   width: `${Math.min(80 * (1.1 + gameState.multiplier * 0.12), 240)}px`,
                   height: '20px',
                  background: 'linear-gradient(to left,rgba(255, 0, 0, 0.49) 0%,rgba(255, 72, 0, 0.29) 50%, transparent 100%)',
                  filter: 'blur(4px)',
                  animation: 'fireJet 0.12s ease-in-out infinite alternate',
                  borderRadius: '0 50% 50% 0',
                  transform: 'skewX(-6deg)',
                  transition: 'width 0.08s ease'
                }}
              />
              
              {/* Fourth fire layer - white core */}
              <div 
                className="absolute left-0 transform"
                 style={{
                   top: '74%',
                   width: `${Math.min(60 * (1.1 + gameState.multiplier * 0.12), 200)}px`,
                   height: '15px',
                  background: 'linear-gradient(to left, #ffffff 0%, #ffeeaa 60%, transparent 100%)',
                  filter: 'blur(2px)',
                  animation: 'fireJet 0.1s ease-in-out infinite alternate',
                  borderRadius: '0 50% 50% 0',
                  transition: 'width 0.08s ease'
                }}
              />
            </div>
          )}
          
          <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center ${
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

      {/* Lens flare around astronaut during flight */}
      {gameState.phase === 'flying' && (
        <div className="lens-flare" style={{ left: '50%', top: '50%' }} />
      )}

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
            <span className={`text-5xl sm:text-7xl md:text-8xl font-bold ${getMultiplierColor()} drop-shadow-2xl`}
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

      {/* Shockwave on crash */}
      {gameState.phase === 'crashed' && crashKey && (
        <div key={crashKey} className="shockwave" style={{ left: '50%', top: '50%' }} />
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