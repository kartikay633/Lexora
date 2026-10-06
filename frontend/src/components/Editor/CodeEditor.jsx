import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { FileCode, FilePlus, Upload } from 'lucide-react';
import './CodeEditor.css';

export default function CodeEditor({
  value,
  onChange,
  fileName,
  fileType,
  hasFiles,
  onCreateFile,
  onUploadClick,
  theme = 'dark',
}) {
  if (!hasFiles || !fileName) {
    return (
      <div className="lexora-editor-container editor-empty-container" id="editor-container">
        <div className="editor-empty-state">
          <FilePlus size={36} className="empty-state-icon" />
          <h3>No File Selected</h3>
          <p>Create a file to start writing your compiler specification or upload existing files.</p>
          <div className="empty-state-actions">
            <button
              className="btn-create-file"
              onClick={() => onCreateFile('lexer.l')}
            >
              + Create Lexer (.l)
            </button>
            <button
              className="btn-create-file"
              onClick={() => onCreateFile('parser.y')}
            >
              + Create Parser (.y)
            </button>
            {onUploadClick && (
              <button
                className="btn-upload-file"
                onClick={onUploadClick}
              >
                <Upload size={14} />
                <span>Upload Files</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lexora-editor-container" id="editor-container">
      <div className="editor-top-bar">
        <div className="editor-file-info">
          <FileCode size={15} className="editor-file-icon" />
          <span className="file-active-name">{fileName}</span>
          <span className="file-active-badge">{fileType}</span>
        </div>
        <div className="editor-status-indicator">
          <span>{value?.length === 0 ? 'Empty File' : 'Ready'}</span>
        </div>
      </div>

      <div className="codemirror-wrapper">
        <CodeMirror
          value={value ?? ''}
          height="100%"
          theme={theme === 'light' ? 'light' : 'dark'}
          extensions={[cpp()]}
          placeholder="Start typing your code here..."
          onChange={(val) => onChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>

      <div className="editor-status-bar">
        <span>UTF-8</span>
        <span>{fileType}</span>
        <span>{(value || '').length} characters</span>
      </div>
    </div>
  );
}
