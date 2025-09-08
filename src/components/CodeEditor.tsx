import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  fileName: string;
  content: string;
  language: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: any) => void;
  theme?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  content,
  language,
  onChange,
  onCursorChange,
  theme = 'vs-dark'
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      if (onCursorChange) {
        onCursorChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column
        });
      }
    });
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Update cursor position from remote users
  const updateRemoteCursor = (userId: string, userName: string, position: any) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const monaco = editor.getModel().getMonacoModel();
      
      // Create decoration for remote cursor (simplified)
      const decorations = editor.deltaDecorations([], [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        options: {
          className: 'remote-cursor',
          hoverMessage: { value: `${userName} is here` }
        }
      }]);
      
      // Remove decoration after a short time
      setTimeout(() => {
        editor.deltaDecorations(decorations, []);
      }, 2000);
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={getLanguageFromFileName(fileName)}
        value={content}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
          glyphMargin: true,
          folding: true,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
        }}
      />
    </div>
  );
};

export default CodeEditor;