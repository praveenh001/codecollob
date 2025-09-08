const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// In-memory storage for rooms
const rooms = new Map();
const roomFiles = new Map();

// Room structure: { id, users: [], files: {}, currentFile: null }

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Create a new room
app.post('/api/rooms/create', (req, res) => {
  const roomId = uuidv4().substring(0, 8);
  
  rooms.set(roomId, {
    id: roomId,
    users: [],
    createdAt: new Date()
  });
  
  roomFiles.set(roomId, {
    'main.js': {
      name: 'main.js',
      content: '// Welcome to the collaborative code editor!\nconsole.log("Hello, World!");',
      type: 'file'
    }
  });
  
  res.json({ roomId, message: 'Room created successfully' });
});

// Join room validation
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (rooms.has(roomId)) {
    res.json({ exists: true, room: rooms.get(roomId) });
  } else {
    res.status(404).json({ exists: false, message: 'Room not found' });
  }
});

// Execute code endpoint
app.post('/api/execute', (req, res) => {
  const { code, language, roomId } = req.body;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  let child;
  let output = '';
  let errorOutput = '';
  
  const timeout = setTimeout(() => {
    if (child) {
      child.kill();
    }
    res.json({ 
      output: output + '\n[Execution timed out after 10 seconds]',
      error: true 
    });
  }, 10000);
  
  try {
    if (language === 'javascript') {
      child = spawn('node', ['-e', code]);
    } else if (language === 'python') {
      child = spawn('python3', ['-c', code]);
    } else {
      clearTimeout(timeout);
      return res.json({ 
        output: 'Unsupported language. Only JavaScript and Python are supported.',
        error: true 
      });
    }
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      const finalOutput = output + (errorOutput ? `\nError: ${errorOutput}` : '');
      
      // Broadcast execution result to room
      io.to(roomId).emit('code-executed', {
        output: finalOutput,
        exitCode: code
      });
      
      res.json({ 
        output: finalOutput, 
        exitCode: code,
        error: code !== 0 
      });
    });
    
  } catch (error) {
    clearTimeout(timeout);
    res.json({ 
      output: `Execution error: ${error.message}`,
      error: true 
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room
  socket.on('join-room', ({ roomId, userName }) => {
    if (!rooms.has(roomId)) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName;
    
    const room = rooms.get(roomId);
    room.users.push({ id: socket.id, name: userName, joinedAt: new Date() });
    
    // Send current files to the newly joined user
    const files = roomFiles.get(roomId) || {};
    socket.emit('files-sync', files);
    
    // Notify other users
    socket.to(roomId).emit('user-joined', { 
      user: { id: socket.id, name: userName },
      users: room.users
    });
    
    // Send current users list to the joined user
    socket.emit('users-list', room.users);
    
    console.log(`${userName} joined room ${roomId}`);
  });
  
  // Handle code changes
  socket.on('code-change', ({ fileName, content, roomId }) => {
    if (!roomFiles.has(roomId)) {
      roomFiles.set(roomId, {});
    }
    
    const files = roomFiles.get(roomId);
    if (files[fileName]) {
      files[fileName].content = content;
      
      // Broadcast to other users in the room
      socket.to(roomId).emit('code-update', { fileName, content });
    }
  });
  
  // Handle cursor position changes
  socket.on('cursor-change', ({ position, roomId }) => {
    socket.to(roomId).emit('cursor-update', { 
      userId: socket.id, 
      userName: socket.userName,
      position 
    });
  });
  
  // File operations
  socket.on('create-file', ({ fileName, content = '', roomId }) => {
    if (!roomFiles.has(roomId)) {
      roomFiles.set(roomId, {});
    }
    
    const files = roomFiles.get(roomId);
    files[fileName] = {
      name: fileName,
      content: content,
      type: 'file',
      createdAt: new Date()
    };
    
    // Broadcast to all users in room
    io.to(roomId).emit('file-created', { fileName, file: files[fileName] });
  });
  
  socket.on('delete-file', ({ fileName, roomId }) => {
    if (roomFiles.has(roomId)) {
      const files = roomFiles.get(roomId);
      delete files[fileName];
      
      // Broadcast to all users in room
      io.to(roomId).emit('file-deleted', { fileName });
    }
  });
  
  socket.on('rename-file', ({ oldName, newName, roomId }) => {
    if (roomFiles.has(roomId)) {
      const files = roomFiles.get(roomId);
      if (files[oldName]) {
        files[newName] = { ...files[oldName], name: newName };
        delete files[oldName];
        
        // Broadcast to all users in room
        io.to(roomId).emit('file-renamed', { oldName, newName });
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      room.users = room.users.filter(user => user.id !== socket.id);
      
      // Notify other users
      socket.to(socket.roomId).emit('user-left', { 
        userId: socket.id,
        users: room.users
      });
      
      // Clean up empty rooms
      if (room.users.length === 0) {
        rooms.delete(socket.roomId);
        roomFiles.delete(socket.roomId);
        console.log(`Room ${socket.roomId} deleted (empty)`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});