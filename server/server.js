const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create Express app
const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict to your domain
    methods: ["GET", "POST"]
  }
});

// Game rooms storage
const gameRooms = new Map();

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room event
  socket.on('joinRoom', (data) => {
    const { roomCode, player } = data;
    
    // Check if room exists
    if (!gameRooms.has(roomCode)) {
      // Create new room if joining as host
      if (player.isHost) {
        const gameRoom = {
          code: roomCode,
          players: [player],
          centerCards: [],
          phase: 'lobby',
          nightActionsCompleted: [],
          dayTimeRemaining: 0,
          nightTimeRemaining: 0,
          actionLog: [],
          created: Date.now()
        };
        
        gameRooms.set(roomCode, gameRoom);
        socket.join(roomCode);
        socket.emit('roomJoined', gameRoom);
        console.log(`Room created: ${roomCode}`);
        return;
      }
      
      // Room doesn't exist and not joining as host
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Room exists, add player
    const gameRoom = gameRooms.get(roomCode);
    
    // Check if player name is taken
    if (gameRoom.players.some(p => p.name === player.name)) {
      socket.emit('error', { message: 'Player name already taken' });
      return;
    }
    
    // Add player to room
    gameRoom.players.push(player);
    gameRooms.set(roomCode, gameRoom);
    
    // Join socket room and notify everyone
    socket.join(roomCode);
    socket.emit('roomJoined', gameRoom);
    socket.to(roomCode).emit('playerJoined', player);
    console.log(`Player ${player.name} joined room ${roomCode}`);
  });

  // Leave room event
  socket.on('leaveRoom', (data) => {
    const { roomCode, playerId } = data;
    
    if (gameRooms.has(roomCode)) {
      const gameRoom = gameRooms.get(roomCode);
      
      // Remove player from room
      gameRoom.players = gameRoom.players.filter(p => p.id !== playerId);
      
      // If room is empty, delete it
      if (gameRoom.players.length === 0) {
        gameRooms.delete(roomCode);
        console.log(`Room deleted: ${roomCode}`);
      } else {
        // If host left, assign new host
        if (!gameRoom.players.some(p => p.isHost)) {
          gameRoom.players[0].isHost = true;
        }
        gameRooms.set(roomCode, gameRoom);
        
        // Notify remaining players
        socket.to(roomCode).emit('playerLeft', { playerId, gameRoom });
      }
      
      socket.leave(roomCode);
    }
  });

  // Game actions
  socket.on('startGame', (data) => {
    const { roomCode, selectedRoles } = data;
    if (gameRooms.has(roomCode)) {
      // Update game state logic would go here
      // ...
      
      // Broadcast to all players
      io.to(roomCode).emit('gameStarted', gameRooms.get(roomCode));
    }
  });

  // Night action
  socket.on('nightAction', (data) => {
    const { roomCode, action, actionData } = data;
    if (gameRooms.has(roomCode)) {
      // Process night action logic
      // ...
      
      // Broadcast to all players
      io.to(roomCode).emit('nightActionPerformed', { action, result: 'success' });
    }
  });

  // Chat message
  socket.on('chatMessage', (data) => {
    const { roomCode, message } = data;
    io.to(roomCode).emit('newChatMessage', message);
  });

  // Vote
  socket.on('vote', (data) => {
    const { roomCode, playerId, votedFor } = data;
    if (gameRooms.has(roomCode)) {
      // Process vote logic
      // ...
      
      // Broadcast to all players
      io.to(roomCode).emit('voteCast', { playerId, votedFor });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Could add logic to handle player disconnection from rooms
  });
});

// Basic health check route
app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 