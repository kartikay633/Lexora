import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let FilePanel;
before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL('.', import.meta.url)),
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false },
  });
  FilePanel = (await vite.ssrLoadModule('/src/components/FilePanel/FilePanel.jsx')).default;
});
after(async () => { await vite?.close(); });

const files = [
  { id: 'calc-l', name: 'calculator.l', content: 'lexer A' },
  { id: 'calc-y', name: 'calculator.y', content: 'parser A' },
  { id: 'vars-l', name: 'variables.l', content: 'lexer B' },
  { id: 'vars-y', name: 'variables.y', content: 'parser B' },
];
const render = props => renderToStaticMarkup(createElement(FilePanel, {
  files, compileMode: 'lex_yacc', selectedLexId: 'vars-l', selectedYaccId: 'vars-y', ...props,
}));

test('Lex + Yacc always exposes both compile targets, even with one pair', () => {
  const html = render({ files: files.slice(0, 2), selectedLexId: 'calc-l', selectedYaccId: 'calc-y' });
  assert.match(html, /aria-label="Compile lexer"/);
  assert.match(html, /aria-label="Compile parser"/);
  assert.match(html, /Opening a file only changes the editor/);
});

test('each alternative source has a direct, named compilation-target action', () => {
  const html = render();
  assert.match(html, /aria-label="Use calculator.l as lexer target"/);
  assert.match(html, /aria-label="Use calculator.y as parser target"/);
  assert.match(html, /value="vars-l" selected=""/);
  assert.match(html, /value="vars-y" selected=""/);
});

test('single-source modes expose only the relevant target', () => {
  const lex = render({ compileMode: 'lex' });
  assert.match(lex, /aria-label="Compile lexer"/);
  assert.doesNotMatch(lex, /aria-label="Compile parser"|as parser target/);
  const yacc = render({ compileMode: 'yacc' });
  assert.match(yacc, /aria-label="Compile parser"/);
  assert.doesNotMatch(yacc, /aria-label="Compile lexer"|as lexer target/);
});

test('missing sources show how to supply each required target', () => {
  const html = render({ files: [], selectedLexId: null, selectedYaccId: null });
  assert.match(html, /Add a .l file/);
  assert.match(html, /Add a .y file/);
  assert.equal((html.match(/<select[^>]*disabled=""/g) || []).length, 2);
});
