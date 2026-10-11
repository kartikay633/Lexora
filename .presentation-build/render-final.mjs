import fs from 'node:fs/promises';
import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const root='C:/Users/ASUS/Documents/GitHub/Lexora';
const p=await PresentationFile.importPptx(await FileBlob.load(root+'/deliverables/Lexora_Project_Presentation.pptx'));
for(let i=0;i<p.slides.items.length;i++){const b=await p.export({slide:p.slides.items[i],format:'png',scale:1});await fs.writeFile(root+'/.presentation-build/final-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));}
console.log('Rendered '+p.slides.items.length+' final slides');
