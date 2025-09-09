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
const roomFileSystem = new Map();

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
  
  roomFileSystem.set(roomId, {
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
  
  // Enhanced language support
  const languageCommands = {
    'javascript': ['node', ['-e', code]],
    'typescript': ['ts-node', ['-e', code]],
    'python': ['python3', ['-c', code]],
    'java': ['java', ['-']],
    'cpp': ['g++', ['-x', 'c++', '-', '-o', '/tmp/program', '&&', '/tmp/program']],
    'c': ['gcc', ['-x', 'c', '-', '-o', '/tmp/program', '&&', '/tmp/program']],
    'go': ['go', ['run', '-']],
    'rust': ['rustc', ['-', '-o', '/tmp/program', '&&', '/tmp/program']],
    'php': ['php', ['-r', code]],
    'ruby': ['ruby', ['-e', code]],
    'shell': ['bash', ['-c', code]]
  };
  
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
    const langCommand = languageCommands[language];
    
    if (!langCommand) {
      clearTimeout(timeout);
      return res.json({ 
        output: `Unsupported language: ${language}. Supported languages: ${Object.keys(languageCommands).join(', ')}`,
        error: true 
      });
    }
    
    const [command, args] = langCommand;
    child = spawn(command, args);
    
    // For languages that need stdin input
    if (['java', 'cpp', 'c', 'go', 'rust'].includes(language)) {
      child.stdin.write(code);
      child.stdin.end();
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
    const files = roomFileSystem.get(roomId) || {};
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
    if (!roomFileSystem.has(roomId)) {
      roomFileSystem.set(roomId, {});
    }
    
    const files = roomFileSystem.get(roomId);
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
    if (!roomFileSystem.has(roomId)) {
      roomFileSystem.set(roomId, {});
    }
    
    const files = roomFileSystem.get(roomId);
    files[fileName] = {
      name: fileName,
      content: content,
      type: 'file',
      createdAt: new Date()
    };
    
    // Broadcast to all users in room
    io.to(roomId).emit('file-created', { fileName, file: files[fileName] });
  });
  
  socket.on('create-folder', ({ folderName, folder, roomId }) => {
    if (!roomFileSystem.has(roomId)) {
      roomFileSystem.set(roomId, {});
    }
    
    const files = roomFileSystem.get(roomId);
    files[folderName] = {
      name: folderName,
      type: 'folder',
      children: {},
      expanded: true,
      createdAt: new Date()
    };
    
    // Broadcast to all users in room
    io.to(roomId).emit('folder-created', { folderName, folder: files[folderName] });
  });
  
  socket.on('delete-item', ({ path, roomId }) => {
    if (roomFileSystem.has(roomId)) {
      const files = roomFileSystem.get(roomId);
      delete files[path];
      
      // Broadcast to all users in room
      io.to(roomId).emit('item-deleted', { path });
    }
  });
  
  socket.on('rename-item', ({ oldPath, newPath, roomId }) => {
    if (roomFileSystem.has(roomId)) {
      const files = roomFileSystem.get(roomId);
      if (files[oldPath]) {
        const item = files[oldPath];
        const newName = newPath.split('/').pop();
        files[newPath] = { ...item, name: newName };
        delete files[oldPath];
        
        // Broadcast to all users in room
        io.to(roomId).emit('item-renamed', { oldPath, newPath });
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
        roomFileSystem.delete(socket.roomId);
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