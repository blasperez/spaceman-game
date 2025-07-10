import React, { useState, useEffect, useRef } from 'react';

interface GameBoardProps {
  isGameRunning: boolean;
  multiplier: number;
  onGameEnd: () => void;
  gamePhase: 'waiting' | 'flying' | 'crashed';
  countdown: number;
  soundEnabled: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  isGameRunning,
  multiplier,
  onGameEnd,
  gamePhase,
  countdown,
  soundEnabled
}) => {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; twinkle: number; id: number }>>([]);
  const [fireTrail, setFireTrail] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number; type: 'flame' | 'spark' | 'ember' }>>([]);
  const [flightParticles, setFlightParticles] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number; vx: number; vy: number; type: 'star' | 'sparkle' | 'trail' }>>([]);
  
  // Audio context and oscillator for background sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  
  // Moving planets state
  const [planetPositions, setPlanetPositions] = useState({
    planet1: { x: 8, y: 8 },
    planet2: { x: 88, y: 12 },
    planet3: { x: 92, y: 80 },
    moon1: { x: 15, y: 85 },
    moon2: { x: 75, y: 15 }
  });

  // Generate enhanced stars background - FIXED
  useEffect(() => {
    const generateStars = () => {
      const starCount = 120;
      const newStars = [];
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 0.5,
          twinkle: Math.random() * 4 + 2,
          id: i
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  // Stars twinkling animation - NEW
  useEffect(() => {
    const twinkleInterval = setInterval(() => {
      setStars(prevStars => 
        prevStars.map(star => ({
          ...star,
          opacity: 0.3 + Math.random() * 0.7
        }))
      );
    }, 2000);

    return () => clearInterval(twinkleInterval);
  }, []);

  // Audio system for exciting background sound
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log('Audio not supported');
      }
    };

    initAudio();

    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Improved audio - warmer, less harsh sound - ONLY WHEN SOUND IS ENABLED
  useEffect(() => {
    if (!audioContextRef.current || !soundEnabled) {
      // Stop audio if sound is disabled
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current = null;
        } catch (error) {
          // Oscillator already stopped
        }
      }
      return;
    }

    if (gamePhase === 'flying') {
      try {
        // Stop any existing oscillator
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
        }

        // Create new oscillator for rising tension sound
        oscillatorRef.current = audioContextRef.current.createOscillator();
        gainNodeRef.current = audioContextRef.current.createGain();
        filterRef.current = audioContextRef.current.createBiquadFilter();

        // Connect audio nodes with filter for warmer sound
        oscillatorRef.current.connect(filterRef.current);
        filterRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);

        // Low-pass filter to make sound warmer and less harsh
        filterRef.current.type = 'lowpass';
        filterRef.current.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        filterRef.current.Q.setValueAtTime(1, audioContextRef.current.currentTime);

        // Dynamic frequency based on multiplier - lower, warmer range
        const baseFreq = 150; // Lower base frequency
        const currentFreq = baseFreq + (multiplier - 1) * 25; // Slower rise
        oscillatorRef.current.frequency.setValueAtTime(currentFreq, audioContextRef.current.currentTime);

        // Very low volume, subtle background sound
        gainNodeRef.current.gain.setValueAtTime(0.015, audioContextRef.current.currentTime);

        // Use triangle wave for smoother, warmer sound
        oscillatorRef.current.type = 'triangle';

        // Start the sound
        oscillatorRef.current.start();

        // Add gentle vibrato for excitement (slower and subtler)
        const lfo = audioContextRef.current.createOscillator();
        const lfoGain = audioContextRef.current.createGain();
        lfo.frequency.setValueAtTime(3, audioContextRef.current.currentTime); // Slower 3Hz vibrato
        lfoGain.gain.setValueAtTime(5, audioContextRef.current.currentTime); // Less vibrato depth
        lfo.connect(lfoGain);
        lfoGain.connect(oscillatorRef.current.frequency);
        lfo.start();

      } catch (error) {
        console.log('Audio playback failed');
      }
    } else {
      // Stop audio when not flying
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current = null;
        } catch (error) {
          // Oscillator already stopped
        }
      }
    }
  }, [gamePhase, multiplier, soundEnabled]);

  // Moving planets animation - FIXED
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setPlanetPositions(prev => ({
          planet1: {
            x: prev.planet1.x - 0.4 < -25 ? 125 : prev.planet1.x - 0.4,
            y: prev.planet1.y + Math.sin(Date.now() * 0.001) * 0.15
          },
          planet2: {
            x: prev.planet2.x - 0.3 < -30 ? 130 : prev.planet2.x - 0.3,
            y: prev.planet2.y + Math.cos(Date.now() * 0.0008) * 0.12
          },
          planet3: {
            x: prev.planet3.x - 0.35 < -35 ? 135 : prev.planet3.x - 0.35,
            y: prev.planet3.y + Math.sin(Date.now() * 0.0012) * 0.1
          },
          moon1: {
            x: prev.moon1.x - 0.5 < -20 : 120 : prev.moon1.x - 0.5,
            y: prev.moon1.y + Math.cos(Date.now() * 0.0015) * 0.18
          },
          moon2: {
            x: prev.moon2.x - 0.45 < -22 ? 122 : prev.moon2.x - 0.45,
            y: prev.moon2.y + Math.sin(Date.now() * 0.0009) * 0.14
          }
        }));
      }, 50);

      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  // Enhanced fire trail system - FIXED PARTICLES
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setFireTrail(prevTrail => {
          const newTrail = [...prevTrail];
          
          // Generate fire particles MUCH CLOSER to spaceman's rocket
          const spacemanX = 50; // Always center
          const spacemanY = 50; // Always center
          
          for (let i = 0; i < 12; i++) { // More particles for better effect
            const particleId = Date.now() + Math.random() * 1000 + i;
            newTrail.push({ 
              x: spacemanX - 3 - Math.random() * 4, // MUCH closer to spaceman
              y: spacemanY + (Math.random() - 0.5) * 8, // Tighter spread
              opacity: 0.8 + Math.random() * 0.2,
              size: 2 + Math.random() * 6, // Good size particles
              type: Math.random() > 0.6 ? 'spark' : Math.random() > 0.3 ? 'flame' : 'ember',
              id: particleId
            });
          }
          
          const updatedTrail = newTrail.map(particle => ({
            ...particle,
            x: particle.x - 2, // Faster movement for better visibility
            y: particle.y + (Math.random() - 0.5) * 1.2,
            opacity: particle.opacity - 0.03, // Slower fade
            size: particle.size * 0.97
          })).filter(particle => particle.opacity > 0 && particle.x > -15);
          
          return updatedTrail.slice(-150); // More particles for denser effect
        });
      }, 30); // Faster generation

      return () => clearInterval(interval);
    } else {
      setFireTrail([]);
    }
  }, [gamePhase]);

  // Enhanced flight particles system - FIXED
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setFlightParticles(prevParticles => {
          const newParticles = [...prevParticles];
          
          // Generate flight particles around larger spaceman
          for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 25 + Math.random() * 20; // Larger radius for bigger spaceman
            const particleId = Date.now() + Math.random() * 1000 + i;
            
            newParticles.push({
              x: 50 + Math.cos(angle) * distance,
              y: 50 + Math.sin(angle) * distance,
              opacity: 0.7 + Math.random() * 0.3,
              size: 1 + Math.random() * 3, // Larger particles
              id: particleId,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              type: Math.random() > 0.5 ? 'star' : Math.random() > 0.3 ? 'sparkle' : 'trail'
            });
          }
          
          const updatedParticles = newParticles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            opacity: particle.opacity - 0.025,
            size: particle.size * 0.97
          })).filter(particle => particle.opacity > 0);
          
          return updatedParticles.slice(-100); // More particles
        });
      }, 60);

      return () => clearInterval(interval);
    } else {
      setFlightParticles([]);
    }
  }, [gamePhase]);

  const getMultiplierColor = () => {
    if (multiplier < 1.5) return 'text-white';
    if (multiplier < 2) return 'text-yellow-400';
    if (multiplier < 5) return 'text-orange-400';
    if (multiplier < 10) return 'text-red-400';
    return 'text-purple-400';
  };

  const getFireParticleStyle = (particle: any) => {
    if (particle.type === 'spark') {
      return {
        background: `radial-gradient(circle, 
          rgba(255, 255, 255, ${particle.opacity}) 0%,
          rgba(255, 255, 0, ${particle.opacity * 0.9}) 30%,
          rgba(255, 165, 0, ${particle.opacity * 0.7}) 70%,
          transparent 100%)`,
        filter: 'blur(0.5px)',
        boxShadow: `0 0 ${particle.size * 2}px rgba(255, 255, 0, ${particle.opacity * 0.8})`
      };
    }
    
    if (particle.type === 'ember') {
      return {
        background: `radial-gradient(circle, 
          rgba(255, 69, 0, ${particle.opacity}) 0%,
          rgba(220, 20, 60, ${particle.opacity * 0.8}) 50%,
          rgba(139, 0, 0, ${particle.opacity * 0.6}) 80%,
          transparent 100%)`,
        filter: 'blur(1px)',
        boxShadow: `0 0 ${particle.size * 2}px rgba(255, 69, 0, ${particle.opacity * 0.6})`
      };
    }
    
    return {
      background: `radial-gradient(ellipse, 
        rgba(255, 255, 255, ${particle.opacity * 0.9}) 0%,
        rgba(255, 255, 0, ${particle.opacity}) 15%,
        rgba(255, 165, 0, ${particle.opacity * 0.9}) 35%,
        rgba(255, 69, 0, ${particle.opacity * 0.8}) 60%,
        rgba(220, 20, 60, ${particle.opacity * 0.6}) 80%,
        rgba(139, 0, 0, ${particle.opacity * 0.3}) 100%)`,
      filter: 'blur(1px)',
      boxShadow: `0 0 ${particle.size * 3}px rgba(255, 165, 0, ${particle.opacity * 0.8})`
    };
  };

  const getFlightParticleStyle = (particle: any) => {
    if (particle.type === 'star') {
      return {
        background: `radial-gradient(circle, 
          rgba(255, 255, 255, ${particle.opacity}) 0%,
          rgba(173, 216, 230, ${particle.opacity * 0.8}) 50%,
          transparent 100%)`,
        filter: 'blur(0.5px)',
        boxShadow: `0 0 ${particle.size * 2}px rgba(173, 216, 230, ${particle.opacity})`
      };
    }
    
    if (particle.type === 'trail') {
      return {
        background: `radial-gradient(circle, 
          rgba(138, 43, 226, ${particle.opacity}) 0%,
          rgba(75, 0, 130, ${particle.opacity * 0.8}) 60%,
          transparent 100%)`,
        filter: 'blur(0.8px)',
        boxShadow: `0 0 ${particle.size * 2}px rgba(138, 43, 226, ${particle.opacity * 0.7})`
      };
    }
    
    return {
      background: `radial-gradient(circle, 
        rgba(255, 255, 255, ${particle.opacity}) 0%,
        rgba(255, 215, 0, ${particle.opacity * 0.9}) 40%,
        transparent 100%)`,
      filter: 'blur(0.3px)',
      boxShadow: `0 0 ${particle.size * 1.5}px rgba(255, 215, 0, ${particle.opacity})`
    };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 overflow-hidden">
      {/* Enhanced stars background - FIXED */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.3 + Math.sin(Date.now() * 0.001 + star.id) * 0.4 + 0.3,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.5)`,
              animation: `twinkle ${star.twinkle}s ease-in-out infinite alternate`,
              animationDelay: `${star.id * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Moving Planets - FIXED with better movement */}
      <div 
        className="absolute rounded-full opacity-80 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.planet1.x}%`,
          top: `${planetPositions.planet1.y}%`,
          width: '64px',
          height: '64px',
          background: 'radial-gradient(circle at 30% 30%, #60A5FA, #3B82F6, #1E40AF)',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset -10px -10px 20px rgba(0,0,0,0.3)',
          transform: gamePhase === 'flying' ? 'scale(1.1)' : 'scale(1)'
        }}
      />
      
      <div 
        className="absolute rounded-full opacity-70 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.planet2.x}%`,
          top: `${planetPositions.planet2.y}%`,
          width: '40px',
          height: '40px',
          background: 'radial-gradient(circle at 30% 30%, #A78BFA, #8B5CF6, #7C3AED)',
          boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), inset -8px -8px 15px rgba(0,0,0,0.3)',
          transform: gamePhase === 'flying' ? 'scale(1.05)' : 'scale(1)'
        }}
      />
      
      <div 
        className="absolute rounded-full opacity-60 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.planet3.x}%`,
          top: `${planetPositions.planet3.y}%`,
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle at 30% 30%, #FB923C, #F97316, #EA580C)',
          boxShadow: '0 0 40px rgba(251, 146, 60, 0.4), inset -12px -12px 25px rgba(0,0,0,0.3)',
          transform: gamePhase === 'flying' ? 'scale(1.15)' : 'scale(1)'
        }}
      />

      {/* Moving Moons - FIXED */}
      <div 
        className="absolute rounded-full opacity-75 shadow-xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.moon1.x}%`,
          top: `${planetPositions.moon1.y}%`,
          width: '32px',
          height: '32px',
          background: 'radial-gradient(circle at 30% 30%, #D1D5DB, #9CA3AF, #6B7280)',
          boxShadow: '0 0 15px rgba(156, 163, 175, 0.6), inset -6px -6px 12px rgba(0,0,0,0.4)',
          transform: gamePhase === 'flying' ? 'scale(1.1)' : 'scale(1)'
        }}
      />
      
      <div 
        className="absolute rounded-full opacity-80 shadow-xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.moon2.x}%`,
          top: `${planetPositions.moon2.y}%`,
          width: '24px',
          height: '24px',
          background: 'radial-gradient(circle at 30% 30%, #FEF3C7, #FBBF24, #F59E0B)',
          boxShadow: '0 0 12px rgba(250, 204, 21, 0.7), inset -4px -4px 8px rgba(0,0,0,0.2)',
          transform: gamePhase === 'flying' ? 'scale(1.08)' : 'scale(1)'
        }}
      />

      {/* Flight particles - FIXED */}
      {flightParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            ...getFlightParticleStyle(particle)
          }}
        />
      ))}

      {/* Fire trail particles - FIXED */}
      {fireTrail.map((particle) => (
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

      {/* UFO Beam - Following Reference */}
      {gamePhase === 'waiting' && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-10 bg-gradient-to-b from-blue-400/80 to-transparent rounded-full"></div>
          <div className="w-40 h-40 bg-gradient-to-b from-blue-400/20 to-transparent rounded-full mt-2 -ml-10"></div>
        </div>
      )}

      {/* Enhanced Game Status Text with Beautiful Countdown - MOVED HIGHER */}
      {gamePhase === 'waiting' && countdown > 0 && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-white text-3xl font-bold mb-4 drop-shadow-2xl">🚀 NEXT FLIGHT</div>
            
            {/* Beautiful Countdown Circle */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (countdown / 9)}`}
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
              
              {/* Countdown number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-white drop-shadow-2xl animate-pulse">
                  {countdown}
                </span>
              </div>
            </div>
            
            <div className="text-blue-200 text-xl drop-shadow-xl animate-pulse">
              ✨ Place your bets! ✨
            </div>
          </div>
        </div>
      )}

      {/* Larger Multiplier Display - Above Spaceman */}
      {gamePhase === 'flying' && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <span className={`text-8xl font-bold ${getMultiplierColor()} drop-shadow-2xl animate-pulse`}
                  style={{ 
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.7)',
                    filter: 'brightness(1.3)',
                    transform: `scale(${1 + (multiplier - 1) * 0.1})` // Grows with multiplier
                  }}>
              {multiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      )}

      {/* LARGER Spaceman FIXED IN CENTER - Enhanced Size */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 ${
          gamePhase === 'crashed' ? 'animate-bounce scale-125' : ''
        } ${gamePhase === 'flying' ? 'animate-pulse scale-110' : 'scale-100'}`}
      >
        <div className="relative">
          {/* LARGER Spaceman */}
          <div className={`w-32 h-32 flex items-center justify-center overflow-hidden ${
            gamePhase === 'flying' ? 'drop-shadow-[0_0_40px_rgba(255,165,0,0.9)]' : 'drop-shadow-2xl'
          }`}
               style={{
                 filter: gamePhase === 'flying' ? 'brightness(1.4) saturate(1.4) drop-shadow(0 0 25px rgba(255,165,0,0.8))' : 'brightness(1.1)',
                 transform: gamePhase === 'flying' ? `scale(${1 + (multiplier - 1) * 0.05})` : 'scale(1)' // Grows slightly with multiplier
               }}>
            <img 
              src="/png-png-urbanbrush-13297 copy.png" 
              alt="Spaceman"
              className="w-full h-full object-contain"
              style={{
                filter: gamePhase === 'flying' ? 'brightness(1.3) saturate(1.3) drop-shadow(0 0 15px rgba(255,165,0,0.7))' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Game Status Messages */}
      {gamePhase === 'crashed' && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-500/90 border-4 border-red-300/90 rounded-3xl px-12 py-6 backdrop-blur-sm animate-bounce"
               style={{ boxShadow: '0 0 40px rgba(239, 68, 68, 0.8)' }}>
            <span className="text-red-50 font-bold text-3xl drop-shadow-2xl">💥 CRASHED at {multiplier.toFixed(2)}x!</span>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.3; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};