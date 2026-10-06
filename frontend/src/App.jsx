import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Upload, Download, ArrowRight, Terminal, RefreshCw, Sun, Moon } from 'lucide-react';
import Header from './components/Layout/Header';
import FilePanel from './components/FilePanel/FilePanel';
const CodeEditor = lazy(() => import('./components/Editor/CodeEditor')); 
import OutputPanel from './components/OutputPanel/OutputPanel';
import { compile, getExample, getHealth } from './services/api';
import { starter, readUploads, download } from './services/files';
import './App.css';
const key = 'lexora.workspace.v2';
function initial() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Array.isArray(saved.files) && saved.files.every(f => typeof f.id === 'string' && typeof f.name === 'string' && typeof f.content === 'string') && typeof saved.inputCode === 'string' && ['lex', 'yacc', 'lex_yacc'].includes(saved.compileMode)) return saved;
  } catch { /* A blocked or full browser store must not prevent editing. */ }
  return { files: [{ id: 'starter', name: 'lexer.l', content: starter }], inputCode: 'hello 123 world 456\n', compileMode: 'lex' };
}
export default function App() {
  const [workspace, setWorkspace] = useState(initial);
  const { files, inputCode, compileMode } = workspace;
  const [activeId, setActiveId] = useState(workspace.activeId || files[0]?.id);
  const [lexId, setLexId] = useState(workspace.lexId || null);
  const [yaccId, setYaccId] = useState(workspace.yaccId || null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [health, setHealth] = useState(null);
  const [exampleBusy, setExampleBusy] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('lexora.theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const upload = useRef(null);
  const running = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lexora.theme', theme);
    } catch { /* storage full or blocked */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const active = files.find(f => f.id === activeId) || files[0];
  const lex = files.find(f => f.id === lexId && f.name.endsWith('.l')) || files.find(f => f.name.endsWith('.l'));
  const yacc = files.find(f => f.id === yaccId && f.name.endsWith('.y')) || files.find(f => f.name.endsWith('.y'));
  const update = patch => { setWorkspace(w => ({ ...w, ...patch })); setResult(null); };
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify({ ...workspace, activeId, lexId, yaccId })); }
    catch { queueMicrotask(() => setNotice('Browser storage is unavailable or full. Download your files to keep a copy.')); }
  }, [workspace, activeId, lexId, yaccId]);
  const refreshHealth = () => getHealth().then(setHealth).catch(() => setHealth({ status: 'down' }));
  useEffect(() => { refreshHealth(); }, []);
  const onCompile = useCallback(async () => {
    if (running.current) return;
    const missing = (compileMode !== 'yacc' && !lex?.content.trim()) || (compileMode !== 'lex' && !yacc?.content.trim());
    if (missing) { setNotice('Add a non-empty source file for each selected compiler mode.'); return; }
    running.current = true; setBusy(true); setNotice(''); setResult(null);
    try { setResult(await compile(compileMode === 'yacc' ? '' : lex.content, compileMode === 'lex' ? '' : yacc.content, inputCode)); }
    catch (error) { setResult({ success: false, errors: [{ phase: 'server', message: error.message }] }); }
    finally { running.current = false; setBusy(false); }
  }, [compileMode, lex, yacc, inputCode]);
  useEffect(() => {
    const handler = event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); onCompile(); } };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [onCompile]);
  const validName = (name, id) => {
    if (!/^[\w.-]+\.(l|y)$/.test(name)) { setNotice('Use a simple filename ending in .l or .y.'); return false; }
    if (files.some(f => f.id !== id && f.name.toLowerCase() === name.toLowerCase())) { setNotice('A file with that name already exists.'); return false; }
    setNotice(''); return true;
  };
  const createFile = name => {
    name = name.trim(); if (!validName(name)) return;
    const file = { id: crypto.randomUUID(), name, content: '' };
    update({ files: [...files, file], compileMode: name.endsWith('.y') ? (lex ? 'lex_yacc' : 'yacc') : compileMode }); setActiveId(file.id);
  };
  const importFiles = async list => {
    try {
      const incoming = await readUploads(list);
      const sources = incoming.filter(f => /\.(l|y)$/.test(f.name));
      const stdin = incoming.filter(f => /\.(txt|in)$/.test(f.name)).at(-1);
      if (sources.some(f => files.some(old => old.name.toLowerCase() === f.name.toLowerCase())) || new Set(sources.map(f => f.name.toLowerCase())).size !== sources.length) throw new Error('A filename is already in the workspace. Rename or remove it before importing.');
      const next = [...files, ...sources];
      const incomingLex = sources.find(f => f.name.endsWith('.l'));
      const incomingYacc = sources.find(f => f.name.endsWith('.y'));
      update({ files: next, inputCode: stdin ? stdin.content : inputCode, compileMode: incomingYacc ? (incomingLex ? 'lex_yacc' : 'yacc') : incomingLex ? 'lex' : compileMode });
      if (incomingLex) setLexId(incomingLex.id);
      if (incomingYacc) setYaccId(incomingYacc.id);
      if (sources[0]) setActiveId(sources[0].id);
      setNotice('');
    } catch (error) { setNotice(error.message); }
  };
  const loadExample = async name => {
    setExampleBusy(true);
    try {
      const example = await getExample(name);
      let base = name;
      for (let i = 2; files.some(f => f.name === `${base}.l` || f.name === `${base}.y`); i++) base = `${name}-${i}`;
      const lexer = { id: crypto.randomUUID(), name: `${base}.l`, content: example.lexFile };
      const parser = { id: crypto.randomUUID(), name: `${base}.y`, content: example.yaccFile };
      const sources = [example.lexFile && lexer, example.yaccFile && parser].filter(Boolean);
      update({ files: [...files, ...sources], inputCode: example.inputCode, compileMode: example.yaccFile ? (example.lexFile ? 'lex_yacc' : 'yacc') : 'lex' });
      setActiveId(sources[0].id); setLexId(example.lexFile ? lexer.id : null); setYaccId(example.yaccFile ? parser.id : null); setNotice('');
    } catch (error) { setNotice(error.message); }
    finally { setExampleBusy(false); }
  };
  const ready = health?.toolchain && ['flex', 'bison', 'gcc', 'timeout'].every(tool => health.toolchain[tool]);
  return <div className="lexora-app-layout">
    <div className="brand-bar">
      <a className="brand" href="#workspace-main"><span className="brand-symbol">λ</span> lexora<span className="brand-caption">LEX / YACC PLAYGROUND</span></a>
      <div className="brand-bar-actions">
        <span className="draft-label">Your workspace, saved in this browser</span>
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light screen mode' : 'Switch to dark screen mode'}
          aria-label={theme === 'dark' ? 'Switch to light screen mode' : 'Switch to dark screen mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </div>
    <section className="workspace-intro"><div><h1>Lex / Yacc Compiler</h1><p>Edit a specification, add input, and run.</p></div><div className="example-actions"><span>Try an example</span><button disabled={busy || exampleBusy} onClick={() => loadExample('calculator')}>Calculator <ArrowRight size={14}/></button><button disabled={busy || exampleBusy} onClick={() => loadExample('variables')}>Variables <ArrowRight size={14}/></button><button disabled={busy || exampleBusy} onClick={() => loadExample('token-counter')}>C Token Counter <ArrowRight size={14}/></button></div></section>
    <Header onCompile={onCompile} isCompiling={busy} status={busy ? 'compiling' : result ? result.success ? 'success' : 'error' : 'idle'} executionTime={result?.executionTime ?? null} projectName="Workspace" compileMode={compileMode} onModeChange={mode => update({ compileMode: mode })}/>
    <div className="workspace-toolbar"><div className={`toolchain-status ${ready ? 'ready' : ''}`}><Terminal size={14}/><span>{!health ? 'Checking compiler…' : ready ? 'Compiler connected · Flex / Bison / GCC' : health.status === 'down' ? 'Backend offline — run npm run dev' : 'Compiler tools missing — see README setup'}</span><button onClick={refreshHealth} title="Check compiler connection"><RefreshCw size={13}/></button></div><div><button disabled={busy} onClick={() => upload.current.click()}><Upload size={14}/> Upload files</button><button disabled={!active} onClick={() => download(active.name, active.content)}><Download size={14}/> Save file</button><button onClick={() => download('input.txt', inputCode)}>Save input</button></div></div>
    {notice && <div className="notice" role="alert">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message">×</button></div>}
    <input ref={upload} hidden type="file" multiple accept=".l,.y,.txt,.in" onChange={e => { importFiles(e.target.files); e.target.value = ''; }}/>
    <main className={`workspace-main ${busy ? 'workspace-busy' : ''}`} id="workspace-main" inert={busy || undefined}>
      <FilePanel files={files} activeFileId={active?.id} compileMode={compileMode} selectedLexId={lex?.id} selectedYaccId={yacc?.id} onSelectTargetLex={id => { setLexId(id); setResult(null); }} onSelectTargetYacc={id => { setYaccId(id); setResult(null); }} onSelectFile={setActiveId} onCreateFile={createFile} onDeleteFile={id => update({ files: files.filter(f => f.id !== id) })} onRenameFile={(id, name) => { if (validName(name, id)) update({ files: files.map(f => f.id === id ? { ...f, name } : f) }); }} onUploadFileClick={() => upload.current.click()}/>
      <Suspense fallback={<div className="editor-loading">Loading editor…</div>}><CodeEditor key={active?.id || 'empty'} value={active?.content || ''} onChange={content => update({ files: files.map(f => f.id === active.id ? { ...f, content } : f) })} fileName={active?.name} fileType={active?.name.endsWith('.y') ? 'Yacc' : 'Lex'} hasFiles={!!active} onCreateFile={createFile} onUploadClick={() => upload.current.click()} theme={theme}/></Suspense>
      <OutputPanel key={busy ? 'running' : 'result'} result={result} isCompiling={busy} inputCode={inputCode} onInputChange={value => update({ inputCode: value })}/>
    </main>
    <footer className="workspace-footer"><span>Flex + Bison, with native program output</span><span>Ctrl / ⌘ + Enter to compile</span></footer>
  </div>;
}
