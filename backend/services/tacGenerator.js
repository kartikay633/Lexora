/** Three-address instructions for supported input syntax. */
function generateTAC(ast) {
  if(!ast) return [];
  const instructions=[],used=new Set(),loops=[];
  let tempId=0,labelId=0;
  const frames=[new Map()], nameCounts=new Map();
  const resolve=name=>{ for(let i=frames.length-1;i>=0;i--) if(frames[i].has(name)) return frames[i].get(name);return name; };
  const declare=name=>{
    if(frames.at(-1).has(name)) return frames.at(-1).get(name);
    const count=nameCounts.get(name)||0;nameCounts.set(name,count+1);
    const target=count ? `${name}@${count+1}` : name;
    frames.at(-1).set(name,target);return target;
  };
  function collect(node) {
    if(!node || typeof node !== 'object') return;
    if(node.name) used.add(node.name);
    if(node.variable) used.add(node.variable);
    for(const value of Object.values(node)) if(Array.isArray(value)) value.forEach(collect);else if(value && typeof value === 'object') collect(value);
  }
  collect(ast);
  const temp=()=>{let name;do{name=`t${++tempId}`;}while(used.has(name));return name;};
  const label=()=>{let name;do{name=`L${++labelId}`;}while(used.has(name));return name;};
  const push=(op,arg1,arg2,result,text)=>instructions.push({op,arg1,arg2,result,text});
  const mark=name=>push('label',null,null,name,`${name}:`);
  const jump=name=>push('goto',null,null,name,`goto ${name}`);
  function emit(node) {
    if(!node) return null;
    switch(node.type) {
      case 'Number': return String(node.value);
      case 'Literal': return node.value;
      case 'Identifier': return resolve(node.name);
      case 'UnaryOp': {const arg=emit(node.argument),result=temp();push(node.op,arg,null,result,`${result} = ${node.op}${arg}`);return result;}
      case 'BinaryOp': {
        if(['&&','||'].includes(node.op)) {
          const result=temp(),end=label();const left=emit(node.left);
          push('=',node.op === '&&' ? '0' : '1',null,result,`${result} = ${node.op === '&&' ? '0' : '1'}`);
          push(node.op === '&&' ? 'if_false' : 'if',left,null,end,`${node.op === '&&' ? 'ifFalse' : 'if'} ${left} goto ${end}`);
          const right=emit(node.right);push('!=',right,'0',result,`${result} = ${right} != 0`);mark(end);return result;
        }
        const left=emit(node.left),right=emit(node.right),result=temp();push(node.op,left,right,result,`${result} = ${left} ${node.op} ${right}`);return result;
      }
      case 'Assignment': {const value=emit(node.value),target=resolve(node.variable);push('=',value,null,target,`${target} = ${value}`);return target;}
      case 'Declaration': {
        const target=declare(node.variable);
        if(node.value) {const value=emit(node.value);push('=',value,null,target,`${target} = ${value}`);}
        else push('declare',node.dataType,null,target,`declare ${node.dataType} ${target}`);
        return target;
      }
      case 'Update': {
        const target=resolve(node.variable),previous=temp();push('=',target,null,previous,`${previous} = ${target}`);
        push(node.op === '++' ? '+' : '-',target,'1',target,`${target} = ${target} ${node.op === '++' ? '+' : '-'} 1`);
        return node.prefix ? target : previous;
      }
      case 'Call': {
        const values=node.args.map(emit);
        for(const value of values) push('param',value,null,null,`param ${value}`);
        const result=temp();push('call',node.name,String(values.length),result,`${result} = call ${node.name}, ${values.length}`);return result;
      }
      case 'Function': {
        mark(node.name);frames.push(new Map());for(const param of node.params) {const target=declare(param.variable);push('receive',param.dataType,null,target,`receive ${target}`);}
        node.body.body.forEach(statement);frames.pop();push('end',null,null,node.name,`end ${node.name}`);return null;
      }
      case 'Block': {frames.push(new Map());for(const child of node.body) statement(child);frames.pop();return null;}
      case 'Program': {let result=null;for(const child of node.body) result=statement(child);return result;}
      case 'Return': {const value=emit(node.value);push('return',value,null,null,`return${value === null ? '' : ` ${value}`}`);return null;}
      case 'If': {
        const alternative=label(),end=node.alternate ? label() : alternative;
        const condition=emit(node.condition);push('if_false',condition,null,alternative,`ifFalse ${condition} goto ${alternative}`);
        statement(node.consequent);
        if(node.alternate) {jump(end);mark(alternative);statement(node.alternate);}
        mark(end);return null;
      }
      case 'While': case 'For': {
        if(node.type === 'For') frames.push(new Map());
        if(node.init) statement(node.init);
        const start=label(),end=label(),update=node.type === 'For' ? label() : start;
        mark(start);
        if(node.condition) {const condition=emit(node.condition);push('if_false',condition,null,end,`ifFalse ${condition} goto ${end}`);}
        loops.push({end,update});statement(node.body);loops.pop();
        if(node.type === 'For') {mark(update);if(node.update) statement(node.update);}
        jump(start);mark(end);if(node.type === 'For') frames.pop();return null;
      }
      case 'Break': if(loops.length) jump(loops.at(-1).end);return null;
      case 'Continue': if(loops.length) jump(loops.at(-1).update);return null;
      default: throw new Error(`Unsupported analysis node ${node.type}`);
    }
  }
  function statement(node) {
    if(!node) return null;
    const value=emit(node);
    if(['Number','Literal','Identifier'].includes(node.type)) {const result=temp();push('=',value,null,result,`${result} = ${value}`);return result;}
    return value;
  }
  statement(ast);return instructions;
}
module.exports={generateTAC};
