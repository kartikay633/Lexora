import React, { useState } from 'react';
import {
  Terminal,
  Binary,
  GitBranch,
  TableProperties,
  Cpu,
  Zap,
  Boxes,
} from 'lucide-react';
import TabBar from '../common/TabBar';
import TokenTable from './TokenTable';
import ParseTree from './ParseTree';
import SymbolTable from './SymbolTable';
import TACView from './TACView';
import OptimizedTAC from './OptimizedTAC';
import BasicBlocks from './BasicBlocks';
import './OutputPanel.css';

export default function OutputPanel({
  result,
  isCompiling,
  inputCode = '',
  onInputChange = () => {},
}) {
  const [activeTab, setActiveTab] = useState('output');



  const emptyMessage = result?.analysisMessage || 'Add program input and compile to generate analysis.';
  const tabs = [
    {
      id: 'output',
      label: 'Console',
      icon: <Terminal size={14} />,
    },
    {
      id: 'tokens',
      label: 'Tokens',
      icon: <Binary size={14} />,
      badge: result?.tokens?.length || 0,
    },
    {
      id: 'ast',
      label: 'Syntax Tree',
      icon: <GitBranch size={14} />,
    },
    {
      id: 'semantic',
      label: 'Symbol Table',
      icon: <TableProperties size={14} />,
      badge: result?.symbolTable?.length || 0,
    },
    {
      id: 'tac',
      label: '3-Address Code',
      icon: <Cpu size={14} />,
      badge: result?.tac?.length || 0,
    },
    {
      id: 'optimization',
      label: 'Optimization',
      icon: <Zap size={14} />,
      badge: result?.optimizationLog?.length || 0,
    },
    {
      id: 'basicblocks',
      label: 'Basic Blocks',
      icon: <Boxes size={14} />,
      badge: result?.basicBlocks?.length || 0,
    },
  ];

  return (
    <div className="lexora-output-panel" id="output-panel">
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab !== 'output' && <p className="analysis-notice">{result?.analysisNote || 'Analysis is generated from program input. Add input in the Console tab, then compile.'}</p>}
      <div className="tab-body-container">
        {isCompiling && (
          <div className="compiling-overlay">
            <div className="compiling-spinner"></div>
            <span className="compiling-text">Compiling through Flex, Bison, and GCC...</span>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="output-console-view">
            {/* Program Input (stdin) */}
            <div className="console-section input-section">
              <div className="console-header input-header">
                <div className="input-header-left">
                  <Terminal size={14} className="input-icon" />
                  <span className="header-title">Program Input (stdin)</span>
                </div>
                <div className="input-meta-actions">
                  {inputCode && (
                    <button
                      type="button"
                      className="btn-clear-stdin"
                      onClick={() => onInputChange('')}
                      title="Clear stdin input"
                    >
                      Clear
                    </button>
                  )}
                  <span className="input-char-count">{inputCode ? `${inputCode.length} chars` : 'Empty input'}</span>
                </div>
              </div>
              <div className="stdin-box">
                <textarea
                  aria-label="Program input (stdin)"
                  id="program-stdin"
                  className="stdin-textarea"
                  placeholder="Type or paste input for your program here (e.g. hello 123 world 456)..."
                  value={inputCode}
                  onChange={(e) => onInputChange(e.target.value)}
                  rows={4}
                  spellCheck={false}
                />
              </div>
            </div>

            <p className="stdin-hint">Input is sent exactly as typed. Line-based grammars may need a final newline.</p>
            {/* Standard Output Console */}
            <div className="console-section">
              <div className="console-header">
                <span className="header-title">Program Output (stdout)</span>
                {result?.executionTime !== undefined && (
                  <span className="header-status-text">{result.executionTime}ms</span>
                )}
              </div>
              <div className="console-box stdout-box">
                {result?.output ? (
                  <pre className="stdout-text">{result.output}</pre>
                ) : (
                  <span className="stdout-placeholder">
                    {result ? (result.success ? 'Program finished successfully with no output.' : 'No output. See diagnostics below.') : 'Click Compile (Ctrl+Enter) to execute the compiler pipeline.'}
                  </span>
                )}
              </div>
            </div>

            {/* Error Diagnostics if any */}
            {result?.errors && result.errors.length > 0 && (
              <div className="console-section error-section">
                <div className="console-header error-header">
                  <span className="header-title error-title">Compiler Diagnostics</span>
                  <span className="error-count-tag">{result.errors.length} error(s)</span>
                </div>
                <div className="error-cards">
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="error-card">
                      <div className="err-card-header">
                        <span className="err-phase-badge">{err.phase}</span>
                        {err.exitCode !== undefined && (
                          <span className="err-exit-code">Exit code: {err.exitCode}</span>
                        )}
                      </div>
                      <pre className="err-msg">{err.message}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings if any */}
            {result?.warnings && (
              <div className="console-section warning-section">
                <div className="console-header warning-header">
                  <span className="header-title warning-title">Compiler Messages (stderr)</span>
                </div>
                <pre className="warning-text">{result.warnings}</pre>
              </div>
            )}

            {/* Step-by-Step Toolchain Log */}
            <div className="console-section">
              <div className="console-header">
                <span className="header-title">Compilation Log</span>
              </div>
              <div className="console-box log-box">
                {result?.compilationLog ? (
                  <pre className="log-text">{result.compilationLog}</pre>
                ) : (
                  <span className="stdout-placeholder">Toolchain stages will be logged here.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tokens' && <TokenTable tokens={result?.tokens || []} />}
        {activeTab === 'ast' && <ParseTree key={result?.executionTime} ast={result?.ast || null} emptyMessage={emptyMessage} />}
        {activeTab === 'semantic' && (
          <SymbolTable
            analysisStatus={result?.analysisStatus || (result?.ast ? 'ready' : 'empty')}
            analysisMessage={emptyMessage}
            symbols={result?.symbolTable || []}
            semanticErrors={result?.semanticErrors || []}
          />
        )}
        {activeTab === 'tac' && <TACView tac={result?.tac || []} emptyMessage={emptyMessage} />}
        {activeTab === 'optimization' && (
          <OptimizedTAC
            tac={result?.tac || []}
            optimizedTac={result?.optimizedTac || []}
            optimizationLog={result?.optimizationLog || []}
          />
        )}
        {activeTab === 'basicblocks' && (
          <BasicBlocks basicBlocks={result?.basicBlocks || []} />
        )}
      </div>
    </div>
  );
}
