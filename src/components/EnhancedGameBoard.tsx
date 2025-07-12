import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, Volume2, VolumeX } from 'lucide-react';

interface EnhancedGameBoardProps {
  multiplier: number;
  gamePhase: 'waiting' | 'starting' | 'flying' | 'crashed';
  countdown: number;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  balance: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  onPlaceBet: () => void;
  onCashOut: () => void;
  canBet: boolean;
  canCashOut: boolean;
  hasActiveBet: boolean;
  currentWin: number;
  autoCashOutEnabled: boolean;
  setAutoCashOutEnabled: (enabled: boolean) => void;
  autoCashOut: number;
  setAutoCashOut: (multiplier: number) => void;
}

const EnhancedGameBoard: React.FC<EnhancedGameBoardProps> = ({
  multiplier,
  gamePhase,
  countdown,
  soundEnabled,
  onSoundToggle,
  balance,
  betAmount,
  setBetAmount,
  onPlaceBet,
  onCashOut,
  canBet,
  canCashOut,
  hasActiveBet,
  currentWin,
  autoCashOutEnabled,
  setAutoCashOutEnabled,
  autoCashOut,
  setAutoCashOut
}) => {
  const [stars, setStars] = useState<Array<{ x: number; y: number; opacity: number; size: number }>>([]);
  const [spacemanX, setSpacemanX] = useState(50);
  const [spacemanY, setSpacemanY] = useState(70);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; opacity: number }>>([]);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; opacity: number; size: number }>>([]);

  // Generate stars
  useEffect(() => {
    const newStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.8 + 0.2,
      size: Math.random() * 2 + 1
    }));
    setStars(newStars);
  }, []);

  // Animate spaceman during flight
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setSpacemanX(prev => Math.min(prev + 0.5, 90));
        setSpacemanY(prev => Math.max(prev - 0.3, 10));
        
        // Add trail
        setTrail(prev => [
          { x: spacemanX, y: spacemanY, opacity: 1 },
          ...prev.slice(0, 20).map(point => ({ ...point, opacity: point.opacity * 0.9 }))
        ]);

        // Add particles
        if (Math.random() > 0.7) {
          setParticles(prev => [
            ...prev,
            {
              x: spacemanX - 5,
              y: spacemanY + 5,
              vx: (Math.random() - 0.5) * 2,
              vy: Math.random() * 2 + 1,
              opacity: 1,
              size: Math.random() * 3 + 1
            }
          ]);
        }
      }, 50);

      return () => clearInterval(interval);
    } else {
      setSpacemanX(50);
      setSpacemanY(70);
      setTrail([]);
      setParticles([]);
    }
  }, [gamePhase, spacemanX, spacemanY]);

  // Animate particles
  useEffect(() => {
    if (particles.length > 0) {
      const interval = setInterval(() => {
        setParticles(prev => prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            opacity: particle.opacity * 0.95
          }))
          .filter(particle => particle.opacity > 0.1)
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [particles.length]);

  const quickBetAmounts = [1, 5, 10, 25];

  const getMultiplierColor = (mult: number) => {
    if (mult < 1.5) return 'text-green-400';
    if (mult < 2) return 'text-yellow-400';
    if (mult < 5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGameStatusText = () => {
    switch (gamePhase) {
      case 'waiting':
        return 'WAIT FOR NEXT GAME';
      case 'starting':
        return `STARTING IN ${countdown}`;
      case 'flying':
        return 'FLYING...';
      case 'crashed':
        return 'CRASHED!';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 overflow-hidden">
      {/* Stars background */}
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${Math.random() * 3}s`
          }}
        />
      ))}

      {/* Radial glow effect */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(59, 130, 246, 0.4) 0%, transparent 70%)`
        }}
      />

      {/* Game content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full pt-20">
        {/* Planet/Multiplier display */}
        <div className="relative mb-8">
          <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl animate-pulse">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-inner">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent">
                <div className="flex items-center justify-center h-full">
                  <span className={`text-5xl font-bold drop-shadow-lg ${getMultiplierColor(multiplier)}`}>
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Radial rays */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 bg-gradient-to-t from-transparent via-cyan-400 to-transparent opacity-60"
                style={{
                  height: '120px',
                  left: '50%',
                  top: '-60px',
                  transformOrigin: '50% 156px',
                  transform: `rotate(${i * 22.5}deg)`
                }}
              />
            ))}
          </div>
        </div>

        {/* Spaceman */}
        <div
          className="absolute transition-all duration-100 ease-linear z-20"
          style={{
            left: `${spacemanX}%`,
            top: `${spacemanY}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
            🚀
          </div>
        </div>

        {/* Trail */}
        {trail.map((point, index) => (
          <div
            key={index}
            className="absolute w-2 h-2 bg-orange-400 rounded-full"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              opacity: point.opacity,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Particles */}
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute bg-yellow-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Game status */}
        <div className="text-white text-4xl font-bold mb-8 text-center drop-shadow-lg">
          {getGameStatusText()}
        </div>
      </div>

      {/* Controls panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
        <div className="max-w-6xl mx-auto">
          {/* Auto controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={autoCashOutEnabled}
                  onChange={(e) => setAutoCashOutEnabled(e.target.checked)}
                  className="rounded"
                />
                <span>Auto Cashout</span>
              </label>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoCashOut(Math.max(1.1, autoCashOut - 0.1))}
                  className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-white min-w-16 text-center">
                  {autoCashOut.toFixed(1)}x
                </span>
                <button
                  onClick={() => setAutoCashOut(autoCashOut + 0.1)}
                  className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={onSoundToggle}
                className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded">
                <Settings size={20} />
              </button>
              <button className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded">
                <BarChart3 size={20} />
              </button>
            </div>
          </div>

          {/* Betting controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {quickBetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    betAmount === amount
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  €{amount}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-white">
                Balance: €{balance.toFixed(2)}
              </div>
              
              {hasActiveBet ? (
                <div className="flex items-center space-x-2">
                  <span className="text-white">
                    Win: €{currentWin.toFixed(2)}
                  </span>
                  <button
                    onClick={onCashOut}
                    disabled={!canCashOut}
                    className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-500 text-white rounded-lg font-bold text-lg transition-colors"
                  >
                    CASH OUT
                  </button>
                </div>
              ) : (
                <button
                  onClick={onPlaceBet}
                  disabled={!canBet}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-500 text-white rounded-lg font-bold text-lg transition-colors"
                >
                  CONFIRM BET
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGameBoard;