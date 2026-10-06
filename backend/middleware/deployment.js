const { createHash, timingSafeEqual } = require('node:crypto');

const digest = value => createHash('sha256').update(value).digest();

function deploymentSettings(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const username = env.DEMO_USERNAME;
  const password = env.DEMO_PASSWORD;
  if ((production || username || password) && (!username || !password)) {
    throw new Error('Set DEMO_USERNAME and DEMO_PASSWORD before starting the hosted compiler.');
  }
  if (username?.includes(':')) throw new Error('DEMO_USERNAME cannot contain a colon.');

  const origins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000']);
  for (const value of [env.FRONTEND_ORIGIN, env.RENDER_EXTERNAL_URL]) {
    if (value) origins.add(new URL(value).origin);
  }
  if (production && !env.FRONTEND_ORIGIN && !env.RENDER_EXTERNAL_URL) {
    throw new Error('Set FRONTEND_ORIGIN to the HTTPS website URL (Render sets RENDER_EXTERNAL_URL automatically).');
  }

  const expected = username && password ? digest(`${username}:${password}`) : null;
  function authenticate(req, res, next) {
    if (!expected) return next();
    const header = req.get('authorization') || '';
    const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header);
    if (match && timingSafeEqual(digest(Buffer.from(match[1], 'base64')), expected)) {
      return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Lexora", charset="UTF-8"');
    res.set('Cache-Control', 'no-store');
    return res.status(401).send('Sign in to use Lexora.');
  }
  return { production, origins, authenticate };
}

module.exports = { deploymentSettings };
