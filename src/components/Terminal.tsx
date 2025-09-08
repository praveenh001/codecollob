import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Loader } from 'lucide-react';

interface TerminalProps {
  output: string[];
  isExecuting: boolean;
  onExecute: (code: string, language: string) => void;
  currentFile: string | null;
  files: { [key: string]: any };
}

const Terminal: React.FC<TerminalProps> = ({
  output,
  isExecuting,
  onExecute,
  currentFile,
  files
}) => {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleExecute = () => {
    if (!currentFile || !files[currentFile]) {
      return;
    }

    const file = files[currentFile];
    const extension = currentFile.split('.').pop()?.toLowerCase();
    
    let language = 'javascript';
    if (extension === 'py') {
      language = 'python';
    }

    onExecute(file.content, language);
  };

  const getLanguageFromFile = (fileName: string): string => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    return extension === 'py' ? 'Python' : 'JavaScript';
  };

  return (
    <div className="h-full bg-black text-green-400 font-mono flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">Terminal</span>
        </div>
        
        <div className="flex items-center gap-2">
          {currentFile && (
            <span className="text-xs text-gray-400">
              {getLanguageFromFile(currentFile)}
            </span>
          )}
          <button
            onClick={handleExecute}
            disabled={!currentFile || isExecuting}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              !currentFile || isExecuting
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader className="w-3 h-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={outputRef}
        className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed"
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            <p>Terminal ready. Select a file and click "Run" to execute code.</p>
            <p className="mt-2 text-xs">Supported languages: JavaScript (.js), Python (.py)</p>
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="mb-1">
              {line.startsWith('Error:') || line.includes('error') || line.includes('Error') ? (
                <span className="text-red-400">{line}</span>
              ) : line.includes('Warning') || line.includes('warning') ? (
                <span className="text-yellow-400">{line}</span>
              ) : (
                <span>{line}</span>
              )}
            </div>
          ))
        )}
        
        {isExecuting && (
          <div className="text-blue-400 flex items-center gap-2 mt-2">
            <Loader className="w-3 h-3 animate-spin" />
            Executing code...
          </div>
        )}
        
        {/* Cursor */}
        <span className="animate-pulse">█</span>
      </div>
    </div>
  );
};

export default Terminal;