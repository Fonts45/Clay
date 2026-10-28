import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const validationContext=vm.createContext({URL,document:{currentScript:{src:'https://clay.example/assets/scripts/avatar-face-validation.js'}}});
vm.runInContext(readFileSync(new URL('../assets/scripts/avatar-face-validation.js',import.meta.url),'utf8'),validationContext);
const {check,validate}=validationContext.ClayAvatarValidation;
const face={boundingBox:{originX:200,originY:150,width:300,height:400}};
const single={width:800,height:1000,faces:[face],people:[{}]};
test('aceita um rosto visível e uma pessoa',()=>assert.equal(check(single).face,face.boundingBox));
test('rejeita rosto ausente, múltiplos rostos e segunda pessoa mesmo sem rosto',()=>{
 assert.throws(()=>check({...single,faces:[]}),/não encontramos um rosto/);
 assert.throws(()=>check({...single,faces:[face,face]}),/mais de uma pessoa ou rosto/);
 assert.throws(()=>check({...single,people:[{},{}]}),/mais de uma pessoa ou rosto/);
});
test('explica rosto distante ou cortado',()=>{
 assert.throws(()=>check({...single,faces:[{boundingBox:{originX:200,originY:150,width:20,height:20}}]}),/muito distante/);
 assert.throws(()=>check({...single,faces:[{boundingBox:{originX:200,originY:0,width:300,height:400}}]}),/rosto parece estar cortado/);
});
test('rejeita documentos e arquivos grandes antes de carregar modelos',async()=>{
 await assert.rejects(validate({type:'application/pdf',size:200}),/JPG, PNG ou WebP/);
 await assert.rejects(validate({type:'image/jpeg',size:9*1024*1024}),/ultrapassa 8 MB/);
});
function editor(avatar='',options={}){
 const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',dataset:{},parentElement:{},events:{},setAttribute(){},removeAttribute(){},replaceChildren(){},append(){},addEventListener(name,fn){this.events[name]=fn},click(){this.clicked=true}});return nodes.get(key)};
 const dialog={isConnected:true,events:{},setAttribute(){},querySelector:node,addEventListener(name,fn){this.events[name]=fn},showModal(){this.shown=true},close(){this.events.close()},remove(){this.isConnected=false}};
 let saved=false;
 const context=vm.createContext({document:{createElement:()=>dialog,body:{append(){}},getElementById:()=>({focus(){}})},URL:{createObjectURL:()=> 'blob:local-photo',revokeObjectURL(){}},ClayAvatarHistory:{fingerprint:async()=> 'a'.repeat(64)},ClayAvatarValidation:{validate:async()=>({})}});
 vm.runInContext(readFileSync(new URL('../assets/scripts/avatar-editor.js',import.meta.url),'utf8'),context);
 context.ClayAvatarEditor.open({avatar,save(){saved=true},...options});
 return {nodes,node,dialog,saved:()=>saved,context};
}
test('confirma adicionar ou trocar antes de abrir o seletor de imagem',()=>{
 for(const avatar of ['', 'avatar-existente']){
  const ui=editor(avatar);assert.equal(ui.node('h2').textContent,avatar?'Deseja trocar seu avatar?':'Deseja adicionar um avatar?');
  assert.ok(!ui.node('input').clicked);ui.node('[data-avatar-choose]').onclick();assert.equal(ui.node('input').clicked,true);
 }
});
test('foto validada fica local e não é salva como se fosse avatar gerado',async()=>{
 const ui=editor('avatar-existente');ui.node('input').files=[{type:'image/jpeg'}];
 await ui.node('input').events.change();
 assert.equal(ui.node('img').src,'blob:local-photo');assert.match(ui.node('.avatar-editor-status').textContent,/geração automática ainda não está ativada/);assert.equal(ui.saved(),false);
});
test('erro de validação mantém a prévia oculta e informa o motivo',async()=>{
 const ui=editor();ui.context.ClayAvatarValidation.validate=async()=>{throw Error('Erro: mais de uma pessoa.')};ui.node('input').files=[{type:'image/jpeg',size:100}];
 await ui.node('input').events.change();assert.equal(ui.node('img').parentElement.hidden,true);assert.equal(ui.node('.avatar-editor-status').dataset.error,'true');assert.match(ui.node('.avatar-editor-status').textContent,/mais de uma pessoa/);assert.equal(ui.saved(),false);
});
test('foto já conhecida recupera imagem exata sem validar ou gerar novamente',async()=>{
 let generated=false,validated=false;
 const image='data:image/png;base64,YWJj';
 const history={rememberCurrent:async()=>{},list:async()=>({items:[],more:false}),find:async()=>({image})};
 const ui=editor('',{history,generate:async()=>{generated=true}});
 ui.context.ClayAvatarValidation.validate=async()=>{validated=true};
 ui.node('input').files=[{type:'image/jpeg',size:100}];await ui.node('input').events.change();
 assert.equal(ui.node('img').src,image);assert.match(ui.node('.avatar-editor-status').textContent,/exatamente a mesma imagem/);assert.equal(generated,false);assert.equal(validated,false);
});
