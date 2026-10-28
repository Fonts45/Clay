import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../assets/scripts/shortcut-detection.js';

const source=readFileSync(new URL('../assets/scripts/resource-shredder.js',import.meta.url),'utf8');
function editor(previous=null){
 const fields=new Map(),nodes=new Map(),saved=[];
 const field=name=>{
  if(!fields.has(name)){
   const input={files:[],required:false,addEventListener(){}};let value='';
   Object.defineProperty(input,'value',{get:()=>value,set:next=>{value=next;if(name==='file'&&!next)input.files=[]}});
   fields.set(name,input);
  }
  return fields.get(name);
 };
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{});return nodes.get(selector)};
 const form={elements:{namedItem:field},reset(){for(const input of fields.values())input.value=''},querySelector:()=>node('save')};
 const dialog={querySelector:selector=>selector==='form'?form:node(selector),showModal(){},close(){}};
 const context=vm.createContext({dialog,entries:[previous],editing:0,savingOrder:false,closeMenu(){},ClayShortcutDetection:globalThis.ClayShortcutDetection,URL,crypto:{randomUUID:()=> 'new'},render(){},notify(){},transaction:async(mode,run)=>{let result,request;run({get:()=>request={result:previous},put:entry=>saved.push(entry)},value=>result=value);request?.onsuccess?.();return result}});
 const start=source.indexOf(" const form=dialog.querySelector('form')"),end=source.indexOf(' async function open(entry)',start);
 vm.runInContext(source.slice(start,end)+'globalThis.editShortcut=edit;',context);
 vm.runInContext(source.split('\n').find(line=>line.trim().startsWith('form.onsubmit=')),context);
 context.editShortcut(0);
 return {field,node,saved,save:()=>form.onsubmit({preventDefault(){}})};
}
test('arquivo escolhido define documento e é salvo sem exigir link',async()=>{
 const page=editor();page.field('file').files=[{name:'Resumo.docx',size:100}];page.field('file').onchange();
 assert.equal(page.field('kind').value,'file');assert.equal(page.field('url').required,false);
 await page.save();assert.equal(page.saved[0].kind,'file');assert.equal(page.saved[0].file.name,'Resumo.docx');assert.equal(page.saved[0].url,'');
});
test('endereço de PDF continua sendo um link, mesmo com categoria Livro',async()=>{
 const page=editor();page.field('url').value='https://example.com/Guia.pdf';page.field('url').oninput();
 await page.save();assert.equal(page.saved[0].kind,'link');assert.equal(page.saved[0].category,'Livro');assert.equal(page.saved[0].file,undefined);
});
test('colar link depois de selecionar arquivo limpa o documento anterior',async()=>{
 const page=editor();page.field('file').files=[{name:'Resumo.pdf',size:100}];page.field('file').onchange();
 page.field('url').value='https://alura.com.br';page.field('url').oninput();
 await page.save();assert.equal(page.field('file').files.length,0);assert.equal(page.saved[0].kind,'link');assert.equal(page.saved[0].title,'Alura');
});
test('selecionar documento depois de colar link limpa o endereço',async()=>{
 const page=editor();page.field('url').value='https://alura.com.br';page.field('url').oninput();
 page.field('file').files=[{name:'Meu-resumo.pdf',size:100}];page.field('file').onchange();
 await page.save();assert.equal(page.saved[0].kind,'file');assert.equal(page.saved[0].url,'');assert.equal(page.saved[0].title,'Meu resumo');
});
test('editar documento salvo preserva o arquivo sem precisar selecioná-lo novamente',async()=>{
 const previous={id:'saved',kind:'file',file:{name:'Resumo.pdf',size:100},title:'Resumo',description:'Leitura em PDF',category:'Livro'};
 const page=editor(previous);page.field('title').value='Resumo atualizado';await page.save();
 assert.equal(page.saved[0].file,previous.file);assert.equal(page.saved[0].title,'Resumo atualizado');
});
test('remover documento devolve o destino para link e valida sua ausência',()=>{
 const page=editor();page.field('file').files=[{name:'Resumo.pdf',size:100}];page.field('file').onchange();
 page.node('[data-remove-file]').onclick();assert.equal(page.field('kind').value,'link');assert.equal(page.field('url').required,true);assert.equal(page.field('file').files.length,0);
});
