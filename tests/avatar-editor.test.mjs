import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../assets/scripts/avatar-editor.js';

test('avatar rejeita tipo e tamanho inválidos antes de decodificar',async()=>{
 await assert.rejects(ClayAvatarEditor.prepare({type:'application/pdf',size:20}),/imagem JPG/);
 await assert.rejects(ClayAvatarEditor.prepare({type:'image/png',size:9*1024*1024}),/8 MB/);
});
test('usa o laranja principal como fundo e restringe o avatar aprovado ao seu usuário',()=>{
 assert.equal(ClayAvatarEditor.BACKGROUND_COLOR,'#ff5402');
 assert.equal(ClayAvatarEditor.preset('@RodrigoFontes'),'assets/images/avatars/rodrigofontes-foreground.svg');
 assert.equal(ClayAvatarEditor.preset('outra.pessoa'),'');assert.equal(ClayAvatarEditor.preset(''),'');
});
test('prepara avatar com dimensões limitadas e compressão dentro do limite',async()=>{
 let closed=false,qualityCalls=0;const canvas={getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=>++qualityCalls===1?'a'.repeat(310000):'data:image/jpeg;base64,abc'};
 const context=vm.createContext({document:{createElement:()=>canvas},createImageBitmap:async()=>({width:1600,height:2400,close(){closed=true}})});
 vm.runInContext(readFileSync(new URL('../assets/scripts/avatar-editor.js',import.meta.url),'utf8'),context);
 const output=await context.ClayAvatarEditor.prepare({type:'image/png',size:100});
 assert.equal(canvas.width,480);assert.equal(canvas.height,720);assert.equal(qualityCalls,2);assert.equal(closed,true);assert.ok(output.length<=300000);
});
test('cartão usa avatar separado e nunca substitui o avatar pela foto do rosto',()=>{
 const source=readFileSync(new URL('../assets/scripts/espaco.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function atualizarCarta(){'),source.indexOf('async function fotoPerfil(){'));
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{replaceChildren(){},append(){},appendChild(){},removeAttribute(name){delete this[name]}});return nodes.get(id)};
 const profile={name:'Nome',username:'nome',photo:'foto-real',avatar:'avatar-3d'};
 const context=vm.createContext({state:{profile},user:{photoURL:'foto-google'},uid:null,normalizeUsername:v=>v,document:{querySelector:node,getElementById:node,createElement:()=>({}),createTextNode:v=>v}});
 vm.runInContext(body+'atualizarCarta()',context);assert.equal(node('card-face').src,'avatar-3d');assert.equal(profile.photo,'foto-real');
 profile.avatar='';vm.runInContext('atualizarCarta()',context);assert.equal(node('card-face').hidden,true);assert.equal(node('card-face').src,undefined);
});
