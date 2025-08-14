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

export const MultiplayerGameBoardBackup: React.FC<MultiplayerGameBoardProps> = ({
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

  useEffect(() => {
    const starCount = 150;
    const newStars = [] as Array<{x:number;y:number;size:number;speed:number}>;
    for (let i = 0; i < starCount; i++) {
      newStars.push({ x: Math.random() * 200, y: Math.random() * 100, size: Math.random() * 3 + 0.5, speed: 0.1 + Math.random() * 0.5 });
    }
    setStars(newStars);
  }, []);

  useEffect(() => {
    if (gameState.phase === 'flying') {
      const interval = setInterval(() => {
        setStars(prev => prev.map(star => ({
          ...star,
          x: star.x - star.speed < -10 ? 200 : star.x - star.speed,
          y: star.y + star.speed * 0.35 > 110 ? (star.y + star.speed * 0.35 - 110) : star.y + star.speed * 0.35
        })));

        const update = (pos: {x:number;y:number}, sx: number, sy: number, resetX: number) => {
          const nextX = pos.x - sx;
          const nextY = pos.y + sy;
          if (nextX < -50) return { x: resetX, y: Math.max(5, Math.min(90, 10 + Math.random() * 80)) };
          const clampedY = nextY > 110 ? (nextY - 110) : (nextY < -10 ? nextY + 110 : nextY);
          return { x: nextX, y: clampedY };
        };

        setPlanetPositions(prev => ({
          planet1: update(prev.planet1, 0.3, 0.08, 150),
          planet2: update(prev.planet2, 0.25, 0.06, 180),
          planet3: update(prev.planet3, 0.4, 0.10, 160),
          planet4: update(prev.planet4, 0.35, 0.05, 200),
          planet5: update(prev.planet5, 0.5, 0.12, 170),
          planet1b: update(prev.planet1b, 0.45, 0.09, 220),
          planet3b: update(prev.planet3b, 0.38, 0.07, 240),
        }));

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

  const astronautPosition = { x: 50, y: 50 };
  const getMultiplierColor = () => {
    if (gameState.multiplier < 1.5) return 'text-green-400';
    if (gameState.multiplier < 2) return 'text-yellow-400';
    if (gameState.multiplier < 5) return 'text-orange-400';
    return 'text-red-400';
  };

  const currentUserBet = activeBets.find(bet => bet.playerId === currentUserId);
  const otherBets = activeBets.filter(bet => bet.playerId !== currentUserId);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 space-background">
      {/* Background layers, stars, nebulae and planets omitted for brevity in backup */}
      <div className="absolute inset-0" />

      {/* Astronaut (backup version, no launch platform) */}
      <div
        className="absolute transition-all duration-100"
        style={{ left: `${astronautPosition.x}%`, top: `${astronautPosition.y}%`, transform: `translate(-50%, -50%)`, zIndex: 10 }}
      >
        <div className="relative">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center`}>
            <img src="/png-png-urbanbrush-13297 copy.png" alt="Spaceman" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Minimal status and UI omitted in backup */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
        <div className="bg-black/30 rounded-full px-4 py-2 text-white text-sm">Backup UI</div>
        <button className="bg-black/30 rounded-full px-4 py-2 text-white text-sm">{totalPlayers} jugadores</button>
      </div>
    </div>
  );
};