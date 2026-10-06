const { execFile } = require('node:child_process');
function windowsToWslPath(value) {
  return value.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
}
const quote = value => "'" + value.replace(/'/g, "'\\''") + "'";
function runInWSL(command, cwd, timeoutMs = 10000) {
  const script = `cd ${quote(windowsToWslPath(cwd))} && exec timeout --signal=TERM --kill-after=1s ${Math.ceil(timeoutMs / 1000)}s bash -c ${quote(command)}`;
  const windows = process.platform === 'win32';
  const args = windows ? ['-d', process.env.WSL_DISTRO || 'Ubuntu', '--', 'bash', '-c', script] : ['-c', script];
  return new Promise(resolve => {
    execFile(windows ? 'wsl.exe' : 'bash', args, { timeout: timeoutMs + 5000, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
      const timedOut = error && (error.killed || error.code === 124 || error.code === 137);
      resolve({ stdout: stdout || '', stderr: timedOut ? `${stderr || ''}\nExecution timed out.` : (stderr || (error && !stdout ? error.message : '') || ''), exitCode: timedOut ? 124 : (error ? error.code || 1 : 0) });
    });
  });
}
async function checkToolchain() {
  const result = await runInWSL('command -v flex; command -v bison; command -v gcc; command -v timeout', process.cwd(), 5000);
  const found = result.stdout.trim().split(/\s+/).map(value => value.split('/').pop());
  return { runtime: process.platform === 'win32' ? 'WSL' : 'native', wsl: process.platform === 'win32' && result.exitCode === 0, flex: found.includes('flex'), bison: found.includes('bison'), gcc: found.includes('gcc'), timeout: found.includes('timeout') };
}
module.exports = { runInWSL, windowsToWslPath, checkToolchain };
