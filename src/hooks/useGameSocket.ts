import { useEffect, useRef, useState } from 'react';

interface GameState {
  gameId: string;
  phase: 'waiting' | 'flying' | 'crashed';
  multiplier: number;
  countdown: number;
  crashPoint?: number;
  startTime?: number;
}

interface PlayerBet {
  playerId: string;
  playerName: string;
  betAmount: number;
  cashedOut?: boolean;
  cashOutMultiplier?: number;
  winAmount?: number;
}

interface GameSocketData {
  gameState: GameState;
  activeBets: PlayerBet[];
  totalPlayers: number;
  totalBetAmount: number;
}

export const useGameSocket = (userId: string, userName: string) => {
  const [gameData, setGameData] = useState<GameSocketData>({
    gameState: {
      gameId: '',
      phase: 'waiting',
      multiplier: 1.00,
      countdown: 0
    },
    activeBets: [],
    totalPlayers: 0,
    totalBetAmount: 0
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Get WebSocket URL based on environment
  const getWebSocketUrl = () => {
    // Check for environment variable first
    if (import.meta.env.VITE_WEBSOCKET_URL) {
      return import.meta.env.VITE_WEBSOCKET_URL;
    }
    
    // Production URLs - try multiple endpoints
    if (import.meta.env.PROD) {
      const productionUrls = [
        'wss://spaceman-server-production.up.railway.app',
        'wss://spaceman-game-server.herokuapp.com',
        'wss://spaceman-ws.vercel.app'
      ];
      
      // Return first URL for now, could implement fallback logic
      return productionUrls[0];
    }
    
    // Development URL
    return 'ws://localhost:8080';
  };

  // Connect to WebSocket server
  const connect = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      setConnectionStatus('connecting');
      const wsUrl = getWebSocketUrl();
      console.log(`🔌 Attempting to connect to: ${wsUrl}`);
      
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('🟢 Connected to game server');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Send player identification
        socketRef.current?.send(JSON.stringify({
          type: 'player_join',
          data: { userId, userName }
        }));
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (error) {
          console.error('Error parsing server message:', error);
        }
      };
      
      socketRef.current.onclose = (event) => {
        console.log(`🔴 Disconnected from game server (${event.code}): ${event.reason}`);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('❌ Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      
      // Fallback to local simulation if connection fails
      if (import.meta.env.DEV) {
        console.log('🔧 Development mode: Starting local game simulation');
        startLocalSimulation();
      }
    }
  };

  // Local simulation for development when server is not available
  const startLocalSimulation = () => {
    console.log('🎮 Starting local game simulation...');
    setIsConnected(true);
    setConnectionStatus('connected');
    
    // Simulate game rounds
    const simulateRound = () => {
      // Waiting phase
      setGameData(prev => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          phase: 'waiting',
          countdown: 10,
          multiplier: 1.00
        }
      }));
      
      // Countdown
      let countdown = 10;
      const countdownInterval = setInterval(() => {
        countdown--;
        setGameData(prev => ({
          ...prev,
          gameState: {
            ...prev.gameState,
            countdown
          }
        }));
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          startFlying();
        }
      }, 1000);
    };
    
    const startFlying = () => {
      const crashPoint = 1 + Math.random() * 10; // Random crash between 1x and 11x
      
      setGameData(prev => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          phase: 'flying',
          multiplier: 1.00
        }
      }));
      
      // Flying phase
      let multiplier = 1.00;
      const flyingInterval = setInterval(() => {
        multiplier += 0.01 + (multiplier * 0.003);
        
        setGameData(prev => ({
          ...prev,
          gameState: {
            ...prev.gameState,
            multiplier
          }
        }));
        
        if (multiplier >= crashPoint) {
          clearInterval(flyingInterval);
          crash(multiplier);
        }
      }, 100);
    };
    
    const crash = (finalMultiplier: number) => {
      setGameData(prev => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          phase: 'crashed',
          crashPoint: finalMultiplier
        }
      }));
      
      // Start new round after 4 seconds
      setTimeout(simulateRound, 4000);
    };
    
    // Start first round
    simulateRound();
  };

  // Handle messages from server
  const handleServerMessage = (message: any) => {
    switch (message.type) {
      case 'welcome':
        console.log('👋 Server welcome:', message.data.message);
        break;
        
      case 'game_state_update':
        setGameData(prevData => ({
          ...prevData,
          gameState: message.data.gameState,
          activeBets: message.data.activeBets || prevData.activeBets,
          totalPlayers: message.data.totalPlayers || prevData.totalPlayers,
          totalBetAmount: message.data.totalBetAmount || prevData.totalBetAmount
        }));
        break;
        
      case 'player_bets_update':
        setGameData(prevData => ({
          ...prevData,
          activeBets: message.data.activeBets,
          totalPlayers: message.data.totalPlayers,
          totalBetAmount: message.data.totalBetAmount
        }));
        break;
        
      case 'game_crashed':
        setGameData(prevData => ({
          ...prevData,
          gameState: {
            ...prevData.gameState,
            phase: 'crashed',
            crashPoint: message.data.crashPoint
          }
        }));
        console.log(`💥 Game crashed at ${message.data.crashPoint.toFixed(2)}x`);
        break;
        
      case 'cash_out_success':
        console.log(`💰 Cash out successful: ${message.data.winAmount.toFixed(2)} at ${message.data.multiplier.toFixed(2)}x`);
        break;
        
      case 'error':
        console.error('Server error:', message.data.message);
        break;
        
      case 'server_shutdown':
        console.log('🛑 Server shutdown:', message.data.message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Send bet to server
  const placeBet = (betAmount: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'place_bet',
        data: {
          userId,
          userName,
          betAmount,
          gameId: gameData.gameState.gameId
        }
      }));
      console.log(`🎰 Placing bet: €${betAmount}`);
    } else {
      console.warn('Cannot place bet: not connected to server');
      
      // Local simulation fallback
      if (import.meta.env.DEV) {
        console.log('🔧 Local simulation: bet placed');
      }
    }
  };

  // Send cash out to server
  const cashOut = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'cash_out',
        data: {
          userId,
          gameId: gameData.gameState.gameId,
          multiplier: gameData.gameState.multiplier
        }
      }));
      console.log(`💸 Cashing out at ${gameData.gameState.multiplier.toFixed(2)}x`);
    } else {
      console.warn('Cannot cash out: not connected to server');
      
      // Local simulation fallback
      if (import.meta.env.DEV) {
        console.log('🔧 Local simulation: cash out');
      }
    }
  };

  // Manual reconnect function
  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttempts.current = 0;
    setConnectionStatus('connecting');
    connect();
  };

  // Initialize connection
  useEffect(() => {
    if (userId && userName) {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [userId, userName]);

  return {
    gameData,
    isConnected,
    connectionStatus,
    placeBet,
    cashOut,
    reconnect
  };
};
