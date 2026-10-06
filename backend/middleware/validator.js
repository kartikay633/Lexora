/**
 * validator.js — Input validation middleware
 * 
 * Validates compile request body before it reaches the compiler.
 */

const MAX_FILE_SIZE = 100 * 1024; // 100KB per field

/**
 * Validate the /api/compile request body.
 */
function validateCompileRequest(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Expected a JSON object.' });
  for (const field of ['lexFile', 'yaccFile', 'inputCode']) {
    if (req.body[field] == null) req.body[field] = '';
    if (typeof req.body[field] !== 'string') return res.status(400).json({ error: `${field} must be a string.` });
  }
  let { lexFile, yaccFile, inputCode } = req.body;

  const hasLex = typeof lexFile === 'string' && lexFile.trim().length > 0;
  const hasYacc = typeof yaccFile === 'string' && yaccFile.trim().length > 0;

  // Check required fields exist: at least lexFile or yaccFile must be provided
  if (!hasLex && !hasYacc) {
    return res.status(400).json({
      success: false,
      error: 'Please provide either a Lexer file (.l) or a Parser file (.y) to compile.',
    });
  }

  // Ensure inputCode is a string
  if (inputCode === undefined || inputCode === null) {
    req.body.inputCode = '';
  } else if (typeof inputCode !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid "inputCode" field. Must be a string.',
    });
  }

  // Check sizes
  if (hasLex && Buffer.byteLength(lexFile) > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: `Lex file too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB.`,
    });
  }

  if (hasYacc && Buffer.byteLength(yaccFile) > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: `Yacc file too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB.`,
    });
  }

  if (req.body.inputCode && Buffer.byteLength(req.body.inputCode) > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: `Input code too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB.`,
    });
  }

  // Check for null bytes (security)
  if (
    (hasLex && lexFile.includes('\0')) ||
    (hasYacc && yaccFile.includes('\0')) ||
    (req.body.inputCode && req.body.inputCode.includes('\0'))
  ) {
    return res.status(400).json({
      success: false,
      error: 'Input contains invalid null bytes.',
    });
  }

  next();
}

module.exports = { validateCompileRequest };
