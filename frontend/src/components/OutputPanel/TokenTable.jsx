import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './TokenTable.css';

export default function TokenTable({ tokens = [] }) {
  const [filter, setFilter] = useState('');

  const filteredTokens = tokens.filter(
    (tok) =>
      tok.type.toLowerCase().includes(filter.toLowerCase()) ||
      tok.lexeme.toLowerCase().includes(filter.toLowerCase())
  );

  const getTypeClass = (type) => {
    switch (type) {
      case 'NUMBER': return 'tok-number';
      case 'KEYWORD': return 'tok-keyword';
      case 'IDENTIFIER': return 'tok-id';
      case 'PLUS':
      case 'MINUS':
      case 'MULTIPLY':
      case 'DIVIDE':
      case 'MODULO': return 'tok-op';
      case 'ASSIGN':
      case 'EQUAL': return 'tok-assign';
      case 'LPAREN':
      case 'RPAREN':
      case 'LBRACE':
      case 'RBRACE': return 'tok-paren';
      case 'EOL': return 'tok-eol';
      default: return 'tok-unknown';
    }
  };

  if (!tokens || tokens.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-title">No Tokens Available</p>
        <p className="empty-desc">Click "Compile" to run the lexical analysis phase.</p>
      </div>
    );
  }

  return (
    <div className="token-table-view">
      <div className="token-toolbar">
        <span className="token-count">Total Tokens: <strong>{tokens.length}</strong></span>
        <div className="search-box-wrapper">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            className="token-search-input"
            placeholder="Filter tokens..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="token-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Token Type</th>
              <th>Lexeme</th>
              <th>Line</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map((tok, idx) => (
              <tr key={tok.id || idx}>
                <td className="col-id">{tok.id || idx + 1}</td>
                <td>
                  <span className={`token-badge ${getTypeClass(tok.type)}`}>
                    {tok.type}
                  </span>
                </td>
                <td className="col-lexeme">
                  <code>{tok.lexeme}</code>
                </td>
                <td className="col-num">{tok.line}</td>
                <td className="col-num">{tok.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
