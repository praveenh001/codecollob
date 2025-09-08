# 🚀 CodeCollab - Collaborative Code Editor

A real-time collaborative code editor that allows multiple users to code together in shared rooms with live synchronization, file management, and code execution capabilities.

## ✨ Features

### 🔄 Real-time Collaboration
- **Live Code Synchronization**: See changes from other users instantly
- **Multi-user Support**: Multiple developers can work in the same room
- **User Presence**: See who's online and their cursor positions
- **Room Management**: Create or join rooms using unique IDs

### 📁 File Management
- **File Explorer**: Create, rename, and delete files
- **Multiple File Support**: Work with multiple files simultaneously
- **Syntax Highlighting**: Support for JavaScript, Python, HTML, CSS, and more
- **Auto-save**: Changes are automatically synchronized

### ⚡ Code Execution
- **Multi-language Support**: Execute JavaScript and Python code
- **Live Terminal**: See execution output in real-time
- **Shared Results**: Code execution results are shared with all room members
- **Error Handling**: Clear error messages and timeout protection

### 🎨 Modern UI
- **Clean Interface**: Professional, responsive design
- **Dark Theme**: Easy on the eyes for long coding sessions
- **Split Panels**: File explorer, code editor, terminal, and user list
- **Monaco Editor**: Powered by VS Code's editor technology

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **Socket.IO Client** for real-time communication
- **Vite** for fast development

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket communication
- **UUID** for unique room generation
- **CORS** for cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd collaborative-code-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install both frontend and backend dependencies.

### Running the Application

#### Option 1: Run Both Frontend and Backend Together
```bash
npm start
```
This starts both the backend server (port 3001) and frontend development server (port 5173).

#### Option 2: Run Separately

**Start the backend server:**
```bash
npm run backend:dev
```
The backend server runs on http://localhost:3001

**Start the frontend (in a new terminal):**
```bash
npm run dev
```
The frontend runs on http://localhost:5173

### Usage

1. **Open your browser** and go to http://localhost:5173
2. **Enter your name** in the welcome screen
3. **Create a new room** or **join an existing room** with a room ID
4. **Start coding!** Create files, write code, and see real-time updates from other users
5. **Execute code** by selecting a file and clicking the "Run" button in the terminal

## 📂 Project Structure

```
collaborative-code-editor/
├── backend/                 # Backend server
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── CodeEditor.tsx  # Monaco code editor wrapper
│   │   ├── FileExplorer.tsx# File management panel
│   │   ├── Terminal.tsx    # Code execution terminal
│   │   ├── UserList.tsx    # Connected users display
│   │   └── RoomManager.tsx # Room creation/joining
│   ├── hooks/              # Custom React hooks
│   │   └── useSocket.ts    # Socket.IO connection hook
│   ├── utils/              # Utility functions
│   │   └── api.ts          # API communication
│   └── App.tsx             # Main application component
├── package.json            # Main dependencies and scripts
└── README.md              # This file
```

## 🔧 API Endpoints

### REST Endpoints
- `POST /api/rooms/create` - Create a new room
- `GET /api/rooms/:roomId` - Check if room exists
- `POST /api/execute` - Execute code
- `GET /api/health` - Server health check

### Socket.IO Events
- `join-room` - Join a collaboration room
- `code-change` - Broadcast code changes
- `cursor-change` - Share cursor positions
- `create-file` - Create new files
- `delete-file` - Delete files
- `rename-file` - Rename files

## 🌟 Key Features Explained

### Real-time Synchronization
The application uses Socket.IO to provide real-time collaboration:
- Code changes are instantly synchronized across all clients
- User presence and cursor positions are shared
- File operations (create, delete, rename) are broadcasted

### Code Execution
Secure code execution is handled server-side:
- JavaScript execution using Node.js
- Python execution using Python 3
- 10-second timeout for long-running code
- Output streaming to all room participants

### Room Management
Each room is isolated with:
- Unique UUID-based room IDs
- Per-room file systems stored in memory
- User management with join/leave notifications
- Automatic cleanup of empty rooms

## 🔒 Security Considerations

- Code execution is sandboxed using child processes
- Execution timeout prevents infinite loops
- CORS configuration restricts origins
- Input validation on all API endpoints

## 🚀 Deployment

### Local Development
The application is designed to run locally with:
```bash
npm start
```

### Production Deployment
For production deployment:

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Configure environment variables:**
   - Set proper CORS origins
   - Configure production Socket.IO settings

3. **Deploy backend and frontend** to your preferred hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Troubleshooting

### Common Issues

1. **Backend connection fails:**
   - Ensure the backend server is running on port 3001
   - Check that no other application is using port 3001
   - Verify CORS settings if accessing from different origins

2. **Code execution not working:**
   - Ensure Node.js and Python 3 are installed on the server
   - Check server logs for execution errors
   - Verify child_process permissions

3. **Real-time updates not working:**
   - Check browser console for Socket.IO connection errors
   - Ensure WebSocket connections are not blocked by firewalls
   - Try refreshing the page to reconnect

### Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the terminal for server errors
3. Ensure all dependencies are properly installed
4. Create an issue in the repository with error details

---

**Happy Coding! 🎉**

Built with ❤️ for the developer community.