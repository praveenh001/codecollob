import React, { useState, useEffect, useCallback } from 'react';
import CodeEditor from './components/CodeEditor';
import FileExplorer from './components/FileExplorer';
import Terminal from './components/Terminal';
import UserList from './components/UserList';
import RoomManager from './components/RoomManager';
import useSocket from './hooks/useSocket';
import { api } from './utils/api';
import { FileSystemItem, FileItem, FolderItem, User } from './types';
import { createFile, createFolder, flattenFileSystem } from './utils/fileSystem';

function App() {
  // Room state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // File system state
  const [fileSystem, setFileSystem] = useState<{ [key: string]: FileSystemItem }>({});
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Socket connection
  const { socket, isConnected, error } = useSocket();

  // Get flattened files for compatibility with existing code
  const files = flattenFileSystem(fileSystem);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Store socket ID
    socket.on('connect', () => {
      setCurrentUserId(socket.id);
    });

    // File synchronization
    socket.on('files-sync', (syncedFiles: { [key: string]: FileItem }) => {
      // Convert flat structure to hierarchical for backward compatibility
      const hierarchical: { [key: string]: FileSystemItem } = {};
      
      Object.entries(syncedFiles).forEach(([path, file]) => {
        const parts = path.split('/');
        let current = hierarchical;
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = createFolder(part);
          }
          current = (current[part] as FolderItem).children;
        }
        
        current[parts[parts.length - 1]] = file;
      });
      
      setFileSystem(hierarchical);
      if (Object.keys(syncedFiles).length > 0 && !currentFile) {
        setCurrentFile(Object.keys(syncedFiles)[0]);
      }
    });

    // Real-time code updates
    socket.on('code-update', ({ fileName, content }) => {
      const flatFiles = flattenFileSystem(fileSystem);
      if (flatFiles[fileName]) {
        // Update the file in the hierarchical structure
        updateFileInHierarchy(fileName, content);
      }
    });

    // File operations
    socket.on('file-created', ({ fileName, file }) => {
      addFileToHierarchy(fileName, file);
    });

    socket.on('folder-created', ({ folderName, folder }) => {
      addFolderToHierarchy(folderName, folder);
    });

    socket.on('item-deleted', ({ path }) => {
      removeItemFromHierarchy(path);
    });

    socket.on('item-renamed', ({ oldPath, newPath }) => {
      renameItemInHierarchy(oldPath, newPath);
    });

    // User management
    socket.on('users-list', (usersList: User[]) => {
      setUsers(usersList);
    });

    socket.on('user-joined', ({ user, users: updatedUsers }) => {
      setUsers(updatedUsers);
      setTerminalOutput(prev => [...prev, `👋 ${user.name} joined the room`]);
    });

    socket.on('user-left', ({ userId, users: updatedUsers }) => {
      const leftUser = users.find(u => u.id === userId);
      setUsers(updatedUsers);
      if (leftUser) {
        setTerminalOutput(prev => [...prev, `👋 ${leftUser.name} left the room`]);
      }
    });

    // Code execution
    socket.on('code-executed', ({ output }) => {
      setTerminalOutput(prev => [...prev, '> Code executed by another user:', output]);
      setIsExecuting(false);
    });

    // Error handling
    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      setTerminalOutput(prev => [...prev, `❌ Error: ${message}`]);
    });

    return () => {
      socket.off('connect');
      socket.off('files-sync');
      socket.off('code-update');
      socket.off('file-created');
      socket.off('folder-created');
      socket.off('item-deleted');
      socket.off('item-renamed');
      socket.off('users-list');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('code-executed');
      socket.off('error');
    };
  }, [socket, currentFile, users, fileSystem]);

  // Helper functions for hierarchical file system
  const updateFileInHierarchy = (path: string, content: string) => {
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      const parts = path.split('/');
      let current: any = newFileSystem;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]].children;
      }
      
      const fileName = parts[parts.length - 1];
      if (current[fileName] && current[fileName].type === 'file') {
        current[fileName] = { ...current[fileName], content };
      }
      
      return newFileSystem;
    });
  };

  const addFileToHierarchy = (path: string, file: FileItem) => {
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      const parts = path.split('/');
      let current: any = newFileSystem;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = createFolder(part);
        }
        current = current[part].children;
      }
      
      current[parts[parts.length - 1]] = file;
      return newFileSystem;
    });
  };

  const addFolderToHierarchy = (path: string, folder: FolderItem) => {
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      const parts = path.split('/');
      let current: any = newFileSystem;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = createFolder(part);
        }
        current = current[part].children;
      }
      
      current[parts[parts.length - 1]] = folder;
      return newFileSystem;
    });
  };

  const removeItemFromHierarchy = (path: string) => {
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      const parts = path.split('/');
      let current: any = newFileSystem;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]].children;
      }
      
      delete current[parts[parts.length - 1]];
      
      if (currentFile === path) {
        const remainingFiles = Object.keys(flattenFileSystem(newFileSystem));
        setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
      }
      
      return newFileSystem;
    });
  };

  const renameItemInHierarchy = (oldPath: string, newPath: string) => {
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      
      // Get the item to rename
      const oldParts = oldPath.split('/');
      let oldCurrent: any = newFileSystem;
      for (let i = 0; i < oldParts.length - 1; i++) {
        oldCurrent = oldCurrent[oldParts[i]].children;
      }
      const item = oldCurrent[oldParts[oldParts.length - 1]];
      
      // Add to new location
      const newParts = newPath.split('/');
      let newCurrent: any = newFileSystem;
      for (let i = 0; i < newParts.length - 1; i++) {
        newCurrent = newCurrent[newParts[i]].children;
      }
      newCurrent[newParts[newParts.length - 1]] = { ...item, name: newParts[newParts.length - 1] };
      
      // Remove from old location
      delete oldCurrent[oldParts[oldParts.length - 1]];
      
      if (currentFile === oldPath) {
        setCurrentFile(newPath);
      }
      
      return newFileSystem;
    });
  };

  // Room management functions
  const createRoom = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.createRoom();
      // Room creation handled in RoomManager component
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, userName: string) => {
    if (!socket) return;
    
    setIsLoading(true);
    try {
      // Validate room exists
      const roomCheck = await api.checkRoom(roomId);
      
      if (!roomCheck.exists) {
        setTerminalOutput(prev => [...prev, `❌ Room ${roomId} not found`]);
        return;
      }

      // Join the room via socket
      socket.emit('join-room', { roomId, userName });
      
      setRoomId(roomId);
      setUserName(userName);
      setIsInRoom(true);
      setTerminalOutput([`🚀 Welcome to room ${roomId}!`, `📝 You can start coding now...`]);
      
    } catch (error) {
      console.error('Failed to join room:', error);
      setTerminalOutput(prev => [...prev, `❌ Failed to join room: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  }, [socket]);

  // File operations
  const handleFileSelect = useCallback((filePath: string) => {
    setCurrentFile(filePath);
  }, []);

  const handleFileCreate = useCallback((parentPath: string, fileName: string) => {
    if (!socket || !roomId) return;
    
    const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const file = createFile(fileName);
    
    socket.emit('create-file', { 
      fileName: fullPath, 
      content: file.content, 
      roomId 
    });
  }, [socket, roomId]);

  const handleFolderCreate = useCallback((parentPath: string, folderName: string) => {
    if (!socket || !roomId) return;
    
    const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
    const folder = createFolder(folderName);
    
    socket.emit('create-folder', { 
      folderName: fullPath, 
      folder, 
      roomId 
    });
  }, [socket, roomId]);

  const handleItemDelete = useCallback((path: string) => {
    if (!socket || !roomId) return;
    
    socket.emit('delete-item', { path, roomId });
  }, [socket, roomId]);

  const handleItemRename = useCallback((oldPath: string, newName: string) => {
    if (!socket || !roomId) return;
    
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    socket.emit('rename-item', { oldPath, newPath, roomId });
  }, [socket, roomId]);

  const handleFolderToggle = useCallback((path: string) => {
    setFileSystem(prev => {
      const newFileSystem = { ...prev };
      const parts = path.split('/');
      let current: any = newFileSystem;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]].children;
      }
      
      const folder = current[parts[parts.length - 1]];
      if (folder && folder.type === 'folder') {
        folder.expanded = !folder.expanded;
      }
      
      return newFileSystem;
    });
  }, []);

  // Code editing
  const handleCodeChange = useCallback((content: string) => {
    if (!currentFile || !socket || !roomId) return;
    
    updateFileInHierarchy(currentFile, content);
    socket.emit('code-change', { fileName: currentFile, content, roomId });
  }, [currentFile, socket, roomId]);

  const handleCursorChange = useCallback((position: any) => {
    if (!socket || !roomId) return;
    
    socket.emit('cursor-change', { position, roomId });
  }, [socket, roomId]);

  // Code execution
  const handleCodeExecute = useCallback(async (code: string, language: string) => {
    if (!roomId) return;
    
    setIsExecuting(true);
    setTerminalOutput(prev => [...prev, `> Executing ${language} code...`]);
    
    try {
      const result = await api.executeCode(code, language, roomId);
      setTerminalOutput(prev => [...prev, result.output]);
    } catch (error) {
      setTerminalOutput(prev => [...prev, `❌ Execution failed: ${error}`]);
    } finally {
      setIsExecuting(false);
    }
  }, [roomId]);

  // Show connection error
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p>{error}</p>
          </div>
          <p className="text-gray-600">Make sure the backend server is running on port 3001</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show room manager if not in room
  if (!isInRoom) {
    return (
      <RoomManager
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        isLoading={isLoading}
      />
    );
  }

  // Main application interface
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">CodeCollab</h1>
            <div className="text-sm text-gray-500">
              Room: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 border-r border-gray-300">
          <FileExplorer
            items={fileSystem}
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFolderCreate={handleFolderCreate}
            onItemDelete={handleItemDelete}
            onItemRename={handleItemRename}
            onFolderToggle={handleFolderToggle}
          />
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          {currentFile && files[currentFile] ? (
            <>
              <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center gap-2">
                <span className="text-sm font-medium">{currentFile}</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <CodeEditor
                  fileName={currentFile}
                  content={files[currentFile]?.content || ''}
                  language="javascript"
                  onChange={handleCodeChange}
                  onCursorChange={handleCursorChange}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No file selected</p>
                <p className="text-sm">Create a file or select one from the explorer</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col border-l border-gray-300">
          {/* Terminal */}
          <div className="flex-1 border-b border-gray-300">
            <Terminal
              output={terminalOutput}
              isExecuting={isExecuting}
              onExecute={handleCodeExecute}
              currentFile={currentFile}
              files={files}
            />
          </div>

          {/* User List */}
          <div className="h-64">
            <UserList users={users} currentUserId={currentUserId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;