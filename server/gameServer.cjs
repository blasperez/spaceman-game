// PRODUCTION MULTIPLAYER GAME SERVER
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { fileURLToPath } = require('url');

// Import database
const database = require('./database.cjs');
const { pool } = database;

const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://spaceman-game-production.up.railway.app', 'https://lcpsoyorsaevkabvanrw.supabase.co']
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8081',
        'http://127.0.0.1:8081'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// Session configuration (simplified, only for basic session management)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.VITE_JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

app.use(express.json());

// Remove Passport.js authentication (using Supabase Auth instead)
// All authentication is now handled by Supabase on the frontend

// Payment routes handling - simplified for now
app.post('/api/payments/create-payment-intent', (req, res) => {
  res.status(501).json({ error: 'Payment integration pending' });
});

app.post('/api/stripe/webhook', (req, res) => {
  res.status(200).json({ received: true });
});

// Serve static files
const staticPath = path.join(process.cwd(), 'dist');
app.use(express.static(staticPath));

// Explicitly serve manifest and service worker for PWA
app.get('/manifest.webmanifest', (req, res) => {
  res.set('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(process.cwd(), 'public', 'manifest.webmanifest'));
});

app.get('/sw.js', (req, res) => {
  res.set('Service-Worker-Allowed', '/');
  res.sendFile(path.join(process.cwd(), 'dist', 'sw.js'));
});

// API Routes for game functionality (no auth needed, handled by frontend)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get user balance (for authenticated users via Supabase)
app.get('/api/user/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Use Supabase profiles table instead of users
    const result = await pool.query(
      'SELECT balance FROM profiles WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user balance
app.post('/api/user/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { balance } = req.body;
    
    const result = await pool.query(
      'UPDATE profiles SET balance = $2 WHERE id = $1 RETURNING balance',
      [userId, balance]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
  res.status(200).send('OK');
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
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

// Simple in-memory chat buffer (last 100 messages)
let recentChat = [];

// WebSocket server with proper port handling
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  maxPayload: 1024 * 1024 // 1MB max payload
});

// Enhanced crash point generation with better distribution
function generateCrashPoint() {
  // Debias patterns by mixing random sources and adding memory
  const base = Math.random();
  const now = Date.now();
  const jitter = ((now & 0xffff) / 0xffff) * 0.5; // time-based jitter [0,0.5)
  const rand = (base * 0.7) + (Math.sin(now * 0.0007) * 0.15 + 0.15) + (jitter * 0.15);
  const random = Math.min(Math.max(rand, 0), 0.9999);

  // Anti-streak memory: avoid consecutive very-low crashes
  if (!generateCrashPoint.prev) generateCrashPoint.prev = [];
  const history = generateCrashPoint.prev;
  const lastLow = history.length >= 2 && history.slice(-2).every(v => v < 1.4);

  let result;
  if (random < 0.36 || lastLow) result = 1 + Math.random() * 0.5;         // ~36% 1.00-1.50 (guarded)
  else if (random < 0.63)       result = 1.5 + Math.random() * 0.7;        // ~27% 1.50-2.20
  else if (random < 0.80)       result = 2.2 + Math.random() * 1.2;        // ~17% 2.20-3.40
  else if (random < 0.92)       result = 3.4 + Math.random() * 2.2;        // ~12% 3.40-5.60
  else if (random < 0.98)       result = 5.6 + Math.random() * 5.4;        // ~6%  5.60-11.00
  else                          result = 11 + Math.random() * 39;          // ~2%  11.00-50.00

  history.push(result);
  if (history.length > 6) history.shift();
  return result;
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

async function crashGame() {
  console.log(`💥 Game crashed at ${currentGame.multiplier.toFixed(2)}x`);
  
  currentGame.phase = 'crashed';
  
  // Process remaining bets
  let totalLost = 0;
  let totalWon = 0;
  
  for (const [playerId, bet] of currentGame.activeBets.entries()) {
    if (bet.cashedOut) {
      totalWon += bet.winAmount;
    } else {
      bet.winAmount = 0;
      totalLost += bet.betAmount;
      console.log(`❌ ${bet.playerName} lost ${bet.betAmount} (isDemo: ${bet.isDemo})`);
    }

    // Guardar historial de juego - CORREGIDO: quitado is_demo que no existe
    try {
      await pool.query(
        'INSERT INTO game_history (user_id, game_id, bet_amount, multiplier, win_amount) VALUES ($1, $2, $3, $4, $5)',
        [playerId, currentGame.gameId, bet.betAmount, bet.cashOutMultiplier || 0, bet.winAmount]
      );
    } catch (error) {
      console.error('Error guardando historial de juego:', error);
    }
  }
  
  console.log(`💰 Round summary: ${totalWon} won, ${totalLost} lost`);
  
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

  // Send recent chat history to the new client
  try {
    ws.send(JSON.stringify({
      type: 'chat_history',
      data: recentChat.slice(-50)
    }));
  } catch (e) {
    console.error('Error sending chat history:', e);
  }
  
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
async function handlePlayerMessage(ws, message) {
  try {
    const userId = message.data?.userId;
    if (!userId) {
        // Ignorar mensajes sin userId, excepto 'player_join'
        if(message.type !== 'player_join') return;
    }

    switch (message.type) {
      case 'player_join':
        const { userId, userName } = message.data;
        
        if (!userId || !userName) {
          return ws.send(JSON.stringify({ type: 'error', data: { message: 'Missing userId or userName' }}));
        }
        
        currentGame.players.set(userId, { id: userId, name: userName, ws: ws });
        console.log(`✅ Player ${userName} (${userId}) joined`);
        
        // Broadcast system chat message: user joined
        const joinMsg = { id: Date.now(), username: 'Sistema', message: `${userName} se unió`, timestamp: new Date().toISOString(), type: 'system' };
        recentChat.push(joinMsg); if (recentChat.length > 100) recentChat.shift();
        broadcast({ type: 'chat_message', data: joinMsg });
        
        sendGameStateUpdate();
        break;
        
      case 'place_bet':
        if (currentGame.phase === 'waiting') {
          const { userId, userName, betAmount, isDemo } = message.data;
          
          if (!userId || !userName || !betAmount || betAmount < 1) {
            return ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid bet data' }}));
          }

          if (currentGame.activeBets.has(userId)) {
            return ws.send(JSON.stringify({ type: 'error', data: { message: 'You already have an active bet' }}));
          }

          // Verificar balance del usuario
          try {
            await pool.query('BEGIN');
            const userRes = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);
            const user = userRes.rows[0];
            
            if (!user || user.balance < betAmount) {
              await pool.query('ROLLBACK');
              return ws.send(JSON.stringify({ type: 'error', data: { message: 'Fondos insuficientes.' }}));
            }

            // Restar del balance
            await pool.query('UPDATE profiles SET balance = balance - $1 WHERE id = $2', [betAmount, userId]);

            currentGame.activeBets.set(userId, {
              playerId: userId,
              playerName: userName,
              betAmount: betAmount,
              isDemo: isDemo,
              cashedOut: false,
            });
            
            await pool.query('COMMIT');
            console.log(`💰 ${userName} bet ${betAmount} (isDemo: ${isDemo})`);
            sendGameStateUpdate();

          } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error al colocar apuesta:', error);
            return ws.send(JSON.stringify({ type: 'error', data: { message: 'Error al procesar la apuesta.' }}));
          }

        } else {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Cannot place bet during this phase' }}));
        }
        break;
        
      case 'cash_out':
        if (currentGame.phase === 'flying') {
          const { userId } = message.data;
          const bet = currentGame.activeBets.get(userId);
          
          if (!bet || bet.cashedOut) {
            return ws.send(JSON.stringify({ type: 'error', data: { message: 'No active bet found or already cashed out' }}));
          }
          
          bet.cashedOut = true;
          bet.cashOutMultiplier = currentGame.multiplier;
          bet.winAmount = bet.betAmount * currentGame.multiplier;

          // Actualizar balance
          if (!bet.isDemo) {
            try {
              await pool.query(
                'UPDATE profiles SET balance = balance + $1 WHERE id = $2',
                [bet.winAmount, userId]
              );
            } catch (error) {
              console.error('Error actualizando ganancias:', error);
            }
          }
          
          console.log(`💸 ${bet.playerName} cashed out at ${currentGame.multiplier.toFixed(2)}x for ${bet.winAmount.toFixed(2)} (isDemo: ${bet.isDemo})`);
          
          ws.send(JSON.stringify({
            type: 'cash_out_success',
            data: { multiplier: currentGame.multiplier, winAmount: bet.winAmount }
          }));
          
          sendGameStateUpdate();
        } else {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Cannot cash out during this phase' }}));
        }
        break;
        
      case 'chat_message': {
        const { userId, userName, message: text } = message.data || {};
        if (!userId || !userName || !text || typeof text !== 'string') {
          return ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid chat payload' }}));
        }
        const trimmed = text.trim().slice(0, 200);
        if (!trimmed) return;
        const chatMsg = { id: Date.now(), username: userName, message: trimmed, timestamp: new Date().toISOString(), type: 'user' };
        recentChat.push(chatMsg); if (recentChat.length > 100) recentChat.shift();
        broadcast({ type: 'chat_message', data: chatMsg });
        break;
      }
        
      default:
        console.log('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Error handling player message:', error);
    ws.send(JSON.stringify({ type: 'error', data: { message: 'Server error processing message' }}));
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  broadcast({
    type: 'server_shutdown',
    data: { message: 'Server is shutting down for maintenance' }
  });
  
  wss.clients.forEach(client => client.close(1001, 'Server shutdown'));
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Error handling
server.on('error', (error) => console.error('Server error:', error));
wss.on('error', (error) => console.error('WebSocket server error:', error));

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log('🎮 Spaceman Game Server Starting...');
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎯 Ready for multiplayer connections!');
  console.log('✅ /ready endpoint is available for health checks');
  console.log(`📡 WebSocket server ready for connections`);
  startNewRound();
});