import React, { useState } from 'react';
import { 
  File, 
  Folder, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  FileText 
} from 'lucide-react';

interface FileItem {
  name: string;
  content: string;
  type: 'file';
  createdAt?: Date;
}

interface FileExplorerProps {
  files: { [key: string]: FileItem };
  currentFile: string | null;
  onFileSelect: (fileName: string) => void;
  onFileCreate: (fileName: string) => void;
  onFileDelete: (fileName: string) => void;
  onFileRename: (oldName: string, newName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename
}) => {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const handleCreateFile = () => {
    if (newFileName.trim() && !files[newFileName]) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setShowCreateInput(false);
    }
  };

  const handleRenameFile = (oldName: string) => {
    if (editFileName.trim() && editFileName !== oldName && !files[editFileName]) {
      onFileRename(oldName, editFileName.trim());
    }
    setEditingFile(null);
    setEditFileName('');
  };

  const startRename = (fileName: string) => {
    setEditingFile(fileName);
    setEditFileName(fileName);
    setShowMenu(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'py':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'html':
        return <FileText className="w-4 h-4 text-orange-400" />;
      case 'css':
        return <FileText className="w-4 h-4 text-blue-300" />;
      case 'json':
        return <FileText className="w-4 h-4 text-green-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white p-4 border-r border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Files</h3>
        <button
          onClick={() => setShowCreateInput(true)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Create new file"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showCreateInput && (
        <div className="mb-3">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="Enter file name..."
            className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') {
                setShowCreateInput(false);
                setNewFileName('');
              }
            }}
            onBlur={() => {
              if (!newFileName.trim()) {
                setShowCreateInput(false);
              }
            }}
            autoFocus
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={handleCreateFile}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateInput(false);
                setNewFileName('');
              }}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {Object.entries(files).map(([fileName, file]) => (
          <div key={fileName} className="relative">
            <div
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                currentFile === fileName
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => onFileSelect(fileName)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(fileName)}
                {editingFile === fileName ? (
                  <input
                    type="text"
                    value={editFileName}
                    onChange={(e) => setEditFileName(e.target.value)}
                    className="flex-1 px-1 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleRenameFile(fileName);
                      if (e.key === 'Escape') {
                        setEditingFile(null);
                        setEditFileName('');
                      }
                    }}
                    onBlur={() => handleRenameFile(fileName)}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm truncate">{fileName}</span>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(showMenu === fileName ? null : fileName);
                }}
                className="p-1 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>

            {showMenu === fileName && (
              <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-10 min-w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(fileName);
                  }}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
                      onFileDelete(fileName);
                    }
                    setShowMenu(null);
                  }}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(files).length === 0 && !showCreateInput && (
        <div className="text-center text-gray-500 mt-8">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No files yet</p>
          <p className="text-xs">Click + to create one</p>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;