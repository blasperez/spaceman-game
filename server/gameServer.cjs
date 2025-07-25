// PRODUCTION MULTIPLAYER GAME SERVER
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

(async () => {
// Import dinámico de database y paymentRoutes
const { pool } = await import('./database.js');
const paymentRoutes = (await import('./paymentRoutes.js')).default;

const app = express();
const server = http.createServer(app);

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://spaceman-game-production.up.railway.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Webhook debe ir antes de express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Registrar las rutas de pago
app.use('/api/payments', paymentRoutes);



// Servir archivos estáticos desde la carpeta dist (donde Vite genera el build)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Health check endpoint for Railway y readiness probe
app.get('/ready', (req, res) => {
  res.status(200).send('OK');
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


// Ruta principal para servir index.html desde dist
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Manejar rutas de React (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
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

    // Guardar historial de juego
    try {
      await pool.query(
        'INSERT INTO game_history (user_id, game_id, bet_amount, multiplier, win_amount, is_demo) VALUES ($1, $2, $3, $4, $5, $6)',
        [playerId, currentGame.gameId, bet.betAmount, bet.cashOutMultiplier || null, bet.winAmount, bet.isDemo]
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
            const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
            const user = userRes.rows[0];

            let balanceField = isDemo ? 'balance_demo' : 'balance_deposited';
            
            if (!user || user[balanceField] < betAmount) {
              await pool.query('ROLLBACK');
              return ws.send(JSON.stringify({ type: 'error', data: { message: 'Fondos insuficientes.' }}));
            }

            // Restar del balance
            await pool.query(`UPDATE users SET ${balanceField} = ${balanceField} - $1 WHERE id = $2`, [betAmount, userId]);

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

          // Actualizar balance de ganancias si no es demo
          if (!bet.isDemo) {
            try {
              await pool.query(
                'UPDATE users SET balance_winnings = balance_winnings + $1, balance_deposited = balance_deposited + $2 WHERE id = $3',
                [bet.winAmount, bet.betAmount, userId] // Devolver la apuesta original a depositado
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

// Start the server
server.listen(PORT, () => {
  console.log('🎮 Spaceman Game Server Starting...');
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎯 Ready for multiplayer connections!');
  console.log('✅ /ready endpoint is available for health checks');
  startNewRound();
});

// Error handling
server.on('error', (error) => console.error('Server error:', error));
wss.on('error', (error) => console.error('WebSocket server error:', error));
})();
