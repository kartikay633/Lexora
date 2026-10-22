import React from 'react';
import { ArrowDown } from 'lucide-react';
import './BasicBlocks.css';

export default function BasicBlocks({ basicBlocks = [], emptyMessage }) {
  if (!basicBlocks || basicBlocks.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No Basic Blocks Detected</p>
        <p className="empty-desc">{emptyMessage || 'Click "Compile" to detect leaders and partition into Basic Blocks.'}</p>
      </div>
    );
  }

  return (
    <div className="basic-blocks-view">
      {/* Educational info card */}
      <div className="bb-concept-card">
        <div className="concept-title">Leader Identification Rules</div>
        <div className="concept-rules">
          <div className="rule-item">
            <span className="rule-dot">1</span>
            <span>The first 3-address instruction is a leader.</span>
          </div>
          <div className="rule-item">
            <span className="rule-dot">2</span>
            <span>Any instruction that is the target of a conditional or unconditional jump is a leader.</span>
          </div>
          <div className="rule-item">
            <span className="rule-dot">3</span>
            <span>Any instruction that immediately follows a conditional or unconditional jump is a leader.</span>
          </div>
        </div>
      </div>

      {/* Basic block flow / cards */}
      <div className="blocks-container">
        {basicBlocks.map((block, bIdx) => (
          <div key={block.label || bIdx} className="block-card-wrapper">
            <div className="block-card">
              <div className="block-header">
                <span className="block-label">{block.label}</span>
                <span className="block-len">{block.instructions.length} instruction(s)</span>
              </div>

              <div className="block-instructions">
                {block.instructions.map((instr, iIdx) => (
                  <div key={iIdx} className={`block-inst-row ${iIdx === 0 ? 'leader-row' : ''}`}>
                    <span className="inst-num">{iIdx + 1}</span>
                    <span className="inst-code">{instr.text}</span>
                    {iIdx === 0 && <span className="leader-pill">Leader</span>}
                  </div>
                ))}
              </div>

              {block.successors && block.successors.length > 0 && (
                <div className="block-footer">
                  <span className="footer-label">Successors:</span>
                  <div className="succ-badges">
                    {block.successors.map((s, idx) => (
                      <span key={idx} className="succ-pill">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {bIdx < basicBlocks.length - 1 && (
              <div className="blocks-flow-arrow">
                <ArrowDown size={16} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
