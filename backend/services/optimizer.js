/**
 * optimizer.js — Machine-Independent Code Optimizer
 * 
 * Demonstrates Code Optimization Techniques (Curriculum CO5):
 * 1. Constant Folding (evaluating compile-time arithmetic)
 * 2. Algebraic Simplification (identities like x+0, x*1, x*0)
 * 3. Constant Propagation (substituting constant values)
 */

function evaluate(op, a, b, floating) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    // C truncates only integer division; % is not defined for floating operands.
    case '/': return b !== 0 ? (floating ? a / b : Math.trunc(a / b)) : null;
    case '%': return b !== 0 && !floating ? a % b : null;
    default: return null;
  }
}

function isNumeric(val) {
  return typeof val === 'string' && val.trim() !== '' && Number.isFinite(Number(val));
}

const isFloating = val => /[.eE]/.test(val);

// Keep floating results visibly floating (6.0, not 6) so later folds stay floating.
function formatConstant(value, floating) {
  return floating && Number.isInteger(value) ? value.toFixed(1) : String(value);
}

/**
 * Optimize TAC instructions using constant folding, algebraic simplification, and propagation.
 * @param {Array<object>} instructions - Array of TAC quadruples
 * @returns {{ optimizedTac: Array<object>, optimizationLog: Array<object> }}
 */
function optimizeTAC(instructions) {
  if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
    return { optimizedTac: [], optimizationLog: [] };
  }

  const log = [];
  let currentTac = JSON.parse(JSON.stringify(instructions));
  const constMap = new Map();

  // Pass 1: Constant Propagation & Folding & Algebraic Simplification
  const optimized = [];

  for (let i = 0; i < currentTac.length; i++) {
    let instr = { ...currentTac[i] };
    if (['label', 'goto', 'if', 'if_false', 'call', 'return', 'end'].includes(instr.op)) constMap.clear();
    if (!['=', '+', '-', '*', '/', '%', '!'].includes(instr.op)) {
      if (instr.result) constMap.delete(instr.result);
      optimized.push(instr);
      continue;
    }
    const originalText = instr.text || `${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2 || ''}`.trim();

    // Constant propagation: replace args if they are known constants
    if (constMap.has(instr.arg1)) {
      const oldArg1 = instr.arg1;
      instr.arg1 = String(constMap.get(oldArg1));
      log.push({
        line: i + 1,
        type: 'Constant Propagation',
        before: `${oldArg1}`,
        after: `${instr.arg1}`,
        description: `Substituted constant ${oldArg1} = ${instr.arg1}`,
      });
    }
    if (instr.arg2 && constMap.has(instr.arg2)) {
      const oldArg2 = instr.arg2;
      instr.arg2 = String(constMap.get(oldArg2));
      log.push({
        line: i + 1,
        type: 'Constant Propagation',
        before: `${oldArg2}`,
        after: `${instr.arg2}`,
        description: `Substituted constant ${oldArg2} = ${instr.arg2}`,
      });
    }

    // A write invalidates the previous value after reading both operands.
    constMap.delete(instr.result);

    // Pass 1.1: Constant Folding
    if (['-', '!'].includes(instr.op) && (instr.arg2 === null || instr.arg2 === undefined) && isNumeric(instr.arg1)) {
      const value = instr.op === '-'
        ? (Number(instr.arg1) === 0 ? instr.arg1 : instr.arg1.startsWith('-') ? instr.arg1.slice(1) : `-${instr.arg1}`)
        : (Number(instr.arg1) === 0 ? '1' : '0');
      const foldedText = `${instr.result} = ${value}`;
      log.push({
        line: i + 1,
        type: 'Constant Folding',
        before: originalText,
        after: foldedText,
        description: `Evaluated ${instr.op}${instr.arg1} → ${value}`,
      });
      constMap.set(instr.result, value);
      optimized.push({ op: '=', arg1: value, arg2: null, result: instr.result, text: foldedText });
      continue;
    }
    if (isNumeric(instr.arg1) && isNumeric(instr.arg2) && ['+', '-', '*', '/', '%'].includes(instr.op)) {
      const v1 = Number(instr.arg1);
      const v2 = Number(instr.arg2);
      const floating = isFloating(instr.arg1) || isFloating(instr.arg2);
      const result = evaluate(instr.op, v1, v2, floating);
      const foldedVal = result === null ? null : formatConstant(result, floating);

      if (foldedVal !== null && Number.isFinite(result)) {
        const foldedText = `${instr.result} = ${foldedVal}`;
        log.push({
          line: i + 1,
          type: 'Constant Folding',
          before: originalText,
          after: foldedText,
          description: `Evaluated ${v1} ${instr.op} ${v2} → ${foldedVal}`,
        });
        instr = {
          op: '=',
          arg1: foldedVal,
          arg2: null,
          result: instr.result,
          text: foldedText,
        };
        constMap.set(instr.result, foldedVal);
        optimized.push(instr);
        continue;
      }
    }

    // Pass 1.2: Algebraic Simplification
    let simplified = false;
    if (['+', '-', '*', '/'].includes(instr.op) && instr.arg1 && instr.arg2) {
      const { op, arg1, arg2, result } = instr;
      let newOp = '=';
      let newArg1 = arg1;

      // x + 0 -> x
      if (op === '+' && arg2 === '0') {
        newArg1 = arg1;
        simplified = true;
      } else if (op === '+' && arg1 === '0') {
        newArg1 = arg2;
        simplified = true;
      }
      // x - 0 -> x
      else if (op === '-' && arg2 === '0') {
        newArg1 = arg1;
        simplified = true;
      }
      // x - x -> 0
      else if (op === '-' && arg1 === arg2) {
        newArg1 = '0';
        simplified = true;
      }
      // x * 1 -> x
      else if (op === '*' && arg2 === '1') {
        newArg1 = arg1;
        simplified = true;
      } else if (op === '*' && arg1 === '1') {
        newArg1 = arg2;
        simplified = true;
      }
      // x * 0 -> 0
      else if (op === '*' && (arg1 === '0' || arg2 === '0')) {
        newArg1 = '0';
        simplified = true;
      }
      // x / 1 -> x
      else if (op === '/' && arg2 === '1') {
        newArg1 = arg1;
        simplified = true;
      }

      if (simplified) {
        const simpText = `${result} = ${newArg1}`;
        log.push({
          line: i + 1,
          type: 'Algebraic Simplification',
          before: originalText,
          after: simpText,
          description: `Applied identity rule for ${op}`,
        });
        instr = {
          op: newOp,
          arg1: newArg1,
          arg2: null,
          result,
          text: simpText,
        };
        if (isNumeric(newArg1)) {
          constMap.set(result, newArg1);
        }
      }
    }

    if (instr.op === '=' && isNumeric(instr.arg1)) {
      constMap.set(instr.result, instr.arg1);
    }

    // Always regenerate display text after propagation, including unary minus.
    instr.text = instr.arg2 !== null && instr.arg2 !== undefined
      ? `${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2}`
      : `${instr.result} = ${['-', '!', '&'].includes(instr.op) ? instr.op : ''}${instr.arg1}`;

    optimized.push(instr);
  }

  return {
    optimizedTac: optimized,
    optimizationLog: log,
  };
}

module.exports = { optimizeTAC };
