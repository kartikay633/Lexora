import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const ROOT='C:/Users/ASUS/Documents/GitHub/Lexora';
const TMP=ROOT+'/.presentation-build/academic-refinement';
const SOURCE='C:/Users/ASUS/Desktop/Lexora_Presentation_Final.pptx';
const sourceHash=createHash('sha256').update(await fs.readFile(SOURCE)).digest('hex');
const SKILL='C:/Users/ASUS/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations';
process.env.RUNTIME_NODE_MODULES='C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {finalizePresentation}=await import(pathToFileURL(SKILL+'/container_tools/artifact_tool_utils.mjs'));
const P=await PresentationFile.importPptx(await FileBlob.load(SOURCE));
const old=[...P.slides.items];
const anchors=(await P.inspect({kind:'slide,textbox,shape',maxChars:1000000})).records;
const K={navy:'#111B31',ink:'#18253E',muted:'#59667C',blue:'#315EF4',pale:'#EDF1FF',white:'#FFFFFF',line:'#DAE1EF',mint:'#9EE7CE',sub:'#BCC9E4'};
const FONT='Segoe UI';
const refs={paper:'Bovet, J. and Parr, T. (2008). ANTLRWorks: an ANTLR grammar development environment. Software: Practice and Experience, 38(12), 1305-1332. https://doi.org/10.1002/spe.872',ce:'Compiler Explorer, official project documentation. https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/WhatIsCompilerExplorer.md',flex:'Flex manual. https://westes.github.io/flex/manual/Introduction.html',bison:'GNU Bison manual. https://www.gnu.org/s/bison/manual/bison.html',gcc:'GCC manual. https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html'};
function T(s,text,x,y,w,h,size=27,color=K.ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.style={typeface:FONT,fontSize:size,color,bold,autoFit:'none'};return a;}
function byText(s,start){const a=s.shapes.items.find(a=>a.text.toString().startsWith(start));if(!a)throw new Error('Missing text '+start);return a;}
function edit(s,start,text,size=27,color=K.ink,bold=false,position){const a=byText(s,start);a.text=text;a.text.style={typeface:FONT,fontSize:size,color,bold,autoFit:'none'};if(position)a.position=position;return a;}
function clearBody(s){const index=old.indexOf(s);P.delete(anchors.filter(a=>a.slideIndex===index&&['shape','textbox'].includes(a.kind)&&a.position.top>145&&a.position.top<660).map(a=>a.id));}
function S(title,notes=''){const s=P.slides.add();s.background.fill=K.white;T(s,title,64,48,1152,95,46,K.ink,true);T(s,'00',1160,671,54,24,16,K.muted);s.speakerNotes.textFrame.setText(notes);return s;}
function Table(s,values,widths,x,y,w,h,size=24){const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:w,height:h,columnWidths:widths,values});t.borders.assign({fill:K.line,width:0.8});for(let r=0;r<values.length;r++){t.rows[r].height=r===0?62:(h-62)/(values.length-1);for(let c=0;c<values[0].length;c++){const a=t.getCell(r,c);a.fill=r===0?K.navy:K.white;a.text.style={typeface:FONT,fontSize:size,bold:r===0,color:r===0?K.white:K.ink};}}return t;}

// A concise literature review with actual related work and traceable references.
const survey=old[4];
clearBody(survey);
T(survey,'ANTLRWorks (2008) demonstrates visual grammar debugging to help developers inspect parser behavior [1]. Compiler Explorer provides browser-based compilation with visible compiler output [2]. Flex and Bison supply the scanner and parser generation used in traditional Lex/Yacc workflows [3, 4]. Together, these references motivate Lexora\'s focus on a dedicated teaching workspace that combines native specification execution with a separate analyzer for program structure and intermediate code.',64,187,1152,365,33,K.ink);
T(survey,'Related work: ANTLRWorks [1], Compiler Explorer [2], Flex and Bison [3, 4].',64,599,1152,60,23,K.muted);
survey.speakerNotes.textFrame.setText('[1] '+refs.paper+'\n[2] '+refs.ce+'\n[3] '+refs.flex+'\n[4] '+refs.bison+'\nThe final sentence is a design synthesis from the reviewed approaches, rather than a claim that no comparable website exists. Lexora native execution and its educational analyzer remain separate.');

// Preserve the source design while making requests, runtime and analysis boundaries explicit.
edit(old[5],'Lexora brings','Students can run selected specifications and inspect supported input in one dedicated workspace.',25,K.sub);
edit(old[7],'Native tools','WSL Ubuntu\nFlex + Bison + GCC',25,K.ink,true);
edit(old[7],'The browser manages','The browser sends JSON requests. The backend returns output, errors, and analysis as JSON.',27,K.muted);
edit(old[8],'Submit compilation','Send code and input as JSON',25,K.ink,true);
edit(old[8],'Return results and clean','Clean temporary files\nand return results',25,K.ink,true);
edit(old[8],'Analyze input and create','Analyze input and prepare files',25,K.ink,true);
edit(old[9],'The backend aligns','Windows backend: WSL Ubuntu. The scanner uses the token header generated by Bison.',25,K.sub);
edit(old[10],'Educational analysis uses','The built-in analyzer creates these views from supported input. The submitted Lex/Yacc grammar controls native execution.',24,K.muted);

// Restore the data lifecycle required for an architecture presentation.
const storage=S('Data storage and lifecycle','Project evidence: frontend/src/App.jsx stores drafts under lexora.workspace.v2 and theme under lexora.theme. backend/services/tempDir.js creates os.tmpdir()/lexora-UUID. backend/services/compiler.js attempts cleanup in finally. Results are held in memory and React state. No application database is configured.');
Table(storage,[['Data','Location','Lifetime'],['Source drafts and input','Browser localStorage','Across reloads until cleared.'],['Sources and generated executable','Backend temporary job folder','One request, then cleanup.'],['Output and analysis results','Backend memory and browser state','Current request and result.'],['Downloaded source files','User-selected download location','Until the user removes them.']],[330,455,367],64,178,1152,414,24);
T(storage,'Lexora uses browser storage for drafts and temporary files for compilation. It has no application database.',64,617,1152,64,25,K.muted);

// Add a concrete, verified explanation of symbols and semantic checks.
const symbols=S('Symbol table and semantic checks','Project evidence: backend/services/semanticAnalyzer.js and backend/services/inputAnalysis.js. Observed input: int x = 2 + 3 * 4; int y = x + 1;. Both global variables are declared. x is read and y is not read. The AST traversal creates records and marks references. Scope lookup uses a stack of Maps. A separate observation of int x = missing + 1; reports missing as used before declaration / assignment. This is educational analysis, independent of the submitted grammar.');
T(symbols,'int x = 2 + 3 * 4;\nint y = x + 1;',64,177,700,107,33,K.blue,true);
Table(symbols,[['Name','Type','Scope','Declared','Used'],['x','int','global','Yes','Yes'],['y','int','global','Yes','No']],[100,100,160,150,110],64,322,620,204,24);
T(symbols,'How entries are generated',756,182,458,71,30,K.blue,true);
T(symbols,'The analyzer visits the syntax tree. Declarations create entries, and references mark names as used.',756,271,458,154,28,K.muted);
T(symbols,'Scope and error checks',756,450,458,64,30,K.blue,true);
T(symbols,'Nested scopes control name lookup. Undeclared names and duplicate declarations produce errors.',756,523,458,123,26,K.muted);
T(symbols,'The table records declarations and usage, rather than live runtime values.',64,583,620,69,24,K.muted);

// Observed outputs are evidence, without invented performance or user-study claims.
const verification=S('Demonstration and observed results','Verification date: 8 October 2026. Actual results from backend/services/compiler.js with examples/calculator/calculator.l and calculator.y: 3 + 5 * 2 followed by newline returns success true and stdout 13; (3 + 5) * 2 followed by newline returns success true and stdout 16. Separate built-in analyzer observations: int x = missing + 1; reports an undeclared reference. int a[2]; returns analysisStatus unsupported with no AST or TAC. These observations validate representative cases, not all possible inputs.');
Table(verification,[['Check','Input','Observed result'],['Native calculator','3 + 5 * 2','13'],['Parentheses and precedence','(3 + 5) * 2','16'],['Semantic analysis','int x = missing + 1;','Undeclared name reported.'],['Analyzer scope boundary','int a[2];','Unsupported syntax reported.']],[365,397,390],64,179,1152,413,24);
T(verification,'Calculator inputs end with a newline. The last two checks exercise the separate built-in analyzer.',64,618,1152,62,25,K.muted);

// State the implemented limits and execution model accurately.
edit(old[13],'Current scope and future development','Scope, limitations, and next steps',46,K.ink,true);
edit(old[13],'Implemented scope','Current implementation',32,K.blue,true);
edit(old[13],'Lexora supports selected','The analyzer supports a C subset. Arrays, structures, and pointer declarations remain outside its current scope.',28,K.muted);
edit(old[13],'The analyzer currently excludes','Programs run through WSL with temporary job folders and timeouts. A dedicated security sandbox is not implemented.',26,K.muted);
edit(old[13],'Future development','Next steps',32,K.blue,true);
edit(old[13],'Language and project-file support','Expand language support and connect analysis views to the submitted grammar.',28,K.muted);
edit(old[13],'Public execution would require','Use isolated execution workers with restricted file and network access before public deployment.',26,K.muted);
old[13].speakerNotes.textFrame.setText('Current evidence: backend/services/wslRunner.js uses wsl.exe -d Ubuntu -- bash on Windows and a native Bash process on Linux. timeout limits child command execution. backend/services/tempDir.js creates separate temporary job folders. These controls do not constitute a dedicated security sandbox. The analyzer covers a supported C subset, independently from the submitted .l/.y grammar. Expanded syntax, grammar-linked visualization, and isolated public execution workers are future work.');

// Cite each surveyed work, retaining an uncluttered native reference layout.
const references=old[15];
clearBody(references);
const entries=[
 ['01','Bovet and Parr (2008): ANTLRWorks','Software: Practice and Experience 38(12), 1305-1332.','https://doi.org/10.1002/spe.872'],
 ['02','Compiler Explorer','Official project documentation for interactive compilation.','https://github.com/compiler-explorer/compiler-explorer'],
 ['03','Official Flex documentation','Scanner generation from lexical rules.','https://westes.github.io/flex/manual/Introduction.html'],
 ['04','Official GNU Bison documentation','Parser generation from grammar specifications.','https://www.gnu.org/s/bison/manual/bison.html'],
 ['05','Official GCC documentation','Compilation stages and executable generation.','https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html']
];
entries.forEach((r,i)=>{const y=153+i*102;T(references,r[0],64,y,78,55,30,K.blue);T(references,r[1],170,y,1040,36,25,K.ink,true);T(references,r[2],170,y+38,1040,31,20,K.muted);T(references,r[3],170,y+69,1040,29,18,K.muted);});
references.speakerNotes.textFrame.setText(Object.values(refs).join('\n'));

const order=[...old.slice(0,9),storage,old[9],old[10],symbols,old[11],old[12],verification,old[13],old[14],references];
const slideAnchors=(await P.inspect({kind:'slide',maxChars:1000000})).records.filter(a=>a.kind==='slide');
P.slides.reorder(order.map(s=>slideAnchors[P.slides.items.indexOf(s)].id));
P.slides.items.forEach((s,i)=>{for(const a of s.shapes.items){if(a.position.top>=665&&a.position.left>=1100&&/^\d{2}$/.test(a.text.toString().trim())){a.text=String(i+1).padStart(2,'0');a.text.style={typeface:FONT,fontSize:16,color:i===0||[2,5,10,17].includes(i)?K.sub:K.muted,autoFit:'none'};}if(a.text.toString().includes('\uFFFD')){const text=a.text.toString().replace(/\uFFFD/g,"'");a.text=text;}}});

await fs.mkdir(TMP,{recursive:true});
await fs.writeFile(TMP+'/deck.json',JSON.stringify(P.toProto()));
for(let i=0;i<P.slides.items.length;i++){const b=await P.export({slide:P.slides.items[i],format:'png',scale:1});await fs.writeFile(TMP+'/draft-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));}
const candidate=TMP+'/candidate.pptx';
await (await PresentationFile.exportPptx(P)).save(candidate);
const output=ROOT+'/deliverables/Lexora_Academic_Presentation.pptx';
await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:output,pythonExecutable:'C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit',...[10,13,16].flatMap(i=>['--require-native-table-slide',String(i)])],requiredNativeTableOwnerSlides:[10,13,16],fontPolicy:{basis:'reference',families:['Segoe UI','Georgia'],referencePath:SOURCE,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:TMP+'/validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(output));
for(let i=0;i<final.slides.items.length;i++){const b=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(TMP+'/final-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));}
console.log(JSON.stringify({output,slides:final.slides.items.length}));
