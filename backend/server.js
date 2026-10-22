/**
 * server.js — Lexora Backend Server
 * 
 * Express server that handles compilation requests.
 * Runs on port 3002 (3001 is left free for other local apps), frontend proxies /api requests here.
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const { deploymentSettings } = require('./middleware/deployment');
const { checkToolchain } = require('./services/wslRunner');
const { errorHandler } = require('./middleware/errorHandler');
const compileRouter = require('./routes/compile');
const examplesRouter = require('./routes/examples');

function createApp(env = process.env) {
  const app = express();
  const { production, origins, authenticate } = deploymentSettings(env);

  app.use(cors({ origin: [...origins] }));
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (req.method === 'POST' && origin && !origins.has(origin)) {
      return res.status(403).json({ error: 'This compiler only accepts requests from the Lexora frontend.' });
    }
    next();
  });

  // Render must be able to probe health without demo credentials.
  app.get('/api/health', async (req, res) => {
    const toolchain = await checkToolchain();
    res.json({ status: 'ok', timestamp: Date.now(), toolchain });
  });

  app.use(authenticate);
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/compile', compileRouter);
  app.use('/api/examples', examplesRouter);

  if (production) {
    const dist = path.join(__dirname, '..', 'frontend', 'dist');
    if (!fs.existsSync(path.join(dist, 'index.html'))) {
      throw new Error('Frontend build missing. Run npm run build before starting production.');
    }
    app.use(express.static(dist));
    app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}

// Start server
if (require.main === module) {
  const PORT = process.env.PORT || 3002;
  const HOST = process.env.HOST || '127.0.0.1';
  createApp().listen(PORT, HOST, () => {
    console.log(`\n  🔷 Lexora Backend Server`);
    console.log(`  ─────────────────────────`);
    console.log(`  Listening on: http://localhost:${PORT}`);
    console.log(`  Health:       http://localhost:${PORT}/api/health`);
    console.log(`  Examples:     http://localhost:${PORT}/api/examples`);
    console.log(`  Compile:      POST http://localhost:${PORT}/api/compile\n`);
  });
}

module.exports = { createApp };
