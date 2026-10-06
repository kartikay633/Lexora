/**
 * basicBlocks.js — Basic Block Detection & Control Flow Partitioning
 * 
 * Demonstrates Code Generation / Basic Blocks (Curriculum CO5):
 * 1. Leader Detection Rules:
 *    - Rule 1: First instruction is a leader.
 *    - Rule 2: Target of any branch/jump is a leader.
 *    - Rule 3: Any instruction immediately following a branch/jump is a leader.
 * 2. Partitioning into Basic Blocks (B1, B2, ...)
 */

/**
 * Detect leaders and partition Three-Address Code into Basic Blocks.
 * @param {Array<object>} tac - Array of TAC instructions
 * @returns {Array<{ label: string, instructions: Array<object>, successors: Array<string> }>}
 */
function detectBasicBlocks(tac) {
  if (!tac || !Array.isArray(tac) || tac.length === 0) {
    return [];
  }

  const isLeader = new Array(tac.length).fill(false);

  // Rule 1: The first instruction is always a leader
  isLeader[0] = true;

  // Scan for jumps, branches, or conditional statements
  for (let i = 0; i < tac.length; i++) {
    const instr = tac[i];
    const op = (instr.op || '').toLowerCase();

    // Check for jump / goto / if-goto
    if (op === 'return' || op === 'end' || op === 'goto' || op === 'if' || op === 'if_false' || op.startsWith('if')) {
      // Rule 3: Instruction immediately following a jump is a leader
      if (i + 1 < tac.length) {
        isLeader[i + 1] = true;
      }

      // Rule 2: Target of a jump is a leader
      const targetLabel = instr.result || instr.arg2 || instr.arg1;
      if (targetLabel) {
        const targetIdx = tac.findIndex(item => item.op === 'label' && item.result === targetLabel);
        if (targetIdx !== -1) {
          isLeader[targetIdx] = true;
        }
      }
    }

    // Explicit label instruction is also a leader
    if (op === 'label') {
      isLeader[i] = true;
    }
  }

  // Group instructions into blocks
  const blocks = [];
  let currentBlock = null;
  let blockCount = 1;

  for (let i = 0; i < tac.length; i++) {
    if (isLeader[i]) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        label: `B${blockCount++}`,
        instructions: [],
        successors: [],
      };
    }
    currentBlock.instructions.push(tac[i]);
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  // Derive basic successors
  for (let b = 0; b < blocks.length; b++) {
    const lastInstr = blocks[b].instructions[blocks[b].instructions.length - 1];
    const op = (lastInstr?.op || '').toLowerCase();

    if (op === 'goto') {
      const targetLabel = lastInstr.result || lastInstr.arg1;
      const targetBlock = blocks.find(blk => blk.instructions.some(ins => ins.op === 'label' && ins.result === targetLabel));
      if (targetBlock) blocks[b].successors.push(targetBlock.label);
    } else if (op.startsWith('if')) {
      // Fallthrough successor + branch target successor
      if (b + 1 < blocks.length) {
        blocks[b].successors.push(blocks[b + 1].label);
      }
      const targetLabel = lastInstr.result || lastInstr.arg2;
      const targetBlock = blocks.find(blk => blk.instructions.some(ins => ins.op === 'label' && ins.result === targetLabel));
      if (targetBlock && !blocks[b].successors.includes(targetBlock.label)) {
        blocks[b].successors.push(targetBlock.label);
      }
    } else if (!['return', 'end'].includes(op)) {
      // Linear fallthrough
      if (b + 1 < blocks.length) {
        blocks[b].successors.push(blocks[b + 1].label);
      }
    }
  }

  return blocks;
}

module.exports = { detectBasicBlocks };
