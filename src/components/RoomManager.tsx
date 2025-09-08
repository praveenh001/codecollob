import React, { useState } from 'react';
import { 
  Plus, 
  LogIn, 
  Copy, 
  Check, 
  Code, 
  Users, 
  Zap 
} from 'lucide-react';

interface RoomManagerProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  isLoading: boolean;
}

const RoomManager: React.FC<RoomManagerProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading
}) => {
  const [mode, setMode] = useState<'home' | 'join' | 'create'>('home');
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoinRoom = () => {
    if (roomId.trim() && userName.trim()) {
      onJoinRoom(roomId.trim(), userName.trim());
    }
  };

  const handleCreateRoom = async () => {
    if (userName.trim()) {
      try {
        const response = await fetch('http://localhost:3001/api/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNewRoomId(data.roomId);
          setMode('create');
        }
      } catch (error) {
        console.error('Failed to create room:', error);
      }
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(newRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinCreatedRoom = () => {
    if (newRoomId && userName.trim()) {
      onJoinRoom(newRoomId, userName.trim());
    }
  };

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Room Created!</h2>
            <p className="text-gray-300">Share the room ID with others to collaborate</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Room ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoomId}
                readOnly
                className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={copyRoomId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={joinCreatedRoom}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Code className="w-4 h-4" />
              Enter Room
            </button>
            <button
              onClick={() => setMode('home')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-6">
            <LogIn className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Join Room</h2>
            <p className="text-gray-300">Enter the room ID to start collaborating</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoinRoom}
              disabled={!roomId.trim() || !userName.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Join Room
            </button>
            <button
              onClick={() => setMode('home')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CodeCollab</h1>
          <p className="text-gray-300">Real-time collaborative code editor</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCreateRoom}
            disabled={!userName.trim() || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Room
          </button>

          <button
            onClick={() => setMode('join')}
            disabled={!userName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Join Existing Room
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Multi-user</p>
            </div>
            <div className="text-center">
              <Zap className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Real-time</p>
            </div>
            <div className="text-center">
              <Code className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Code Runner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManager;