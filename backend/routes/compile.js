/**
 * compile.js — POST /api/compile route
 * 
 * Receives Lex/Yacc source files and input code,
 * runs the compilation pipeline, and returns the result.
 */

const express = require('express');
const router = express.Router();
const { compile } = require('../services/compiler');
const { validateCompileRequest } = require('../middleware/validator');

router.post('/', validateCompileRequest, async (req, res, next) => {
  try {
    const { lexFile, yaccFile, inputCode, options } = req.body;

    const result = await compile({
      lexFile,
      yaccFile,
      inputCode,
      options: options || {},
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
