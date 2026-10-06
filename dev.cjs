const { spawn } = require('node:child_process');
const path = require('node:path');
const children = [spawn(process.execPath, ['backend/server.js'], { stdio: 'inherit' }), spawn(process.execPath, [path.join(__dirname, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js')], { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' })];
// Vite's entry is resolved relative to this file, independent of the child cwd.
function stop() { for (const child of children) child.kill(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
for (const child of children) child.on('exit', code => { stop(); process.exitCode = code || 0; });
