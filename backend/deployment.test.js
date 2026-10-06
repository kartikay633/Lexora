const test = require('node:test');
const assert = require('node:assert/strict');
const { deploymentSettings } = require('./middleware/deployment');
const { createApp } = require('./server');

const hosted = {
  NODE_ENV: 'production',
  RENDER_EXTERNAL_URL: 'https://lexora-test.onrender.com',
  DEMO_USERNAME: 'demo',
  DEMO_PASSWORD: 'deployment-test-password',
};
const authorization = `Basic ${Buffer.from(`${hosted.DEMO_USERNAME}:${hosted.DEMO_PASSWORD}`).toString('base64')}`;

test('hosted compiler refuses to start without complete credentials or origin', () => {
  assert.throws(() => deploymentSettings({ NODE_ENV: 'production' }), /DEMO_USERNAME/);
  assert.throws(() => deploymentSettings({ ...hosted, DEMO_PASSWORD: '' }), /DEMO_PASSWORD/);
  assert.throws(() => deploymentSettings({ ...hosted, RENDER_EXTERNAL_URL: '' }), /FRONTEND_ORIGIN/);
});

test('hosting protects frontend and API while accepting only configured browser origins', async t => {
  const server = createApp(hosted).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  for (const route of ['/', '/api/examples', '/api/compile']) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('www-authenticate'), /Basic/);
  }
  const wrong = await fetch(`${base}/`, { headers: { authorization: 'Basic ZGVtbzp3cm9uZw==' } });
  assert.equal(wrong.status, 401);
  const index = await fetch(`${base}/`, { headers: { authorization } });
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-type'), /text\/html/);
  const examples = await fetch(`${base}/api/examples`, { headers: { authorization } });
  assert.equal(examples.status, 200);
  assert.ok(Array.isArray(await examples.json()));
  const missing = await fetch(`${base}/api/missing`, { headers: { authorization } });
  assert.equal(missing.status, 404);
  const allowed = await fetch(`${base}/api/compile`, {
    method: 'POST', headers: { authorization, origin: hosted.RENDER_EXTERNAL_URL, 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(allowed.status, 400);
  const forbidden = await fetch(`${base}/api/compile`, {
    method: 'POST', headers: { authorization, origin: 'https://another-site.example', 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(forbidden.status, 403);
});

test('local development starts without deployment credentials', () => {
  const settings = deploymentSettings({});
  assert.equal(settings.production, false);
  assert.ok(settings.origins.has('http://localhost:3000'));
  let passed = false;
  settings.authenticate({}, {}, () => { passed = true; });
  assert.equal(passed, true);
});
