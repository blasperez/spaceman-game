// PRODUCTION MULTIPLAYER GAME SERVER
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-spaceman-game.vercel.app', 'https://spaceman-crash.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Servir archivos estáticos desde la carpeta dist (donde Vite genera el build)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Ruta principal para servir index.html desde dist
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Manejar rutas de React (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    players: currentGame.players.size,
    gamePhase: currentGame.phase
  });
});

// Game state
let currentGame = {
  gameId: generateGameId(),
  phase: 'waiting', // 'waiting', 'flying', 'crashed'
  multiplier: 1.00,
  countdown: 10,
  crashPoint: null,
  startTime: null,
  activeBets: new Map(), // playerId -> bet info
  players: new Map() // playerId -> player info
};

// WebSocket server with proper port handling
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  maxPayload: 1024 * 1024 // 1MB max payload
});

// Enhanced crash point generation with better distribution
function generateCrashPoint() {
  const random = Math.random();
  
  // More realistic crash distribution
  if (random < 0.40) return 1 + Math.random() * 0.5;      // 40% chance: 1.00x - 1.50x
  if (random < 0.65) return 1.5 + Math.random() * 0.5;    // 25% chance: 1.50x - 2.00x
  if (random < 0.82) return 2 + Math.random() * 1;        // 17% chance: 2.00x - 3.00x
  if (random < 0.93) return 3 + Math.random() * 2;        // 11% chance: 3.00x - 5.00x
  if (random < 0.98) return 5 + Math.random() * 5;        // 5% chance:  5.00x - 10.00x
  return 10 + Math.random() * 40;                         // 2% chance:  10.00x - 50.00x
}

function generateGameId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Enhanced broadcast with error handling
function broadcast(message) {
  const messageStr = JSON.stringify(message);
  let sentCount = 0;
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    }
  });
  
  console.log(`📡 Broadcasted to ${sentCount} clients: ${message.type}`);
}

// Send comprehensive game state update
function sendGameStateUpdate() {
  const activeBetsArray = Array.from(currentGame.activeBets.values());
  const totalBetAmount = activeBetsArray.reduce((sum, bet) => sum + bet.betAmount, 0);
  
  broadcast({
    type: 'game_state_update',
    data: {
      gameState: {
        gameId: currentGame.gameId,
        phase: currentGame.phase,
        multiplier: currentGame.multiplier,
        countdown: currentGame.countdown,
        crashPoint: currentGame.phase === 'crashed' ? currentGame.crashPoint : null
      },
      activeBets: activeBetsArray,
      totalPlayers: currentGame.players.size,
      totalBetAmount
    }
  });
}

// Enhanced game loop with better timing
function startNewRound() {
  console.log('🚀 Starting new round...');
  
  currentGame = {
    gameId: generateGameId(),
    phase: 'waiting',
    multiplier: 1.00,
    countdown: 10,
    crashPoint: generateCrashPoint(),
    startTime: null,
    activeBets: new Map(),
    players: currentGame.players // Keep connected players
  };
  
  console.log(`🎯 Target crash point: ${currentGame.crashPoint.toFixed(2)}x`);
  sendGameStateUpdate();
  
  // Countdown phase with precise timing
  const countdownInterval = setInterval(() => {
    currentGame.countdown--;
    sendGameStateUpdate();
    
    if (currentGame.countdown <= 0) {
      clearInterval(countdownInterval);
      startFlightPhase();
    }
  }, 1000);
}

function startFlightPhase() {
  console.log(`✈️ Flight started! Target: ${currentGame.crashPoint.toFixed(2)}x`);
  
  currentGame.phase = 'flying';
  currentGame.startTime = Date.now();
  currentGame.multiplier = 1.00;
  
  sendGameStateUpdate();
  
  // Flight phase with smooth multiplier increase
  const flightInterval = setInterval(() => {
    // Smooth multiplier progression
    const increment = 0.01 + (currentGame.multiplier * 0.003);
    currentGame.multiplier += increment;
    
    sendGameStateUpdate();
    
    // Check if we should crash
    if (currentGame.multiplier >= currentGame.crashPoint) {
      clearInterval(flightInterval);
      crashGame();
    }
  }, 100); // 100ms intervals for smooth animation
}

function crashGame() {
  console.log(`💥 Game crashed at ${currentGame.multiplier.toFixed(2)}x`);
  
  currentGame.phase = 'crashed';
  
  // Process remaining bets (they lose)
  let totalLost = 0;
  let totalWon = 0;
  
  currentGame.activeBets.forEach((bet, playerId) => {
    if (!bet.cashedOut) {
      bet.winAmount = 0;
      totalLost += bet.betAmount;
      console.log(`❌ ${bet.playerName} lost €${bet.betAmount}`);
    } else {
      totalWon += bet.winAmount;
    }
  });
  
  console.log(`💰 Round summary: €${totalWon} won, €${totalLost} lost`);
  
  broadcast({
    type: 'game_crashed',
    data: {
      crashPoint: currentGame.multiplier,
      finalBets: Array.from(currentGame.activeBets.values()),
      roundSummary: { totalWon, totalLost }
    }
  });
  
  sendGameStateUpdate();
  
  // Start new round after 4 seconds
  setTimeout(() => {
    startNewRound();
  }, 4000);
}

// Enhanced WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`👤 New player connected from ${clientIP}`);
  
  // Send welcome message with current game state
  ws.send(JSON.stringify({
    type: 'welcome',
    data: {
      message: 'Connected to Spaceman server',
      serverTime: new Date().toISOString()
    }
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handlePlayerMessage(ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  });
  
  ws.on('close', (code, reason) => {
    // Remove player from game
    for (const [playerId, playerData] of currentGame.players.entries()) {
      if (playerData.ws === ws) {
        console.log(`👋 Player ${playerData.name} disconnected (${code})`);
        currentGame.players.delete(playerId);
        currentGame.activeBets.delete(playerId);
        sendGameStateUpdate();
        break;
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Send current game state to new player
  sendGameStateUpdate();
});

// Enhanced message handling with validation
function handlePlayerMessage(ws, message) {
  try {
    switch (message.type) {
      case 'player_join':
        const { userId, userName } = message.data;
        
        if (!userId || !userName) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Missing userId or userName' }
          }));
          return;
        }
        
        currentGame.players.set(userId, {
          id: userId,
          name: userName,
          ws: ws,
          joinedAt: new Date().toISOString()
        });
        
        console.log(`✅ Player ${userName} (${userId}) joined`);
        sendGameStateUpdate();
        break;
        
      case 'place_bet':
        if (currentGame.phase === 'waiting') {
          const { userId, userName, betAmount } = message.data;
          
          if (!userId || !userName || !betAmount || betAmount <= 0) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Invalid bet data' }
            }));
            return;
          }
          
          // Check if player already has a bet
          if (currentGame.activeBets.has(userId)) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'You already have an active bet' }
            }));
            return;
          }
          
          currentGame.activeBets.set(userId, {
            playerId: userId,
            playerName: userName,
            betAmount: betAmount,
            cashedOut: false,
            placedAt: new Date().toISOString()
          });
          
          console.log(`💰 ${userName} bet €${betAmount}`);
          sendGameStateUpdate();
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Cannot place bet during this phase' }
          }));
        }
        break;
        
      case 'cash_out':
        if (currentGame.phase === 'flying') {
          const { userId } = message.data;
          const bet = currentGame.activeBets.get(userId);
          
          if (!bet) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'No active bet found' }
            }));
            return;
          }
          
          if (bet.cashedOut) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Already cashed out' }
            }));
            return;
          }
          
          bet.cashedOut = true;
          bet.cashOutMultiplier = currentGame.multiplier;
          bet.winAmount = bet.betAmount * currentGame.multiplier;
          bet.cashedOutAt = new Date().toISOString();
          
          console.log(`💸 ${bet.playerName} cashed out at ${currentGame.multiplier.toFixed(2)}x for €${bet.winAmount.toFixed(2)}`);
          
          // Send individual confirmation
          ws.send(JSON.stringify({
            type: 'cash_out_success',
            data: {
              multiplier: currentGame.multiplier,
              winAmount: bet.winAmount
            }
          }));
          
          sendGameStateUpdate();
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Cannot cash out during this phase' }
          }));
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Unknown message type' }
        }));
    }
  } catch (error) {
    console.error('Error handling player message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Server error processing message' }
    }));
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Notify all clients
  broadcast({
    type: 'server_shutdown',
    data: { message: 'Server is shutting down for maintenance' }
  });
  
  // Close all connections
  wss.clients.forEach(client => {
    client.close(1001, 'Server shutdown');
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log('🎮 Spaceman Game Server Starting...');
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎯 Ready for multiplayer connections!');
  
  // Start the first round
  startNewRound();
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});
