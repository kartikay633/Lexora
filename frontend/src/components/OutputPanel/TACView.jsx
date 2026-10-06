import React, { useState } from 'react';
import './TACView.css';

export default function TACView({ tac = [], emptyMessage }) {
  const [format, setFormat] = useState('linear'); // 'linear' | 'quadruple'

  if (!tac || tac.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No Intermediate Code Available</p>
        <p className="empty-desc">{emptyMessage || 'Add input and compile to generate three-address instructions.'}</p>
      </div>
    );
  }

  return (
    <div className="tac-view">
      <div className="tac-toolbar">
        <div className="tac-meta">
          <span className="tac-title">Three-Address Code</span>
          <span className="tac-count">{tac.length} instruction(s)</span>
        </div>
        <div className="format-toggle">
          <button
            className={`toggle-btn ${format === 'linear' ? 'active' : ''}`}
            onClick={() => setFormat('linear')}
          >
            Linear
          </button>
          <button
            className={`toggle-btn ${format === 'quadruple' ? 'active' : ''}`}
            onClick={() => setFormat('quadruple')}
          >
            Quadruples
          </button>
        </div>
      </div>

      <div className="tac-content">
        {format === 'linear' ? (
          <div className="linear-code-container">
            {tac.map((instr, idx) => (
              <div key={idx} className="tac-line">
                <span className="line-num">{(idx + 1).toString().padStart(2, '0')}</span>
                <code className="tac-instruction">{instr.text}</code>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="quad-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>op</th>
                  <th>arg1</th>
                  <th>arg2</th>
                  <th>result</th>
                </tr>
              </thead>
              <tbody>
                {tac.map((instr, idx) => (
                  <tr key={idx}>
                    <td className="quad-idx">({idx})</td>
                    <td className="quad-op">
                      <code>{instr.op}</code>
                    </td>
                    <td className="quad-arg">
                      <code>{instr.arg1 || '-'}</code>
                    </td>
                    <td className="quad-arg">
                      <code>{instr.arg2 || '-'}</code>
                    </td>
                    <td className="quad-result">
                      <code>{instr.result}</code>
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
