const { extractTokens } = require('./tokenExtractor');
const { parseAST } = require('./astGenerator');
const { analyze } = require('./semanticAnalyzer');
const { generateTAC } = require('./tacGenerator');
const { optimizeTAC } = require('./optimizer');
const { detectBasicBlocks } = require('./basicBlocks');
const ANALYSIS_NOTE = 'Input analysis uses Lexora’s built-in C subset and expression parser. Your Lex/Yacc program runs separately.';
function analyzeInput(input = '') {
  const result = { tokens: extractTokens(input), ast: null, symbolTable: [], semanticErrors: [], tac: [], optimizedTac: [], optimizationLog: [], basicBlocks: [], analysisStatus: 'empty', analysisMessage: 'Add program input, then compile to generate analysis.', analysisNote: ANALYSIS_NOTE };
  try {
    const ast = parseAST(input);
    if (!ast) return result;
    const semantic = analyze(ast), tac = generateTAC(ast), optimized = optimizeTAC(tac);
    return { ...result, ast, ...semantic, tac, ...optimized, basicBlocks: detectBasicBlocks(tac), analysisStatus: 'ready', analysisMessage: 'Input analysis completed.' };
  } catch (error) {
    result.analysisStatus = 'unsupported';
    result.analysisMessage = `Input analysis could not parse${error.line ? ` line ${error.line}` : ''}: ${error.message}. Supported: arithmetic, declarations, functions, calls, return, if/else, while and for. The console still shows your native program’s result.`;
    // Keep a useful list of observed identifiers without claiming semantic checks succeeded.
    result.symbolTable = [...new Set(result.tokens.filter(token => token.type === 'IDENTIFIER').map(token => token.lexeme))].map(name => ({ name, type: 'unknown', scope: 'input', declared: null, used: true }));
    return result;
  }
}
module.exports = { analyzeInput };
