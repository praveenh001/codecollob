import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Loader, Download } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageKey } from '../types';
import { getFileExtension, getLanguageFromExtension } from '../utils/fileSystem';

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
    const extension = getFileExtension(currentFile);
    const language = getLanguageFromExtension(extension);

    onExecute(file.content, language);
  };

  const getLanguageInfo = (fileName: string): { name: string, canExecute: boolean } => {
    if (!fileName) return { name: 'Unknown', canExecute: false };
    
    const extension = getFileExtension(fileName);
    const language = getLanguageFromExtension(extension) as LanguageKey;
    
    if (language in SUPPORTED_LANGUAGES) {
      const langInfo = SUPPORTED_LANGUAGES[language];
      return {
        name: langInfo.name,
        canExecute: langInfo.runner !== null
      };
    }
    
    return { name: 'Plain Text', canExecute: false };
  };

  const downloadOutput = () => {
    const content = output.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearOutput = () => {
    // This would need to be implemented in the parent component
    // For now, we'll just show a message
    console.log('Clear output functionality needs to be implemented in parent');
  };

  const languageInfo = getLanguageInfo(currentFile || '');

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
              {languageInfo.name}
            </span>
          )}
          
          <button
            onClick={downloadOutput}
            disabled={output.length === 0}
            className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download output"
          >
            <Download className="w-3 h-3" />
          </button>
          
          <button
            onClick={handleExecute}
            disabled={!currentFile || isExecuting || !languageInfo.canExecute}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              !currentFile || isExecuting || !languageInfo.canExecute
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title={!languageInfo.canExecute ? `${languageInfo.name} files cannot be executed` : ''}
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
        style={{
          minHeight: '120px',
          maxHeight: '300px',
          scrollbarWidth: 'thin', // For Firefox
        }}
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            <p>Terminal ready. Select a file and click "Run" to execute code.</p>
            <div className="mt-4 text-xs">
              <p className="font-semibold mb-2">Supported languages for execution:</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(SUPPORTED_LANGUAGES)
                  .filter(([_, lang]) => lang.runner !== null)
                  .map(([key, lang]) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                      <span>{lang.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="mb-1">
              {line.startsWith('Error:') || line.includes('error') || line.includes('Error') ? (
                <span className="text-red-400">{line}</span>
              ) : line.includes('Warning') || line.includes('warning') ? (
                <span className="text-yellow-400">{line}</span>
              ) : line.startsWith('>') ? (
                <span className="text-blue-400">{line}</span>
              ) : line.includes('👋') || line.includes('🚀') || line.includes('📝') ? (
                <span className="text-cyan-400">{line}</span>
              ) : (
                <span>{line}</span>
              )}
            </div>
          ))
        )}
        
        {isExecuting && (
          <div className="text-blue-400 flex items-center gap-2 mt-2">
            <Loader className="w-3 h-3 animate-spin" />
            Executing {languageInfo.name} code...
          </div>
        )}
        
        {/* Cursor */}
        <span className="animate-pulse">█</span>
      </div>
    </div>
  );
};

export default Terminal;
