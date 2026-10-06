/**
 * tokenExtractor.js — Token extraction for lexical visualization
 * 
 * Tokenizes the input code into structured tokens with type,
 * lexeme, line number, and column position.
 */

/**
 * Tokenize input code according to lexical analysis rules.
 * @param {string} input - Source code to tokenize
 * @param {string} [lexRules] - Optional raw .l file content for pattern extraction
 * @returns {Array<{ id: number, type: string, lexeme: string, line: number, position: number }>}
 */
function extractTokens(input, _lexRules = '') {
  if (!input || typeof input !== 'string') return [];

  const tokens = [];
  let line = 1;
  let lineStartPos = 0;
  let pos = 0;
  let id = 1;

  const patterns = [
    { type: 'STRING', regex: /^"(?:\\.|[^"\\\n])*"/ },
    { type: 'CHAR', regex: /^'(?:\\.|[^'\\\n])*'/ },
    { type: 'EQUAL', regex: /^==/ },
    { type: 'OPERATOR', regex: /^(?:!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|%=|&&|\|\||[!<>&])/ },
    { type: 'NUMBER', regex: /^[0-9]+(\.[0-9]+)?/ },
    { type: 'KEYWORD', regex: /^(if|else|while|for|do|break|continue|int|float|double|char|long|short|return|void)\b/ },
    { type: 'IDENTIFIER', regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'PLUS', regex: /^\+/ },
    { type: 'MINUS', regex: /^-/ },
    { type: 'MULTIPLY', regex: /^\*/ },
    { type: 'DIVIDE', regex: /^\// },
    { type: 'MODULO', regex: /^%/ },
    { type: 'ASSIGN', regex: /^=/ },
    { type: 'LPAREN', regex: /^\(/ },
    { type: 'RPAREN', regex: /^\)/ },
    { type: 'LBRACE', regex: /^\{/ },
    { type: 'RBRACE', regex: /^\}/ },
    { type: 'SEMICOLON', regex: /^;/ },
    { type: 'COMMA', regex: /^,/ },
    { type: 'EOL', regex: /^\n/ },
  ];

  while (pos < input.length) {
    const char = input[pos];

    // Skip horizontal whitespace but advance column
    if (char === ' ' || char === '\t' || char === '\r') {
      pos++;
      continue;
    }

    const remaining = input.slice(pos);
    const skipped = remaining.match(/^\/\/[^\n]*|^\/\*[\s\S]*?\*\//) || (char === '#' && /^\s*$/.test(input.slice(lineStartPos, pos)) ? remaining.match(/^[^\n]*/) : null);
    if (skipped) {
      const consumed = skipped[0];
      const newlines = (consumed.match(/\n/g) || []).length;
      if (newlines) { line += newlines; lineStartPos = pos + consumed.lastIndexOf('\n') + 1; }
      pos += consumed.length;
      continue;
    }
    let matched = false;

    // Newline handling
    if (char === '\n') {
      tokens.push({
        id: id++,
        type: 'EOL',
        lexeme: '\\n',
        line: line,
        position: pos - lineStartPos,
      });
      line++;
      pos++;
      lineStartPos = pos;
      continue;
    }

    for (const { type, regex } of patterns) {
      if (type === 'EOL') continue;
      const match = remaining.match(regex);
      if (match) {
        tokens.push({
          id: id++,
          type,
          lexeme: match[0],
          line,
          position: pos - lineStartPos,
        });
        pos += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Unknown or single character token
      tokens.push({
        id: id++,
        type: 'UNKNOWN',
        lexeme: char,
        line,
        position: pos - lineStartPos,
      });
      pos++;
    }
  }

  return tokens;
}

module.exports = { extractTokens };
