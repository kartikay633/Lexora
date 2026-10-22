import React from 'react';
import { ArrowRight } from 'lucide-react';
import './OptimizedTAC.css';

export default function OptimizedTAC({
  tac = [],
  optimizedTac = [],
  optimizationLog = [],
  emptyMessage,
}) {
  if (!tac || tac.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No Optimizations to Display</p>
        <p className="empty-desc">{emptyMessage || 'Click "Compile" to generate and optimize Three-Address Code.'}</p>
      </div>
    );
  }

  return (
    <div className="optimized-tac-view">
      {/* Optimization summary bar */}
      <div className="opt-summary-bar">
        <div className="opt-meta">
          <span className="opt-tag-count">
            {optimizationLog.length} optimization(s) applied
          </span>
          <span className="opt-passes-info">
            Passes: Constant Folding • Algebraic Simplification • Constant Propagation
          </span>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="comparison-grid">
        <div className="tac-col original-col">
          <div className="col-header">
            <span className="col-tag orig-tag">Original TAC (Before)</span>
            <span className="col-count">{tac.length} instrs</span>
          </div>
          <div className="code-list">
            {tac.map((instr, idx) => (
              <div key={idx} className="code-row">
                <span className="row-num">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className="code-text">{instr.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tac-col optimized-col">
          <div className="col-header">
            <span className="col-tag opt-tag">Optimized TAC (After)</span>
            <span className="col-count">{optimizedTac.length} instrs</span>
          </div>
          <div className="code-list">
            {optimizedTac.map((instr, idx) => {
              const wasChanged = optimizationLog.some((log) => log.line === idx + 1);
              return (
                <div key={idx} className={`code-row ${wasChanged ? 'row-highlight' : ''}`}>
                  <span className="row-num">{(idx + 1).toString().padStart(2, '0')}</span>
                  <span className="code-text">{instr.text}</span>
                  {wasChanged && <span className="diff-pill">optimized</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optimization transformations log */}
      <div className="opt-log-section">
        <div className="log-title">
          <span>Optimization Transformations Log</span>
        </div>

        {optimizationLog.length === 0 ? (
          <div className="no-opt-msg">
            <span>Code is in normal form. No further constant folding or identity reductions required.</span>
          </div>
        ) : (
          <div className="log-items">
            {optimizationLog.map((item, idx) => (
              <div key={idx} className="log-entry">
                <div className="log-entry-header">
                  <span className="pass-badge">
                    {item.type}
                  </span>
                  <span className="log-line">Line {item.line}</span>
                </div>
                <div className="log-diff">
                  <span className="diff-before">{item.before}</span>
                  <ArrowRight size={13} className="diff-arrow-icon" />
                  <span className="diff-after">{item.after}</span>
                </div>
                {item.description && (
                  <div className="log-desc">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
