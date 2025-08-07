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
  const [clouds, setClouds] = useState<Array<{ x: number; y: number; size: number; speed: number; opacity: number }>>([]);
  const [fireParticles, setFireParticles] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number; type: 'flame' | 'spark' | 'smoke' }>>([]);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [rocketShake, setRocketShake] = useState(0);
  const [turbineRotation, setTurbineRotation] = useState(0);

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

    // Clouds for depth
    const generateClouds = () => {
      const cloudCount = 8;
      const newClouds = [];
      for (let i = 0; i < cloudCount; i++) {
        newClouds.push({
          x: Math.random() * 200,
          y: Math.random() * 100,
          size: 80 + Math.random() * 120,
          speed: 0.3 + Math.random() * 0.7,
          opacity: 0.1 + Math.random() * 0.2
        });
      }
      setClouds(newClouds);
    };

    generateStars();
    generateClouds();
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

        // Move clouds
        setClouds(prevClouds => 
          prevClouds.map(cloud => ({
            ...cloud,
            x: cloud.x - cloud.speed < -20 ? 200 : cloud.x - cloud.speed
          }))
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [gameState.phase]);

  // Rocket shake and turbine animation
  useEffect(() => {
    if (gameState.phase === 'flying') {
      const shakeInterval = setInterval(() => {
        setRocketShake(Math.sin(Date.now() * 0.01) * 2);
      }, 50);

      const turbineInterval = setInterval(() => {
        setTurbineRotation(prev => prev + 30);
      }, 50);

      return () => {
        clearInterval(shakeInterval);
        clearInterval(turbineInterval);
      };
    } else {
      setRocketShake(0);
    }
  }, [gameState.phase]);

  // Enhanced cartoon fire effect
  useEffect(() => {
    if (gameState.phase === 'flying') {
      const interval = setInterval(() => {
        setFireParticles(prevParticles => {
          const newParticles = [...prevParticles];
          
          // Generate cartoon fire particles
          for (let i = 0; i < 8; i++) {
            const particleId = Date.now() + Math.random() * 1000 + i;
            const particleType = Math.random() > 0.7 ? 'smoke' : Math.random() > 0.3 ? 'flame' : 'spark';
            
            newParticles.push({
              x: 35, // From rocket rear
              y: 50 + (Math.random() - 0.5) * 10,
              opacity: 1,
              size: particleType === 'smoke' ? 15 + Math.random() * 10 : 8 + Math.random() * 12,
              id: particleId,
              type: particleType
            });
          }
          
          // Update existing particles
          const updatedParticles = newParticles.map(particle => ({
            ...particle,
            x: particle.x - (particle.type === 'smoke' ? 2 : 3),
            y: particle.y + (particle.type === 'smoke' ? (Math.random() - 0.5) * 2 : 0),
            opacity: particle.opacity - (particle.type === 'smoke' ? 0.015 : 0.025),
            size: particle.size + (particle.type === 'smoke' ? 0.5 : -0.1)
          })).filter(particle => particle.opacity > 0 && particle.x > -10);
          
          return updatedParticles;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setFireParticles([]);
    }
  }, [gameState.phase]);

  const getFireParticleStyle = (particle: typeof fireParticles[0]) => {
    switch (particle.type) {
      case 'flame':
        return {
          background: `radial-gradient(circle, 
            rgba(255, 255, 100, ${particle.opacity}) 0%, 
            rgba(255, 200, 0, ${particle.opacity * 0.8}) 30%, 
            rgba(255, 100, 0, ${particle.opacity * 0.6}) 60%, 
            rgba(255, 0, 0, 0) 100%)`,
          filter: 'blur(2px)',
          animation: 'flameFlicker 0.2s infinite'
        };
      case 'spark':
        return {
          background: `radial-gradient(circle, 
            rgba(255, 255, 255, ${particle.opacity}) 0%, 
            rgba(255, 255, 0, ${particle.opacity * 0.8}) 50%, 
            rgba(255, 200, 0, 0) 100%)`,
          filter: 'blur(1px)',
          boxShadow: `0 0 10px rgba(255, 255, 0, ${particle.opacity})`
        };
      case 'smoke':
        return {
          background: `radial-gradient(circle, 
            rgba(100, 100, 100, ${particle.opacity * 0.3}) 0%, 
            rgba(50, 50, 50, ${particle.opacity * 0.2}) 50%, 
            rgba(0, 0, 0, 0) 100%)`,
          filter: 'blur(4px)'
        };
    }
  };

  const calculatePosition = () => {
    if (gameState.phase === 'waiting') return { x: 50, y: 70 };
    if (gameState.phase === 'crashed') return { x: 50, y: 70 + Math.min((gameState.crashPoint || 1) * 5, 20) };
    
    const progress = Math.min((gameState.multiplier - 1) / 10, 1);
    const y = 70 - (progress * 50);
    
    return { x: 50, y };
  };

  const rocketPosition = calculatePosition();

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
      {/* Animated CSS */}
      <style jsx>{`
        @keyframes flameFlicker {
          0%, 100% { transform: scale(1) rotate(0deg); }
          33% { transform: scale(1.1) rotate(-2deg); }
          66% { transform: scale(0.9) rotate(2deg); }
        }
        
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes turbineSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Deep background layer */}
      <div className="absolute inset-0 opacity-30">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black/40" />
      </div>

      {/* Clouds layer (furthest back) */}
      {clouds.map((cloud, index) => (
        <div
          key={`cloud-${index}`}
          className="absolute rounded-full"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.6}px`,
            background: `radial-gradient(ellipse, rgba(255, 255, 255, ${cloud.opacity}) 0%, transparent 70%)`,
            filter: 'blur(8px)',
            transform: 'translateX(-50%)'
          }}
        />
      ))}

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

      {/* Moving planets with cartoon style */}
      <div className="absolute inset-0">
        {/* Big planet */}
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '150px',
            height: '150px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 50%, #793FDF 100%)',
            boxShadow: '0 0 50px rgba(199, 69, 105, 0.5), inset -20px -20px 40px rgba(0,0,0,0.3)',
            left: `${100 + (gameState.phase === 'flying' ? -Date.now() * 0.005 % 200 : 0)}%`,
            top: '20%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        >
          {/* Planet rings */}
          <div className="absolute inset-0 rounded-full border-4 border-purple-300/30 transform rotate-12" 
               style={{ width: '200%', height: '50%', left: '-50%', top: '25%' }} />
        </div>

        {/* Small moon */}
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            boxShadow: '0 0 30px rgba(78, 205, 196, 0.5), inset -10px -10px 20px rgba(0,0,0,0.3)',
            left: `${150 + (gameState.phase === 'flying' ? -Date.now() * 0.008 % 200 : 0)}%`,
            top: '60%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}
        />
      </div>

      {/* Fire particles */}
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
            ...getFireParticleStyle(particle),
            zIndex: 5
          }}
        />
      ))}

      {/* Cartoon Rocket */}
      <div
        className="absolute transition-all duration-100"
        style={{
          left: `${rocketPosition.x}%`,
          top: `${rocketPosition.y}%`,
          transform: `translate(-50%, -50%) rotate(-45deg) translateY(${rocketShake}px)`,
          zIndex: 10,
          filter: gameState.phase === 'crashed' ? 'brightness(0.7)' : 'none'
        }}
      >
        {/* Rocket body */}
        <div className="relative">
          {/* Main body */}
          <div 
            className="w-24 h-40 relative"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 50%, #793FDF 100%)',
              borderRadius: '50% 50% 20% 20%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset -5px -5px 15px rgba(0,0,0,0.2)'
            }}
          >
            {/* Cockpit window */}
            <div 
              className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(102, 126, 234, 0.5)'
              }}
            />
            
            {/* Side fins */}
            <div 
              className="absolute -left-4 top-20 w-8 h-16"
              style={{
                background: 'linear-gradient(135deg, #C44569 0%, #793FDF 100%)',
                clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
                boxShadow: '-5px 0 10px rgba(0,0,0,0.2)'
              }}
            />
            <div 
              className="absolute -right-4 top-20 w-8 h-16"
              style={{
                background: 'linear-gradient(135deg, #C44569 0%, #793FDF 100%)',
                clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                boxShadow: '5px 0 10px rgba(0,0,0,0.2)'
              }}
            />
            
            {/* Turbine */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-8">
              <div 
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, #2D3436 0%, #636E72 100%)',
                  borderRadius: '0 0 50% 50%',
                  boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.3)'
                }}
              >
                {/* Rotating turbine blades */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `rotate(${turbineRotation}deg)` }}
                >
                  <div className="absolute w-12 h-1 bg-gray-600" />
                  <div className="absolute w-12 h-1 bg-gray-600 transform rotate-60" />
                  <div className="absolute w-12 h-1 bg-gray-600 transform rotate-120" />
                </div>
              </div>
            </div>
          </div>

          {/* Astronaut in rocket */}
          <div 
            className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-8"
            style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
          >
            <div className="w-full h-full rounded-full bg-white relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-100 to-gray-300" />
              <div className="absolute top-2 left-1 w-2 h-2 bg-black rounded-full" />
              <div className="absolute top-2 right-1 w-2 h-2 bg-black rounded-full" />
            </div>
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
            
            {/* Countdown with cartoon style */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
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