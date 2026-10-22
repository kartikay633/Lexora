const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compile } = require('./services/compiler');
const { runInWSL, checkToolchain } = require('./services/wslRunner');
const { validateCompileRequest } = require('./middleware/validator');
const { parseAST } = require('./services/astGenerator');
const lexer = '%option noyywrap\n%{\n#include <stdio.h>\n%}\n%%\n.+ { puts(yytext); }\n\\n ;\n%%\nint main(void) { yylex(); return 0; }\n';
test('toolchain health detects installed tools', async () => {
  const health = await checkToolchain();
  for (const name of ['flex', 'bison', 'gcc', 'timeout']) assert.equal(health[name], true, name);
});
test('standalone lexer accepts CRLF source and preserves input', async () => {
  const result = await compile({ lexFile: lexer.replace(/\n/g, '\r\n'), inputCode: 'hello 42\n' });
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(result.output, 'hello 42\n');
});
test('stdout does not hide nonzero exit status', async () => {
  const result = await compile({ lexFile: lexer.replace('yylex(); return 0;', 'puts("before failure"); return 7;'), inputCode: '' });
  assert.equal(result.success, false); assert.match(result.output, /before failure/);
  assert.equal(result.errors[0].exitCode, 7);
});
test('whole command including pipelines is timed out', async () => {
  const start = Date.now();
  const result = await runInWSL('printf input | sleep 30', process.cwd(), 1000);
  assert.equal(result.exitCode, 124); assert.ok(Date.now() - start < 8000);
});
test('infinite compiled program is terminated', async () => {
  const result = await compile({ lexFile: lexer.replace('yylex(); return 0;', 'while (1) {} return 0;'), inputCode: '' });
  assert.equal(result.success, false); assert.equal(result.errors[0].exitCode, 124);
});
test('standalone yacc with its own scanner requires no libfl', async () => {
  const result = await compile({ yaccFile: '%{\n#include <stdio.h>\nint yylex(void) { return 0; }\nvoid yyerror(const char *s) {}\n%}\n%%\nstart: %empty { puts("parser ready"); };\n%%\nint main(void) { return yyparse(); }\n', inputCode: '' });
  assert.equal(result.success, true, JSON.stringify(result.errors)); assert.match(result.output, /parser ready/);
});
test('arbitrary generated header names work without shell interpolation', async () => {
  const dir = path.join(__dirname, '../examples/calculator');
  const lexFile = fs.readFileSync(path.join(dir, 'calculator.l'), 'utf8').replace('parser.tab.h', 'custom.tab.h');
  const yaccFile = fs.readFileSync(path.join(dir, 'calculator.y'), 'utf8');
  const result = await compile({ lexFile, yaccFile, inputCode: '2+3\n' });
  assert.equal(result.success, true, JSON.stringify(result.errors)); assert.equal(result.output.trim(), '5');
});
test('invalid source returns its compiler phase', async () => {
  const result = await compile({ lexFile: 'not a flex specification', inputCode: '' });
  assert.equal(result.success, false); assert.equal(result.errors[0].phase, 'flex');
});
test('invalid request fields fail validation before compilation', () => {
  for (const body of [undefined, [], {lexFile: lexer, yaccFile: {}}, {lexFile: lexer, inputCode: 2}, {lexFile: 'x'.repeat(102401)}, {lexFile: lexer, inputCode: '\0'}]) {
    let status; let error;
    validateCompileRequest({body}, {status(code) {status=code; return this;}, json(value) {error=value.error;}}, () => assert.fail('Should reject'));
    assert.equal(status, 400); assert.ok(error);
  }
});
test('educational parser rejects invalid characters and partial parses', () => {
  for (const value of ['3 @ 4', '1\n2 +', '1 2', '1.2.3']) assert.throws(() => parseAST(value));
});
test('optimizer invalidates overwritten constants and keeps display text in sync', () => {
  const { optimizeTAC } = require('./services/optimizer');
  const result = optimizeTAC([
    {op:'=', arg1:'1', arg2:null, result:'x'},
    {op:'=', arg1:'y', arg2:null, result:'x'},
    {op:'+', arg1:'x', arg2:'2', result:'t1', text:'t1 = x + 2'}
  ]);
  assert.equal(result.optimizedTac[2].arg1, 'x');
  const propagated = optimizeTAC([{op:'=',arg1:'2',arg2:null,result:'x'},{op:'+',arg1:'x',arg2:'y',result:'t1',text:'t1 = x + y'}]);
  assert.equal(propagated.optimizedTac[1].text, 't1 = 2 + y');
});
test('optimizer preserves zero division and truncates negative integer division', () => {
  const { optimizeTAC } = require('./services/optimizer');
  const result = optimizeTAC([{op:'/',arg1:'-10',arg2:'3',result:'t1'},{op:'/',arg1:'4',arg2:'0',result:'t2'},{op:'%',arg1:'4',arg2:'0',result:'t3'}]);
  assert.equal(result.optimizedTac[0].arg1, '-3');
  assert.equal(result.optimizedTac[1].op, '/'); assert.equal(result.optimizedTac[2].op, '%');
});
test('optimizer keeps floating division and folds negated constants', () => {
  const { analyzeInput } = require('./services/inputAnalysis');
  const texts = input => analyzeInput(input).optimizedTac.map(instr => instr.text);
  assert.deepEqual(texts('float a = 7.5 / 2;'), ['t1 = 3.75', 'a = 3.75']);
  assert.deepEqual(texts('float y = 3.0 * 2; float z = y / 4;'), ['t1 = 6.0', 'y = 6.0', 't2 = 1.5', 'z = 1.5']);
  assert.deepEqual(texts('int x = -3 * 2;'), ['t1 = -3', 't2 = -6', 'x = -6']);
});
test('semantic analysis catches first-assignment self-reference', () => {
  const { analyze } = require('./services/semanticAnalyzer');
  assert.equal(analyze(parseAST('x = x + 1')).semanticErrors.length, 1);
});
test('generated temporaries do not collide with user identifiers', () => {
  const { generateTAC } = require('./services/tacGenerator');
  const tac = generateTAC(parseAST('t1 = 2\nx = t1 + 3'));
  assert.notEqual(tac[1].result, 't1');
});
