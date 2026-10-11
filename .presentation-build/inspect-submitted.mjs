import fs from 'node:fs/promises';
import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const dir='C:/Users/ASUS/Documents/GitHub/Lexora/.presentation-build/submitted-review';
await fs.mkdir(dir,{recursive:true});
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Users/ASUS/Desktop/Lexora_Presentation_Final.pptx'));
await fs.writeFile(dir+'/deck.json',JSON.stringify(p.toProto()));
await fs.writeFile(dir+'/inspection.txt',JSON.stringify(await p.inspect({kind:'slide,textbox,shape,image,table,chart,layout',maxChars:1000000})));
for(let i=0;i<p.slides.items.length;i++){const b=await p.export({slide:p.slides.items[i],format:'png',scale:1});await fs.writeFile(dir+'/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));}
console.log(JSON.stringify({slides:p.slides.items.length,masters:p.masters.items.length,shapes:p.slides.items.map(s=>s.shapes.items.map(x=>({id:x.id,text:x.text.toString(),p:x.position})))}));
