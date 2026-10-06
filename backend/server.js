/**
 * server.js — Lexora Backend Server
 * 
 * Express server that handles compilation requests.
 * Runs on port 3001, frontend proxies /api requests here.
 */

const express = require('express');
const cors = require('cors');
const { checkToolchain } = require('./services/wslRunner');
const { errorHandler } = require('./middleware/errorHandler');
const compileRouter = require('./routes/compile');
const examplesRouter = require('./routes/examples');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (req.method === 'POST' && origin && !['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin)) {
    return res.status(403).json({ error: 'This local compiler only accepts requests from the Lexora frontend.' });
  }
  next();
});
app.use(express.json({ limit: '1mb' }));

// Health endpoint
app.get('/api/health', async (req, res) => {
  const toolchain = await checkToolchain();
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    toolchain,
  });
});

// Routes
app.use('/api/compile', compileRouter);
app.use('/api/examples', examplesRouter);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  🔷 Lexora Backend Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Health:       http://localhost:${PORT}/api/health`);
  console.log(`  Examples:     http://localhost:${PORT}/api/examples`);
  console.log(`  Compile:      POST http://localhost:${PORT}/api/compile\n`);
});
