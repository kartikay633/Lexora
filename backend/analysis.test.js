const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { analyzeInput } = require('./services/inputAnalysis');
const { compile } = require('./services/compiler');
const example = path.join(__dirname, '../examples/token-counter');
test('C program generates complete AST, typed symbols, TAC and blocks', () => {
  const result=analyzeInput(fs.readFileSync(path.join(example,'input.txt'),'utf8'));
  assert.equal(result.analysisStatus,'ready');assert.equal(result.ast.type,'Function');
  assert.equal(result.ast.body.body[2].type,'If');
  assert.equal(result.symbolTable.find(s=>s.name==='x').type,'int');
  assert.equal(result.symbolTable.find(s=>s.name==='y').scope,'main');
  assert.deepEqual(result.semanticErrors,[]);
  for(const op of ['+','*','if_false','call','return']) assert.ok(result.tac.some(i=>i.op===op),op);
  assert.ok(result.basicBlocks.length>=3);
});
test('supplied lexer compiles but stops at first brace; corrected lexer counts complete input', async () => {
  const inputCode='int main(){int x=1;if(x){x=x+1;} x=x+2; return 0;}\n';
  const original=await compile({lexFile:fs.readFileSync(path.join(__dirname,'fixtures/token-counter-original.l'),'utf8'),inputCode});
  const corrected=await compile({lexFile:fs.readFileSync(path.join(example,'token-counter.l'),'utf8'),inputCode});
  assert.equal(original.success,true);assert.equal(corrected.success,true,JSON.stringify(corrected.errors));
  assert.deepEqual([...original.output.matchAll(/= (\d+)/g)].map(m=>Number(m[1])),[3,4,3,6]);
  assert.deepEqual([...corrected.output.matchAll(/= (\d+)/g)].map(m=>Number(m[1])),[4,6,5,12]);
  assert.ok(original.ast && original.symbolTable.length && original.tac.length);
});
test('counter skips comments and escaped literals, and matches multi-character operators once', async () => {
  const inputCode='int x = 1; /* if fake += */ // while ignored\nif (x == 1) x++; printf("if \\" fake", x);\n';
  const result=await compile({lexFile:fs.readFileSync(path.join(example,'token-counter.l'),'utf8'),inputCode});
  assert.equal(result.success,true,JSON.stringify(result.errors));
  assert.deepEqual([...result.output.matchAll(/= (\d+)/g)].map(m=>Number(m[1])),[2,4,3,8]);
});
test('loops, returns and short-circuit conditions produce branch instructions', () => {
  const result=analyzeInput('int main(){ int s=0; for(int i=0;i<3;i++){ if(i==1) continue; s+=i; } while(s<10){s++;if(s==8)break;} return s>0 && s<10;}');
  assert.equal(result.analysisStatus,'ready',result.analysisMessage);
  assert.ok(result.tac.filter(i=>i.op==='goto').length>=4);
  assert.ok(result.tac.some(i=>i.op==='if_false'));
  assert.ok(result.basicBlocks.filter(b=>b.instructions.at(-1).op==='return').every(b=>b.successors.length===0));
});
test('scope shadowing has separate symbols and TAC targets', () => {
  const result=analyzeInput('int main(){int x=1;{int x=2;printf("%d",x);}return x;}');
  assert.equal(result.analysisStatus,'ready',result.analysisMessage);
  const symbols=result.symbolTable.filter(s=>s.name==='x');assert.equal(symbols.length,2);assert.notEqual(symbols[0].scope,symbols[1].scope);
  assert.ok(result.tac.some(i=>i.result==='x@2'));assert.equal(result.tac.find(i=>i.op==='return').arg1,'x');
});
test('empty, unsupported and malformed inputs return explicit analysis status', () => {
  assert.equal(analyzeInput('').analysisStatus,'empty');
  for(const input of ['int a[3];','int main(){int x=1','hello 123 world','1 +']) {
    const result=analyzeInput(input);assert.equal(result.analysisStatus,'unsupported');assert.match(result.analysisMessage,/Input analysis could not parse/);assert.equal(result.ast,null);assert.deepEqual(result.tac,[]);
  }
});
test('literal-only expression still produces a TAC result', () => {
  const result=analyzeInput('42');assert.equal(result.ast.type,'Number');assert.equal(result.tac[0].text,'t1 = 42');
});
test('tokens preserve ==, strings and correct positions after comments', () => {
  const result=analyzeInput('/* a\nb */\nx == 3; printf("if", x);');
  assert.ok(result.tokens.some(t=>t.type==='EQUAL' && t.lexeme==='=='));
  assert.ok(result.tokens.some(t=>t.type==='STRING' && t.lexeme==='"if"'));
  assert.equal(result.tokens.find(t=>t.lexeme==='x').line,3);
});
test('C assignments do not declare missing variables', () => {
  const result=analyzeInput('int main(){missing=1;return missing;}');
  assert.ok(result.semanticErrors.some(e=>e.message.includes('missing')));
});

test('word scanner preserves input lines and returns at its explicit newline action', async () => {
  const lexFile = fs.readFileSync(path.join(__dirname, 'fixtures/words-ct-original.l'), 'utf8');
  const multiLine = await compile({ lexFile, inputCode: 'Cat\ncart COAT\ncut Ct dog catapults C notct\n' });
  const singleLine = await compile({ lexFile, inputCode: 'Cat cart COAT cut Ct dog catapults C notct\n' });
  for (const result of [multiLine, singleLine]) assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(multiLine.output, 'Words starting with C/c and ending with T/t:\nCat\nTotal number of words = 1\n');
  assert.equal(singleLine.output, 'Words starting with C/c and ending with T/t:\nCat\ncart\nCOAT\ncut\nCt\nTotal number of words = 5\n');
});

test('corrected word scanner processes all lines, CRLF and final input without a newline', async () => {
  const lexFile = fs.readFileSync(path.join(__dirname, '../examples/words-ct/words-ct.l'), 'utf8');
  const result = await compile({ lexFile, inputCode: 'Cat\r\ncart COAT\ncut Ct dog catapults C notct' });
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(result.output, 'Words starting with C/c and ending with T/t:\nCat\ncart\nCOAT\ncut\nCt\nTotal number of words = 5\n');
  const words = ['Cat', 'cat', 'Cheet', 'circuit', 'Coconut', 'Combat', 'carrot', 'Craft', 'CONNECT', 'count', 'Cricket', 'credit'];
  const suppliedInput = await compile({ lexFile, inputCode: words.join('\r\n') });
  assert.equal(suppliedInput.success, true, JSON.stringify(suppliedInput.errors));
  assert.equal(suppliedInput.output, `Words starting with C/c and ending with T/t:\n${words.join('\n')}\nTotal number of words = 12\n`);
});

test('corrected word scanner has no fixed word length or match-count storage limit', async () => {
  const lexFile = fs.readFileSync(path.join(__dirname, '../examples/words-ct/words-ct.l'), 'utf8');
  const longWord = `c${'a'.repeat(200)}t`;
  const result = await compile({ lexFile, inputCode: `${'cat\n'.repeat(160)}${longWord}` });
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(result.output, `Words starting with C/c and ending with T/t:\n${'cat\n'.repeat(160)}${longWord}\nTotal number of words = 161\n`);
});
