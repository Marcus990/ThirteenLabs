import React, { useState, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, language = 'javascript' }) => {
  const [localCode, setLocalCode] = useState(code);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    onChange(newCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Auto-indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      // Get the current line
      const currentLine = value.substring(0, start).split('\n').pop() || '';
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';
      
      // Check if we need to add extra indent (for opening braces)
      const extraIndent = currentLine.trim().endsWith('{') ? '  ' : '';
      const newIndent = indent + extraIndent;
      
      const newValue = value.substring(0, start) + '\n' + newIndent + value.substring(end);
      setLocalCode(newValue);
      onChange(newValue);
      
      // Set cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1 + newIndent.length;
      }, 0);
    }
    
    // Auto-close braces
    if (e.key === '{') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      
      const newValue = value.substring(0, start) + '{}' + value.substring(end);
      setLocalCode(newValue);
      onChange(newValue);
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-xs text-gray-400 uppercase">{language}</span>
      </div>
      
      {/* Code Area */}
      <div className="relative h-full">
        <textarea
          value={localCode}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none outline-none border-none"
          placeholder="// Your Three.js code will appear here..."
          spellCheck={false}
          style={{
            lineHeight: '1.5',
            tabSize: 2,
          }}
        />
        
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 w-12 h-full bg-gray-800 text-gray-500 text-xs font-mono p-4 select-none pointer-events-none">
          {localCode.split('\n').map((_, index) => (
            <div key={index} className="text-right">
              {index + 1}
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="px-4 py-1 bg-gray-800 text-xs text-gray-400 border-t border-gray-700">
        <span>Lines: {localCode.split('\n').length}</span>
        <span className="ml-4">Characters: {localCode.length}</span>
      </div>
    </div>
  );
};

export default CodeEditor; 