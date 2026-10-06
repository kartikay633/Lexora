async function request(path, options = {}) {
  let response;
  try { response = await fetch(`/api/${path}`, { ...options, signal: AbortSignal.timeout(65000) }); }
  catch { throw new Error('Cannot reach the compiler server. Start the app with npm run dev and try again.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || `Server returned ${response.status}. Check that the backend is running.`);
  return data;
}
export const compile = (lexFile, yaccFile, inputCode) => request('compile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lexFile, yaccFile, inputCode }) });
export const getExample = name => request(`examples/${encodeURIComponent(name)}`);
export const getExamples = () => request('examples');
export const getHealth = () => request('health');
