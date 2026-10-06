/** Built-in parser for arithmetic input and a documented subset of C. */
class ParseError extends Error {
  constructor(message, position, line) { super(message); this.position = position; this.line = line; }
}
const types = new Set(['int', 'float', 'double', 'char', 'void', 'long', 'short']);
function tokenize(input) {
  const tokens = [];
  let pos = 0, line = 1;
  const add = (type, value, start = pos) => tokens.push({type, value, pos:start, line});
  while (pos < input.length) {
    const ch = input[pos];
    if (/[ \t\r]/.test(ch)) { pos++; continue; }
    if (ch === '\n') { add('EOL', ch); line++; pos++; continue; }
    if (ch === '#' && /^\s*$/.test(input.slice(input.lastIndexOf('\n',pos-1)+1,pos))) {
      while (pos < input.length && input[pos] !== '\n') pos++;
      continue;
    }
    if (input.startsWith('//',pos)) { while (pos < input.length && input[pos] !== '\n') pos++; continue; }
    if (input.startsWith('/*',pos)) {
      const end = input.indexOf('*/',pos+2);
      if (end < 0) throw new ParseError('Unclosed comment',pos,line);
      line += (input.slice(pos,end+2).match(/\n/g)||[]).length; pos=end+2; continue;
    }
    if (ch === '"' || ch === "'") {
      const start = pos++;
      while (pos < input.length && input[pos] !== ch) {
        if (input[pos] === '\n') throw new ParseError('Unclosed string or character literal',start,line);
        if (input[pos] === '\\') pos++;
        pos++;
      }
      if (pos >= input.length) throw new ParseError('Unclosed string or character literal',start,line);
      pos++; add(ch === '"' ? 'STRING' : 'CHAR',input.slice(start,pos),start); continue;
    }
    const number = input.slice(pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      const start = pos; pos += number[0].length;
      if (input[pos] === '.' || /[a-zA-Z_]/.test(input[pos] || '')) throw new ParseError('Invalid number',start,line);
      add('NUMBER',Number(number[0]),start); continue;
    }
    const id = input.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (id) { add(types.has(id[0]) ? 'TYPE' : 'ID',id[0]); pos += id[0].length; continue; }
    const op = input.slice(pos).match(/^(?:==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|%=|&&|\|\||[+\-*/%=!<>&])/);
    if (op) { add('OP',op[0]); pos += op[0].length; continue; }
    if ('();{},'.includes(ch)) { add(ch,ch); pos++; continue; }
    throw new ParseError(`Unsupported character '${ch}'`,pos,line);
  }
  tokens.push({type:'EOF',value:'',pos,line}); return tokens;
}
function parseAST(input) {
  if (!input?.trim()) return null;
  const tokens = tokenize(input);
  // C ignores newlines. Bare calculator statements keep them as separators.
  const cMode = tokens.some(t => t.type === 'TYPE' || t.type === '{' || ['return','if','while','for'].includes(t.value));
  const stream = cMode ? tokens.filter(t => t.type !== 'EOL') : tokens;
  let cursor = 0;
  const peek = (offset=0) => stream[cursor+offset] || stream.at(-1);
  const fail = message => { throw new ParseError(message,peek().pos,peek().line); };
  const take = value => { if (value !== undefined && peek().value !== value) fail(`Expected '${value}', found '${peek().value || 'end of input'}'`); return stream[cursor++]; };
  const match = value => peek().value === value;
  const id = () => { if (peek().type !== 'ID') fail('Expected an identifier'); return take().value; };
  const precedence = {'||':1,'&&':2,'==':3,'!=':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
  function factor() {
    const tok = peek();
    let node;
    if (tok.type === 'NUMBER') { take(); node={type:'Number',value:tok.value}; }
    else if (tok.type === 'STRING' || tok.type === 'CHAR') { take(); node={type:'Literal',value:tok.value,dataType:tok.type === 'STRING' ? 'string' : 'char'}; }
    else if (['++','--'].includes(tok.value)) { take(); return {type:'Update',variable:id(),op:tok.value,prefix:true}; }
    else if (['-','+','!','&'].includes(tok.value)) { take(); const argument=factor(); return tok.value === '+' ? argument : {type:'UnaryOp',op:tok.value,argument}; }
    else if (match('(')) { take(); node=expression(); take(')'); }
    else if (tok.type === 'ID' && !['if','else','while','for','return','break','continue'].includes(tok.value)) { node={type:'Identifier',name:id()}; }
    else fail(`Unexpected token '${tok.value || 'end of input'}'`);
    if (node.type === 'Identifier' && match('(')) {
      take(); const args=[];
      if (!match(')')) { do { if(args.length) take(','); args.push(expression()); } while(match(',')); }
      take(')'); node={type:'Call',name:node.name,args};
    }
    if (['++','--'].includes(peek().value)) {
      if (node.type !== 'Identifier') fail('Increment requires an identifier');
      node={type:'Update',variable:node.name,op:take().value};
    }
    return node;
  }
  function expression(min=0) {
    let left=factor();
    while (precedence[peek().value] >= min) {
      const op=take().value; const right=expression(precedence[op]+1);
      left={type:'BinaryOp',op,left,right};
    }
    if (min === 0 && ['=','+=','-=','*=','/=','%='].includes(peek().value)) {
      if (left.type !== 'Identifier') fail('Assignment requires an identifier');
      const op=take().value; let value=expression();
      if (op !== '=') value={type:'BinaryOp',op:op[0],left,right:value};
      return {type:'Assignment',variable:left.name,value};
    }
    return left;
  }
  function declarations(dataType,first) {
    const body=[];
    let variable=first;
    do {
      if (body.length) { take(','); variable=id(); }
      const value=match('=') ? (take(),expression()) : null;
      body.push({type:'Declaration',dataType,variable,value});
    } while(match(','));
    return body.length === 1 ? body[0] : {type:'Program',body};
  }
  function block() {
    take('{'); const body=[];
    while (!match('}')) {
      if (peek().type === 'EOF') fail("Expected '}'");
      if (match(';')) {take();continue;}
      body.push(statement());
    }
    take('}'); return {type:'Block',body};
  }
  function endStatement() {
    if(match(';')) {take();return;}
    if(!cMode && ['EOL','EOF'].includes(peek().type)) return;
    fail("Expected ';'");
  }
  function statement() {
    if(match('{')) return block();
    if(match('if')) {
      take();take('(');const condition=expression();take(')');const consequent=statement();
      const alternate=match('else') ? (take(),statement()) : null;
      return {type:'If',condition,consequent,alternate};
    }
    if(match('while')) {
      take();take('(');const condition=expression();take(')');return {type:'While',condition,body:statement()};
    }
    if(match('for')) {
      take();take('(');let init=null;
      if(!match(';')) init=peek().type === 'TYPE' ? declarations(take().value,id()) : expression();
      take(';');const condition=match(';') ? null : expression();take(';');const update=match(')') ? null : expression();take(')');
      return {type:'For',init,condition,update,body:statement()};
    }
    if(match('return')) {take();const value=match(';') ? null : expression();endStatement();return {type:'Return',value};}
    if(match('break') || match('continue')) {const type=take().value === 'break' ? 'Break' : 'Continue';endStatement();return {type};}
    if(peek().type === 'TYPE') {
      const dataType=take().value;const name=id();
      if(match('(')) {
        take();const params=[];
        if(match('void') && peek(1).value === ')') take();
        else if(!match(')')) do {
          if(params.length) take(',');
          if(peek().type !== 'TYPE') fail('Expected a parameter type');
          params.push({type:'Declaration',dataType:take().value,variable:id(),value:null});
        } while(match(','));
        take(')');return {type:'Function',name,dataType,params,body:block()};
      }
      const declaration=declarations(dataType,name);endStatement();return declaration;
    }
    const node=expression();endStatement();return node;
  }
  const body=[];
  while(peek().type !== 'EOF') {
    if(peek().type === 'EOL' || match(';')) {take();continue;}
    body.push(statement());
  }
  return body.length === 0 ? null : body.length === 1 ? body[0] : {type:'Program',body};
}
module.exports={parseAST};
