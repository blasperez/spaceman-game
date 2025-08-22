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
  multiplier,
  gamePhase,
  countdown,
  soundEnabled
}) => {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; twinkle: number; id: number; color: string }>>([]);
  const [fireTrail, setFireTrail] = useState<Array<{ x: number; y: number; opacity: number; size: number; type: string; id: number; vx: number; vy: number }>>([]);
  const [flightParticles, setFlightParticles] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number; vx: number; vy: number; type: string; color: string }>>([]);
  const [explosionParticles, setExplosionParticles] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number; vx: number; vy: number; type: string; color: string }>>([]);
  const [nebulaClouds, setNebulaClouds] = useState<Array<{ x: number; y: number; opacity: number; size: number; id: number; color: string }>>([]);
  const [onomatopoeia, setOnomatopoeia] = useState<Array<{ id: number; text: string; x: number; y: number; opacity: number; scale: number }>>([]);
  
  // Audio context and oscillator for background sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  
  // Moving planets state - adjusted for left to right movement
  const [planetPositions, setPlanetPositions] = useState({
    planet1: { x: -10, y: 10 }, // Start off-screen left
    planet2: { x: -20, y: 20 },
    planet3: { x: -15, y: 60 },
    moon1: { x: -25, y: 80 },
    moon2: { x: -30, y: 15 }
  });

  // Generate enhanced stars background with different colors
  useEffect(() => {
    const generateStars = () => {
      const starCount = 200;
      const newStars = [];
      const colors = ['#ffffff', '#87CEEB', '#FFD700', '#FF69B4', '#00CED1', '#FF6347'];
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 0.5,
          twinkle: Math.random() * 4 + 2,
          id: i,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  // Generate nebula clouds for atmospheric effect - lilac/purple fantasy
  useEffect(() => {
    const generateNebulas = () => {
      const nebulaCount = 8;
      const newNebulas = [];
      const colors = [
        'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.20), rgba(74, 0, 224, 0.06) 60%, transparent 70%)',
        'radial-gradient(circle at 70% 60%, rgba(192, 132, 252, 0.18), rgba(67, 56, 202, 0.06) 60%, transparent 70%)',
        'radial-gradient(ellipse at 40% 70%, rgba(147, 51, 234, 0.16), rgba(76, 29, 149, 0.05) 60%, transparent 70%)',
        'radial-gradient(circle at 60% 40%, rgba(236, 72, 153, 0.12), rgba(88, 28, 135, 0.05) 60%, transparent 70%)'
      ];
      
      for (let i = 0; i < nebulaCount; i++) {
        newNebulas.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: Math.random() * 0.3 + 0.1,
          size: Math.random() * 200 + 100,
          id: i,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      setNebulaClouds(newNebulas);
    };
    generateNebulas();
  }, []);

  // Stars twinkling animation with enhanced effects
  useEffect(() => {
    const twinkleInterval = setInterval(() => {
      setStars(prevStars => 
        prevStars.map(star => ({
          ...star,
          opacity: 0.3 + Math.random() * 0.7,
          size: star.size + (Math.random() - 0.5) * 2
        }))
      );
    }, 1500);

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

  // Enhanced audio with dynamic frequency and effects
  useEffect(() => {
    if (!audioContextRef.current || !soundEnabled) {
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
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
        }

        oscillatorRef.current = audioContextRef.current.createOscillator();
        gainNodeRef.current = audioContextRef.current.createGain();
        filterRef.current = audioContextRef.current.createBiquadFilter();

        oscillatorRef.current.connect(filterRef.current);
        filterRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);

        filterRef.current.type = 'lowpass';
        filterRef.current.frequency.setValueAtTime(1200, audioContextRef.current.currentTime);
        filterRef.current.Q.setValueAtTime(2, audioContextRef.current.currentTime);

        const baseFreq = 200;
        const currentFreq = baseFreq + (multiplier - 1) * 35;
        oscillatorRef.current.frequency.setValueAtTime(currentFreq, audioContextRef.current.currentTime);

        gainNodeRef.current.gain.setValueAtTime(0.02, audioContextRef.current.currentTime);

        oscillatorRef.current.type = 'sawtooth';

        oscillatorRef.current.start();

        // Enhanced vibrato effect
        const lfo = audioContextRef.current.createOscillator();
        const lfoGain = audioContextRef.current.createGain();
        lfo.frequency.setValueAtTime(4, audioContextRef.current.currentTime);
        lfoGain.gain.setValueAtTime(8, audioContextRef.current.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(oscillatorRef.current.frequency);
        lfo.start();

      } catch (error) {
        console.log('Audio playback failed');
      }
    } else {
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

  // Moving planets animation with enhanced movement
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setPlanetPositions(prev => ({
          planet1: { x: prev.planet1.x + 0.2, y: prev.planet1.y + Math.sin(Date.now() * 0.001) * 0.08 },
          planet2: { x: prev.planet2.x + 0.15, y: prev.planet2.y + Math.cos(Date.now() * 0.0008) * 0.06 },
          planet3: { x: prev.planet3.x + 0.25, y: prev.planet3.y + Math.sin(Date.now() * 0.0006) * 0.1 },
          moon1: { x: prev.moon1.x + 0.12, y: prev.moon1.y + Math.cos(Date.now() * 0.0012) * 0.05 },
          moon2: { x: prev.moon2.x + 0.18, y: prev.moon2.y + Math.sin(Date.now() * 0.0009) * 0.07 },
        }));
      }, 40);
      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  // Enhanced fire trail system with better particles
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setFireTrail(prevTrail => {
          const newTrail = [...prevTrail];
          
          const spacemanX = 50;
          const spacemanY = 50;
          
          for (let i = 0; i < 15; i++) {
            const particleId = Date.now() + Math.random() * 1000 + i;
            newTrail.push({ 
              x: spacemanX - 4 - Math.random() * 6,
              y: spacemanY + (Math.random() - 0.5) * 10,
              opacity: 0.9 + Math.random() * 0.1,
              size: 3 + Math.random() * 8,
              type: Math.random() > 0.7 ? 'spark' : Math.random() > 0.4 ? 'flame' : 'ember',
              id: particleId,
              vx: -3 - Math.random() * 2,
              vy: (Math.random() - 0.5) * 2
            });
          }
          
          const updatedTrail = newTrail.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            opacity: particle.opacity - 0.04,
            size: particle.size * 0.95
          })).filter(particle => particle.opacity > 0 && particle.x > -20);
          
          return updatedTrail.slice(-200);
        });
      }, 25);

      return () => clearInterval(interval);
    } else {
      setFireTrail([]);
    }
  }, [gamePhase]);

  // Enhanced flight particles system
  useEffect(() => {
    if (gamePhase === 'flying') {
      const interval = setInterval(() => {
        setFlightParticles(prevParticles => {
          const newParticles = [...prevParticles];
          
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 25;
            const particleId = Date.now() + Math.random() * 1000 + i;
            const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#87CEEB'];
            
            newParticles.push({
              x: 50 + Math.cos(angle) * distance,
              y: 50 + Math.sin(angle) * distance,
              opacity: 0.8 + Math.random() * 0.2,
              size: 2 + Math.random() * 4,
              id: particleId,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              type: Math.random() > 0.6 ? 'star' : Math.random() > 0.3 ? 'sparkle' : 'trail',
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
          
          const updatedParticles = newParticles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            opacity: particle.opacity - 0.02,
            size: particle.size * 0.98
          })).filter(particle => particle.opacity > 0);
          
          return updatedParticles.slice(-150);
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setFlightParticles([]);
    }
  }, [gamePhase]);

  // Explosion particles when crashed
  useEffect(() => {
    if (gamePhase === 'crashed') {
      const explosionParticles = [];
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        const velocity = 5 + Math.random() * 10;
        explosionParticles.push({
          x: 50,
          y: 50,
          opacity: 1,
          size: 3 + Math.random() * 8,
          id: Date.now() + i,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          type: Math.random() > 0.7 ? 'fire' : Math.random() > 0.4 ? 'spark' : 'debris',
          color: Math.random() > 0.7 ? '#FF4500' : Math.random() > 0.4 ? '#FFD700' : '#FF6347'
        });
      }
      setExplosionParticles(explosionParticles);
    } else {
      setExplosionParticles([]);
    }
  }, [gamePhase]);

  // Animate explosion particles
  useEffect(() => {
    if (explosionParticles.length > 0) {
      const interval = setInterval(() => {
        setExplosionParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx * 0.1,
            y: particle.y + particle.vy * 0.1,
            opacity: particle.opacity - 0.02,
            size: particle.size * 0.98,
            vx: particle.vx * 0.95,
            vy: particle.vy * 0.95
          })).filter(particle => particle.opacity > 0)
        );
      }, 50);

      return () => clearInterval(interval);
    }
  }, [explosionParticles.length]);

  // Onomatopoeia overlays based on game events
  useEffect(() => {
    if (gamePhase === 'waiting' && countdown === 1) {
      setOnomatopoeia(prev => [...prev, { id: Date.now(), text: '¡LISTO!', x: 50, y: 30, opacity: 1, scale: 1 }]);
    }
    if (gamePhase === 'flying' && multiplier <= 1.05) {
      setOnomatopoeia(prev => [...prev, { id: Date.now(), text: '¡VÁMONOS!', x: 55, y: 20, opacity: 1, scale: 1 }]);
    }
    if (gamePhase === 'flying' && (Math.abs(multiplier - 2) < 0.02 || Math.abs(multiplier - 5) < 0.02 || Math.abs(multiplier - 10) < 0.02)) {
      const label = multiplier >= 10 ? '¡ÉPICO!' : multiplier >= 5 ? '¡BOOM!' : '¡WOW!';
      setOnomatopoeia(prev => [...prev, { id: Date.now(), text: label, x: 50 + Math.random()*20-10, y: 25 + Math.random()*10, opacity: 1, scale: 1 }]);
    }
    if (gamePhase === 'crashed') {
      setOnomatopoeia(prev => [...prev, { id: Date.now(), text: '¡CRASH!', x: 50, y: 60, opacity: 1, scale: 1 }]);
    }
  }, [gamePhase, countdown, multiplier]);

  // Animate onomatopoeia fade/scale
  useEffect(() => {
    if (onomatopoeia.length === 0) return;
    const interval = setInterval(() => {
      setOnomatopoeia(prev => prev
        .map(o => ({ ...o, opacity: o.opacity - 0.04, scale: o.scale + 0.03 }))
        .filter(o => o.opacity > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, [onomatopoeia.length]);

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
        boxShadow: `0 0 ${particle.size * 3}px rgba(255, 255, 0, ${particle.opacity * 0.8})`
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
        boxShadow: `0 0 ${particle.size * 3}px rgba(255, 69, 0, ${particle.opacity * 0.6})`
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
      boxShadow: `0 0 ${particle.size * 4}px rgba(255, 165, 0, ${particle.opacity * 0.8})`
    };
  };

  const getFlightParticleStyle = (particle: any) => {
    if (particle.type === 'star') {
      return {
        background: `radial-gradient(circle, 
          ${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')} 0%,
          rgba(173, 216, 230, ${particle.opacity * 0.8}) 50%,
          transparent 100%)`,
        filter: 'blur(0.5px)',
        boxShadow: `0 0 ${particle.size * 3}px ${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`
      };
    }
    
    if (particle.type === 'trail') {
      return {
        background: `radial-gradient(circle, 
          rgba(138, 43, 226, ${particle.opacity}) 0%,
          rgba(75, 0, 130, ${particle.opacity * 0.8}) 60%,
          transparent 100%)`,
        filter: 'blur(0.8px)',
        boxShadow: `0 0 ${particle.size * 3}px rgba(138, 43, 226, ${particle.opacity * 0.7})`
      };
    }
    
    return {
      background: `radial-gradient(circle, 
        ${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')} 0%,
        rgba(255, 215, 0, ${particle.opacity * 0.9}) 40%,
        transparent 100%)`,
      filter: 'blur(0.3px)',
      boxShadow: `0 0 ${particle.size * 2}px ${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`
    };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900 overflow-hidden">
      {/* Nebula clouds background */}
      <div className="absolute inset-0">
        {nebulaClouds.map((nebula) => (
          <div
            key={nebula.id}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${nebula.x}%`,
              top: `${nebula.y}%`,
              width: `${nebula.size}px`,
              height: `${nebula.size}px`,
              background: nebula.color,
              opacity: nebula.opacity,
              transform: `translate(-50%, -50%)`
            }}
          />
        ))}
      </div>

      {/* Enhanced stars background */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              opacity: 0.3 + Math.sin(Date.now() * 0.001 + star.id) * 0.4 + 0.3,
              boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
              animation: `twinkle ${star.twinkle}s ease-in-out infinite alternate`,
              animationDelay: `${star.id * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Moving Planets with enhanced effects */}
      <img 
        src="/Planeta (1).png"
        alt="Planet 1"
        className="absolute rounded-full opacity-90 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.planet1.x}%`,
          top: `${planetPositions.planet1.y}%`,
          width: '120px',
          height: '120px',
          transform: gamePhase === 'flying' ? 'scale(1.15)' : 'scale(1)',
          filter: gamePhase === 'flying' ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255,165,0,0.5))' : 'brightness(1)'
        }}
      />
      
      <img 
        src="/Planeta (2).png"
        alt="Planet 2"
        className="absolute rounded-full opacity-90 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.planet2.x}%`,
          top: `${planetPositions.planet2.y}%`,
          width: '100px',
          height: '100px',
          transform: gamePhase === 'flying' ? 'scale(1.15)' : 'scale(1)',
          filter: gamePhase === 'flying' ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255,165,0,0.5))' : 'brightness(1)'
        }}
      />
      
      <img 
        src="/Planeta (3).png"
        alt="Planet 3"
        className="absolute rounded-full opacity-90 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.planet3.x}%`,
          top: `${planetPositions.planet3.y}%`,
          width: '140px',
          height: '140px',
          transform: gamePhase === 'flying' ? 'scale(1.15)' : 'scale(1)',
          filter: gamePhase === 'flying' ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255,165,0,0.5))' : 'brightness(1)'
        }}
      />
      
      <img 
        src="/Planeta (4).png"
        alt="Moon 1"
        className="absolute rounded-full opacity-90 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.moon1.x}%`,
          top: `${planetPositions.moon1.y}%`,
          width: '80px',
          height: '80px',
          transform: gamePhase === 'flying' ? 'scale(1.15)' : 'scale(1)',
          filter: gamePhase === 'flying' ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255,165,0,0.5))' : 'brightness(1)'
        }}
      />
      
      <img 
        src="/Planeta (5).png"
        alt="Moon 2"
        className="absolute rounded-full opacity-90 shadow-2xl transition-all duration-75 ease-linear"
        style={{ 
          left: `${planetPositions.moon2.x}%`,
          top: `${planetPositions.moon2.y}%`,
          width: '90px',
          height: '90px',
          transform: gamePhase === 'flying' ? 'scale(1.15)' : 'scale(1)',
          filter: gamePhase === 'flying' ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255,165,0,0.5))' : 'brightness(1)'
        }}
      />

      {/* Onomatopoeia overlays */}
      {onomatopoeia.map(o => (
        <div
          key={o.id}
          className="absolute z-30 select-none"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            transform: `translate(-50%, -50%) scale(${o.scale})`,
            opacity: o.opacity,
            textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(168,85,247,0.8)'
          }}
        >
          <span className="px-4 py-2 rounded-2xl text-4xl font-extrabold bg-gradient-to-r from-fuchsia-500/30 to-purple-500/30 backdrop-blur-md border border-fuchsia-300/40 text-white">
            {o.text}
          </span>
        </div>
      ))}

      {/* Flight particles */}
      {flightParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            ...getFlightParticleStyle(particle)
          }}
        />
      ))}

      {/* Fire trail particles */}
      {fireTrail.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            ...getFireParticleStyle(particle)
          }}
        />
      ))}

      {/* Explosion particles */}
      {explosionParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            filter: 'blur(1px)'
          }}
        />
      ))}

      {/* UFO Beam with enhanced effect */}
      {gamePhase === 'waiting' && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-12 bg-gradient-to-b from-blue-400/90 to-transparent rounded-full animate-pulse"></div>
          <div className="w-48 h-48 bg-gradient-to-b from-blue-400/30 to-transparent rounded-full mt-2 -ml-12 animate-pulse"></div>
        </div>
      )}

      {/* Enhanced Game Status Text with Beautiful Countdown */}
      {gamePhase === 'waiting' && countdown > 0 && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-xl border border-blue-400/40 rounded-3xl p-10 shadow-2xl">
            <div className="text-white text-4xl font-bold mb-6 drop-shadow-2xl animate-pulse">🚀 NEXT FLIGHT</div>
            
            {/* Beautiful Countdown Circle */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (countdown / 9)}`}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="40%" stopColor="#A78BFA" />
                    <stop offset="70%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Countdown number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-white drop-shadow-2xl animate-pulse">
                  {countdown}
                </span>
              </div>
            </div>
            
            <div className="text-blue-200 text-2xl drop-shadow-xl animate-pulse">
              ✨ Place your bets! ✨
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Multiplier Display */}
      {gamePhase === 'flying' && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-full p-8 mb-4">
              <span className={`text-9xl font-bold ${getMultiplierColor()} drop-shadow-2xl animate-pulse`}
                    style={{ 
                      textShadow: '0 0 40px rgba(255, 255, 255, 0.9), 0 0 80px rgba(255, 255, 255, 0.7)',
                      filter: 'brightness(1.4)',
                      transform: `scale(${1 + (multiplier - 1) * 0.15})`,
                      animation: 'pulse 0.5s ease-in-out infinite'
                    }}>
                {multiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Spaceman with better effects */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 ${
          gamePhase === 'crashed' ? 'animate-bounce scale-150' : ''
        } ${gamePhase === 'flying' ? 'animate-pulse scale-125' : 'scale-110'}`}
      >
        <div className="relative">
          {/* Spaceman with enhanced glow */}
          <div className={`w-56 h-56 flex items-center justify-center overflow-hidden ${
            gamePhase === 'flying' ? 'drop-shadow-[0_0_60px_rgba(255,165,0,0.9)]' : 'drop-shadow-2xl'
          }`}
               style={{
                 filter: gamePhase === 'flying' ? 'brightness(1.6) saturate(1.6) drop-shadow(0 0 35px rgba(255,165,0,0.9))' : 'brightness(1.2)',
                 transform: gamePhase === 'flying' ? `scale(${1 + (multiplier - 1) * 0.08})` : 'scale(1)',
                 animation: gamePhase === 'flying' ? 'pulse 0.3s ease-in-out infinite' : 'none'
               }}>
            <img 
              src="/png-png-urbanbrush-13297 copy.png" 
              alt="Spaceman"
              className="w-full h-full object-contain"
              style={{
                filter: gamePhase === 'flying' ? 'brightness(1.4) saturate(1.4) drop-shadow(0 0 20px rgba(255,165,0,0.8))' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Game Status Messages */}
      {gamePhase === 'crashed' && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-red-500/90 to-red-600/90 border-4 border-red-300/90 rounded-3xl px-16 py-8 backdrop-blur-sm animate-bounce"
               style={{ 
                 boxShadow: '0 0 60px rgba(239, 68, 68, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                 animation: 'shake 0.5s ease-in-out infinite'
               }}>
            <span className="text-red-50 font-bold text-4xl drop-shadow-2xl">💥 CRASHED at {multiplier.toFixed(2)}x!</span>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};