/**
 * compiler.js — Core compilation orchestrator
 * 
 * Manages the full pipeline:
 * 1. flex → bison → gcc → run execution inside WSL
 * 2. Token extraction & lexical analysis (Review 2)
 * 3. AST generation & recursive descent parsing (Review 2)
 * 4. Semantic analysis & Symbol table (Review 2)
 * 5. Three-Address Code (TAC) generation (Review 2)
 * 6. Code Optimization: Constant folding & Algebraic simplification (Review 3)
 * 7. Basic Block Detection & Control Flow Partitioning (Review 3)
 */

const { runInWSL } = require('./wslRunner');
const { createTempDir, writeFile, cleanupTempDir } = require('./tempDir');
const { analyzeInput } = require('./inputAnalysis');

/**
 * Compile and run a Lex/Yacc project with full visualization features.
 * 
 * @param {object} params
 * @param {string} params.lexFile - Contents of the .l file
 * @param {string} params.yaccFile - Contents of the .y file
 * @param {string} params.inputCode - Input to feed to the compiled program
 * @param {object} [params.options] - Optional feature flags
 * @returns {Promise<object>} Full compilation result with all review stages
 */
async function compile({ lexFile, yaccFile, inputCode, options = {} }) {
  const startTime = Date.now();
  const tempDir = createTempDir();
  const log = [];
  const errors = [];
  const warnings = [];

  const analysis = analyzeInput(inputCode || '');

  try {
    const hasLex = Boolean(lexFile && lexFile.trim());
    const hasYacc = Boolean(yaccFile && yaccFile.trim());

    if (!hasLex && !hasYacc) {
      errors.push({
        phase: 'setup',
        message: 'No Lex or Yacc source code provided to compile.',
        exitCode: 1,
      });
      return buildResult(false, '', log, errors, startTime);
    }

    // Write source files to temp directory
    if (hasLex) writeFile(tempDir.windowsPath, 'lex.l', lexFile);
    if (hasYacc) writeFile(tempDir.windowsPath, 'parser.y', yaccFile);
    writeFile(tempDir.windowsPath, 'input.txt', inputCode || '');

    // Step 1: Run flex (if lexer file provided)
    if (hasLex) {
      log.push('flex → lex.yy.c ...');
      const flexResult = await runInWSL('flex lex.l', tempDir.wslPath);
      if (flexResult.exitCode !== 0) {
        log.push('flex → lex.yy.c ✗');
        errors.push({
          phase: 'flex',
          message: flexResult.stderr || flexResult.stdout || 'Flex failed with no output',
          exitCode: flexResult.exitCode,
        });
        return buildResult(false, '', log, errors, startTime, {
          ...analysis,
        });
      }
      if (flexResult.stderr) warnings.push(flexResult.stderr);
      log.push('flex → lex.yy.c ✓');
    }

    // Step 2: Run bison (if parser file provided)
    if (hasYacc) {
      log.push('bison → parser.tab.c ...');
      const bisonResult = await runInWSL('bison -d parser.y', tempDir.wslPath);
      if (bisonResult.exitCode !== 0) {
        log.push('bison → parser.tab.c ✗');
        errors.push({
          phase: 'bison',
          message: bisonResult.stderr || bisonResult.stdout || 'Bison failed with no output',
          exitCode: bisonResult.exitCode,
        });
        return buildResult(false, '', log, errors, startTime, {
          ...analysis,
        });
      }
      if (bisonResult.stderr) warnings.push(bisonResult.stderr);
      log.push('bison → parser.tab.c ✓');

      // Rewrite generated-header includes as data; never interpolate source into shell commands.
      if (hasLex) {
        const normalizedLex = lexFile.replace(/(#include\s*)["<][^">\r\n]*(?:\.tab\.h|y\.tab\.h)[">]/g, '$1"parser.tab.h"');
        writeFile(tempDir.windowsPath, 'lex.l', normalizedLex);
        const regenerated = await runInWSL('flex lex.l', tempDir.wslPath);
        if (regenerated.exitCode !== 0) throw new Error(regenerated.stderr || 'Could not regenerate lexer');
      }
    }

    // Step 3: Compile with GCC
    log.push('gcc → compiler ...');
    let compileSources = '';
    if (hasLex && hasYacc) {
      compileSources = 'lex.yy.c parser.tab.c';
    } else if (hasLex) {
      compileSources = 'lex.yy.c';
    } else if (hasYacc) {
      compileSources = 'parser.tab.c';
    }

    const gccResult = await runInWSL(
      `gcc -o compiler ${compileSources} ${hasLex ? '-lfl' : ''} -lm`,
      tempDir.wslPath
    );
    if (gccResult.exitCode !== 0) {
      log.push('gcc → compiler ✗');
      errors.push({
        phase: 'gcc',
        message: gccResult.stderr || gccResult.stdout || 'GCC compilation failed',
        exitCode: gccResult.exitCode,
      });
      return buildResult(false, '', log, errors, startTime, {
        ...analysis,
      });
    }
    if (gccResult.stderr) warnings.push(gccResult.stderr);
    log.push('gcc → compiler ✓');

    // Step 4: Run the compiled program
    log.push('running compiler ...');
    const runResult = await runInWSL(
      './compiler < input.txt',
      tempDir.wslPath,
      10000 // 10 second timeout for execution
    );

    if (runResult.exitCode === 124) {
      log.push('execution ✗ (timed out)');
      errors.push({
        phase: 'execution',
        message: 'Execution timed out after 10 seconds. Possible infinite loop in lexer/parser/runtime.',
        exitCode: 124,
      });
      return buildResult(false, runResult.stdout, log, errors, startTime, {
        ...analysis,
      });
    }

    if (runResult.exitCode !== 0) {
      log.push('execution ✗');
      errors.push({
        phase: 'execution',
        message: runResult.stderr || runResult.stdout || 'Program exited with non-zero status',
        exitCode: runResult.exitCode,
      });
      return buildResult(false, runResult.stdout, log, errors, startTime, {
        ...analysis,
      });
    }

    log.push('execution ✓');

    // Build successful result
    const result = buildResult(true, runResult.stdout, log, errors, startTime, {
      ...analysis,
    });

    if (runResult.stderr && runResult.exitCode === 0) {
      warnings.push(runResult.stderr);
    }

    result.warnings = warnings.join('\n');
    return result;

  } catch (err) {
    errors.push({
      phase: 'system',
      message: err.message || 'Internal server error',
      exitCode: -1,
    });
    return buildResult(false, '', log, errors, startTime, {
      ...analysis,
    });
  } finally {
    cleanupTempDir(tempDir.windowsPath);
  }
}

/**
 * Standardized result builder
 */
function buildResult(success, output, log, errors, startTime, extra = {}) {
  return {
    success,
    analysisNote: extra.analysisNote || '',
    analysisStatus: extra.analysisStatus || 'empty',
    analysisMessage: extra.analysisMessage || 'No input analysis available.',
    output: output || '',
    compilationLog: log.filter(l => !l.endsWith('...')).join('\n'),
    errors,
    executionTime: Date.now() - startTime,
    tokens: extra.tokens || [],
    ast: extra.ast || null,
    symbolTable: extra.symbolTable || [],
    semanticErrors: extra.semanticErrors || [],
    tac: extra.tac || [],
    optimizedTac: extra.optimizedTac || [],
    optimizationLog: extra.optimizationLog || [],
    basicBlocks: extra.basicBlocks || [],
  };
}

module.exports = { compile };
