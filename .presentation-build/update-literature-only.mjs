import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const ROOT='C:/Users/ASUS/Documents/GitHub/Lexora';
const TMP=ROOT+'/.presentation-build/literature-only';
const SOURCE='C:/Users/ASUS/Desktop/Lexora_Presentation_Final.pptx';
const SKILL='C:/Users/ASUS/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations';
process.env.RUNTIME_NODE_MODULES='C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {finalizePresentation}=await import(pathToFileURL(SKILL+'/container_tools/artifact_tool_utils.mjs'));
const sourceHash=createHash('sha256').update(await fs.readFile(SOURCE)).digest('hex');
const P=await PresentationFile.importPptx(await FileBlob.load(SOURCE));
const old=[...P.slides.items];
const inspection=await P.inspect({kind:'slide,textbox,shape',maxChars:1000000});
const survey=old[4];
const K={ink:'#18253E',muted:'#59667C',blue:'#315EF4',white:'#FFFFFF'};
function T(s,text,x,y,w,h,size=26,color=K.ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.style={typeface:'Segoe UI',fontSize:size,color,bold,autoFit:'none'};return a;}
function section(s,title,body,y){T(s,title,64,y,1152,44,30,K.blue,true);T(s,body,64,y+51,1152,102,26,K.ink);}
P.delete(inspection.records.filter(a=>a.slideIndex===4&&['textbox','shape'].includes(a.kind)&&a.position.top>145&&a.position.top<660).map(a=>a.id));
const title=survey.shapes.items.find(a=>a.text.toString()==='Literature survey');
title.text='Literature survey: existing tools';
title.text.style={typeface:'Segoe UI',fontSize:46,color:K.ink,bold:true,autoFit:'none'};
section(survey,'Flex and Bison','Flex creates a scanner from rules for words, numbers, and symbols. Bison creates a parser from grammar rules. Together, they support Lex/Yacc experiments, but students usually manage the files and run several compilation commands themselves.',170);
section(survey,'Compiler Explorer','Compiler Explorer lets users compile code in a browser and inspect the generated compiler output. It provides a useful example of presenting the source code and compilation results together in one interface.',326);
section(survey,'ANTLRWorks (2008)','The ANTLRWorks research describes a grammar editor with an interpreter and a visual debugger. These features help users inspect parsing behavior, investigate grammar errors, and understand how the grammar handles a given input.',482);
T(survey,'Sources: Flex and Bison manuals, Compiler Explorer documentation, ANTLRWorks research.',64,646,1040,30,20,K.muted);
const citations='Flex manual: https://westes.github.io/flex/manual/Introduction.html\nGNU Bison manual: https://www.gnu.org/s/bison/manual/bison.html\nCompiler Explorer official documentation: https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/WhatIsCompilerExplorer.md\nBovet, J. and Parr, T. (2008). ANTLRWorks: an ANTLR grammar development environment. Software: Practice and Experience, 38(12), 1305-1332. https://doi.org/10.1002/spe.872';
survey.speakerNotes.textFrame.setText(citations);

const second=P.slides.add();
second.background.fill=K.white;
T(second,'Literature survey: findings for Lexora',64,48,1152,95,46,K.ink,true);
T(second,'06',1160,671,54,24,16,K.muted);
section(second,'What the reviewed work shows','The reviewed tools address different parts of compiler learning. Flex and Bison generate working scanners and parsers, Compiler Explorer provides browser-based experimentation, and ANTLRWorks explains grammar behavior through visual tools.',170);
section(second,'How Lexora applies these ideas','Lexora brings these approaches into a dedicated workspace for Lex/Yacc laboratory practice. Students can edit specifications, run them using Flex, Bison, and GCC, and examine syntax trees, symbols, and intermediate code for supported input.',326);
section(second,'Scope of the project contribution',"Lexora's contribution is the connection between execution and learning views. Its built-in analyzer runs separately from the submitted Lex/Yacc grammar, so the visual results describe Lexora's supported input language.",482);
second.speakerNotes.textFrame.setText(citations+'\nThe relationship between the reviewed approaches and Lexora is a design synthesis. Lexora-specific claims derive from backend/services/compiler.js and backend/services/inputAnalysis.js. The project does not claim that no related website exists, or that it traces every submitted grammar.');

const records=(await P.inspect({kind:'slide',maxChars:1000000})).records.filter(a=>a.kind==='slide');
const current=[...P.slides.items];
const order=[...old.slice(0,5),second,...old.slice(5)];
P.slides.reorder(order.map(s=>records[current.indexOf(s)].id));
for(let i=0;i<P.slides.items.length;i++)for(const a of P.slides.items[i].shapes.items){if(a.position.left>=1100&&a.position.top>=665&&/^\d{2}$/.test(a.text.toString().trim()))a.text=String(i+1).padStart(2,'0');}

await fs.mkdir(TMP,{recursive:true});
await fs.writeFile(TMP+'/deck.json',JSON.stringify(P.toProto()));
const candidate=TMP+'/candidate.pptx';
await (await PresentationFile.exportPptx(P)).save(candidate);
const out=ROOT+'/deliverables/Lexora_Literature_Survey_Updated.pptx';
await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:out,pythonExecutable:'C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'reference',families:['Segoe UI','Georgia'],referencePath:SOURCE,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:TMP+'/validation.json'});
const final=await PresentationFile.importPptx(await FileBlob.load(out));
for(let i=0;i<final.slides.items.length;i++){const b=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(TMP+'/final-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));}
console.log(JSON.stringify({out,slides:final.slides.items.length}));
