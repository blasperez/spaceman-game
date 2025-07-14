import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.VITE_APP_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos de Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware para JSON
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// Game state
let gameState = {
  players: new Map(),
  gameActive: false,
  multiplier: 1.0,
  crashed: false
};

// Socket.IO para el juego
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('join-game', (playerData) => {
    gameState.players.set(socket.id, {
      id: socket.id,
      name: playerData.name || 'Anónimo',
      balance: playerData.balance || 1000,
      bet: 0,
      active: true
    });
    
    socket.emit('game-state', {
      multiplier: gameState.multiplier,
      gameActive: gameState.gameActive,
      players: Array.from(gameState.players.values())
    });
  });
  
  socket.on('place-bet', (betAmount) => {
    const player = gameState.players.get(socket.id);
    if (player && !gameState.gameActive && betAmount <= player.balance) {
      player.bet = betAmount;
      player.balance -= betAmount;
      gameState.players.set(socket.id, player);
      
      io.emit('player-bet', {
        playerId: socket.id,
        playerName: player.name,
        bet: betAmount
      });
    }
  });
  
  socket.on('cash-out', () => {
    const player = gameState.players.get(socket.id);
    if (player && gameState.gameActive && player.bet > 0) {
      const winnings = player.bet * gameState.multiplier;
      player.balance += winnings;
      player.bet = 0;
      gameState.players.set(socket.id, player);
      
      socket.emit('cash-out-success', {
        multiplier: gameState.multiplier,
        winnings: winnings,
        newBalance: player.balance
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    gameState.players.delete(socket.id);
  });
});

// Lógica del juego
function startGame() {
  gameState.gameActive = true;
  gameState.multiplier = 1.0;
  gameState.crashed = false;
  
  io.emit('game-started');
  
  const gameInterval = setInterval(() => {
    if (!gameState.gameActive) {
      clearInterval(gameInterval);
      return;
    }
    
    // Incrementar multiplicador
    gameState.multiplier += 0.01;
    
    // Probabilidad de crash aumenta con el multiplicador
    const crashProbability = 0.01 * (gameState.multiplier - 1);
    
    if (Math.random() < crashProbability) {
      // Game crashed
      gameState.gameActive = false;
      gameState.crashed = true;
      
      io.emit('game-crashed', {
        multiplier: gameState.multiplier
      });
      
      clearInterval(gameInterval);
      
      // Reiniciar después de 5 segundos
      setTimeout(() => {
        startGame();
      }, 5000);
    } else {
      // Enviar actualización del multiplicador
      io.emit('multiplier-update', {
        multiplier: gameState.multiplier
      });
    }
  }, 100);
}

// Todas las rutas deben devolver el archivo HTML para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Iniciar el juego
  setTimeout(() => {
    startGame();
  }, 2000);
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});