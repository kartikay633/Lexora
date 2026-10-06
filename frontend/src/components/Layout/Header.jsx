import React from 'react';
import { Play, Clock } from 'lucide-react';
import './Header.css';

export default function Header({
  onCompile,
  isCompiling,
  status,
  executionTime,
  projectName,
  compileMode = 'lex',
  onModeChange = () => {},
}) {
  return (
    <header className="lexora-header" id="main-header">
      <div className="header-left">
        <div className="header-project-info">
          <span className="project-title">{projectName || 'Current Workspace'}</span>
        </div>
      </div>

      {/* Mode Selector: 2 options (Lex vs Lex + Yacc) */}
      <div className="header-mode-toggle" id="pipeline-mode-selector">
        <button
          type="button"
          className={`mode-btn ${compileMode === 'lex' ? 'active' : ''}`}
          disabled={isCompiling}
          onClick={() => onModeChange('lex')}
          title="Lex Specification Only (Flex + GCC)"
        >
          Lex Only
        </button>
        <button
          type="button"
          className={`mode-btn ${compileMode === 'lex_yacc' ? 'active' : ''}`}
          disabled={isCompiling}
          onClick={() => onModeChange('lex_yacc')}
          title="Lex + Yacc Pipeline (Flex + Bison + GCC)"
        >
          Lex + Yacc
        </button>
        <button type="button" className={`mode-btn ${compileMode === 'yacc' ? 'active' : ''}`} disabled={isCompiling} onClick={() => onModeChange('yacc')} title="Parser with its own yylex implementation">Yacc Only</button>
      </div>

      <div className="header-right">
        {executionTime !== null && (
          <div className="meta-pill" title="Execution Time">
            <Clock size={13} />
            <span>{executionTime}ms</span>
          </div>
        )}

        <div className={`meta-pill status-${status}`}>
          <span className="status-dot"></span>
          <span className="status-label">
            {status === 'compiling' ? 'Compiling' : status === 'error' ? 'Failed' : status === 'success' ? 'Passed' : 'Ready'}
          </span>
        </div>

        <button
          id="compile-btn"
          className={`btn-compile ${isCompiling ? 'loading' : ''}`}
          onClick={onCompile}
          disabled={isCompiling}
          title="Compile and run pipeline (Ctrl+Enter)"
        >
          {isCompiling ? (
            <>
              <span className="spinner"></span>
              <span>Running</span>
            </>
          ) : (
            <>
              <Play size={14} className="play-icon" />
              <span>Compile</span>
              <kbd className="kbd-shortcut">Ctrl+↵</kbd>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
