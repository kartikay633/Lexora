/** Symbol collection and semantic checks for the built-in input analyzer. */
function analyze(ast) {
  const symbols=[]; const errors=[]; const scopes=[{name:'global',symbols:new Map()}];
  let blockId=0,loopDepth=0;
  function containsDeclaration(node) {
    if (!node || typeof node !== 'object') return false;
    if (['Function', 'Declaration'].includes(node.type)) return true;
    return Object.values(node).some(value => Array.isArray(value) ? value.some(containsDeclaration) : containsDeclaration(value));
  }
  const strict = containsDeclaration(ast);
  const current=()=>scopes.at(-1);
  const lookup=name=>{for(let i=scopes.length-1;i>=0;i--) if(scopes[i].symbols.has(name)) return scopes[i].symbols.get(name);return null;};
  function declare(name,type='int',kind='variable') {
    if(current().symbols.has(name)) {
      errors.push({phase:'semantic',message:`Duplicate declaration of '${name}' in ${current().name}.`});return current().symbols.get(name);
    }
    const symbol={name,type,kind,scope:current().name,declared:true,used:false};
    current().symbols.set(name,symbol);symbols.push(symbol);return symbol;
  }
  function reference(name) {
    let symbol=lookup(name);
    if(!symbol) {
      symbol={name,type:'unknown',kind:'variable',scope:current().name,declared:false,used:true};
      current().symbols.set(name,symbol);symbols.push(symbol);
    }
    if(!symbol.declared) errors.push({phase:'semantic',message:`Variable '${name}' used before declaration / assignment.`});
    symbol.used=true;return symbol;
  }
  function inScope(name,fn) {scopes.push({name,symbols:new Map()});fn();scopes.pop();}
  function walk(node) {
    if(!node) return;
    switch(node.type) {
      case 'Program': node.body.forEach(walk);break;
      case 'Function': {
        const symbol=lookup(node.name);if(symbol) symbol.declared=true;else declare(node.name,node.dataType,'function');
        inScope(node.name,()=>{node.params.forEach(walk);node.body.body.forEach(walk);});break;
      }
      case 'Block': inScope(`${current().name}/block${++blockId}`,()=>node.body.forEach(walk));break;
      case 'Declaration': {
        const previous=current().symbols.get(node.variable);
        if(previous && !previous.declared) {previous.declared=true;previous.type=node.dataType;} else declare(node.variable,node.dataType);
        walk(node.value);break;
      }
      case 'Assignment': {
        walk(node.value);let symbol=lookup(node.variable);
        if(!symbol && strict) reference(node.variable);
        else if(!symbol) declare(node.variable);
        else if(strict && !symbol.declared) reference(node.variable);
        else symbol.declared=true;
        break;
      }
      case 'Identifier': reference(node.name);break;
      case 'Update': reference(node.variable);break;
      case 'UnaryOp': walk(node.argument);break;
      case 'BinaryOp':
        if(['/', '%'].includes(node.op) && node.right.type === 'Number' && node.right.value === 0) errors.push({phase:'semantic',message:'Division or remainder by literal zero.'});
        walk(node.left);walk(node.right);break;
      case 'Call': {
        const fn=lookup(node.name);if(fn) fn.used=true;
        node.args.forEach(walk);break;
      }
      case 'If': walk(node.condition);walk(node.consequent);walk(node.alternate);break;
      case 'While': loopDepth++;walk(node.condition);walk(node.body);loopDepth--;break;
      case 'For': inScope(`${current().name}/for${++blockId}`,()=>{loopDepth++;walk(node.init);walk(node.condition);walk(node.body);walk(node.update);loopDepth--;});break;
      case 'Return': walk(node.value);break;
      case 'Break': case 'Continue': if(!loopDepth) errors.push({phase:'semantic',message:`${node.type.toLowerCase()} used outside a loop.`});break;
    }
  }
  // Register function names first to support calls to later definitions.
  const top=ast?.type === 'Program' ? ast.body : [ast];
  for(const node of top) if(node?.type === 'Function' && !lookup(node.name)) declare(node.name,node.dataType,'function');
  walk(ast);return {symbolTable:symbols,semanticErrors:errors};
}
module.exports={analyze};
