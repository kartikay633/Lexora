/**
 * examples.js — GET /api/examples routes
 * 
 * Serves preloaded example projects so the frontend can load them.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '..', '..', 'examples');

/**
 * GET /api/examples
 * List available examples.
 */
router.get('/', (req, res) => {
  try {
    const dirs = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({
        name: d.name,
        description: getDescription(d.name),
      }));

    res.json(dirs);
  } catch (err) {
    res.json([]);
  }
});

/**
 * GET /api/examples/:name
 * Load a specific example's files.
 */
router.get('/:name', (req, res) => {
  const { name } = req.params;
  const exampleDir = path.join(EXAMPLES_DIR, name);

  // Prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return res.status(400).json({ error: 'Invalid example name' });
  }

  if (!fs.existsSync(exampleDir)) {
    return res.status(404).json({ error: `Example "${name}" not found` });
  }

  try {
    const files = fs.readdirSync(exampleDir);
    const lexFileName = files.find(f => f.endsWith('.l'));
    const yaccFileName = files.find(f => f.endsWith('.y'));
    const inputFileName = files.find(f => f === 'input.txt');

    const result = {
      name,
      lexFile: lexFileName ? fs.readFileSync(path.join(exampleDir, lexFileName), 'utf-8') : '',
      yaccFile: yaccFileName ? fs.readFileSync(path.join(exampleDir, yaccFileName), 'utf-8') : '',
      inputCode: inputFileName ? fs.readFileSync(path.join(exampleDir, inputFileName), 'utf-8') : '',
      lexFileName: lexFileName || 'lex.l',
      yaccFileName: yaccFileName || 'parser.y',
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load example files' });
  }
});

function getDescription(name) {
  const descriptions = {
    'words-ct': 'Find alphabetic words starting with C/c and ending with T/t across all input lines',
    'token-counter': 'Count C tokens and analyze a C input program',
    calculator: 'Simple arithmetic calculator (3 + 5 * 2 = 13)',
    variables: 'Calculator with variable assignments',
  };
  return descriptions[name] || name;
}

module.exports = router;
