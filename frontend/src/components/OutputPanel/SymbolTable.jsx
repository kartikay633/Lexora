import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import './SymbolTable.css';

export default function SymbolTable({
  symbols = [],
  analysisStatus = 'empty',
  analysisMessage = 'Compile program input to check symbols.',
  semanticErrors = [],
}) {
  return (
    <div className="symbol-table-view">
      {/* Semantic Diagnostics section */}
      <div className="diagnostics-card">
        <div className="diag-header">
          <span className="diag-title">Semantic Checks</span>
          {analysisStatus !== 'ready' ? <span className="diag-badge-error">Not checked</span> : semanticErrors.length === 0 ? (
            <span className="diag-badge-clean">0 Issues</span>
          ) : (
            <span className="diag-badge-error">{semanticErrors.length} Issue(s)</span>
          )}
        </div>

        {analysisStatus !== 'ready' ? <div className="diag-clean-msg">{analysisMessage}</div> : semanticErrors.length === 0 ? (
          <div className="diag-clean-msg">
            <CheckCircle2 size={16} className="clean-icon" />
            <span>Identifiers and operations pass semantic checks. No undeclared variables.</span>
          </div>
        ) : (
          <div className="diag-error-list">
            {semanticErrors.map((err, i) => (
              <div key={i} className="diag-error-item">
                <AlertCircle size={15} className="diag-icon" />
                <span className="diag-msg">{err.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Symbol Table section */}
      <div className="symbols-section">
        <div className="section-title">
          <span>Identifier Symbol Table</span>
          <span className="symbol-count">{symbols.length} symbol(s)</span>
        </div>

        {symbols.length === 0 ? (
          <div className="empty-symbols">
            <span>{analysisStatus === 'ready' ? 'This input contains no named variables or functions. Try x = 10; y = x + 5;' : 'No symbols to display yet.'}</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sym-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Scope</th>
                  <th>Declared</th>
                  <th>Referenced</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((sym, idx) => (
                  <tr key={idx}>
                    <td className="sym-name">
                      <code>{sym.name}</code>
                    </td>
                    <td>
                      <span className="sym-type-badge">{sym.type}</span>
                    </td>
                    <td>
                      <span className="sym-scope">{sym.scope}</span>
                    </td>
                    <td>
                      <span className={`status-tag ${sym.declared ? 'tag-yes' : 'tag-no'}`}>
                        {sym.declared === null ? 'Not checked' : sym.declared ? 'Declared' : 'Undeclared'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-tag ${sym.used ? 'tag-yes' : 'tag-muted'}`}>
                        {sym.used ? 'Referenced' : 'Unused'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
