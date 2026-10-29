import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/scripts/onboarding-split-text.js',import.meta.url),'utf8');
function setup(reduced=false){
 const animations=[],frames=new Map();let id=0;
 function node(text=''){
  return {_text:text,children:[],attributes:{},classList:{add(){}},set textContent(value){this._text=value},get textContent(){return this.children.length?this.children.map(child=>child.textContent).join(''):this._text},setAttribute(key,value){this.attributes[key]=value},append(child){this.children.push(child)},replaceChildren(...children){this.children=children},animate(keyframes,options){const animation={keyframes,options,cancel(){this.cancelled=true},finished:Promise.resolve()};animations.push(animation);return animation}};
 }
 const title=node('Olá, você!'),subtitle=node('Seu espaço em construção.');
 const root={isConnected:true,animate(){},querySelectorAll:()=>[title,subtitle]};
 const context=vm.createContext({Intl,matchMedia:()=>({matches:reduced}),requestAnimationFrame:fn=>{frames.set(++id,fn);return id},cancelAnimationFrame:key=>frames.delete(key),document:{createElement:()=>node(),createTextNode:text=>node(text)}});
 vm.runInContext(source,context);
 return {root,title,subtitle,animations,frames,api:context.ClayOnboardingText,flush(){for(const [key,fn] of frames){frames.delete(key);fn()}}};
}
test('respeita movimento reduzido e mantém texto simples sem animação',()=>{
 const ui=setup(true);ui.api.reveal(ui.root);assert.equal(ui.frames.size,0);assert.equal(ui.title.textContent,'Olá, você!');
});
test('separa letras com acentos, preserva texto acessível e revela em sequência',()=>{
 const ui=setup();ui.api.reveal(ui.root);ui.flush();
 assert.equal(ui.title.children[0].textContent,'Olá, você!');assert.equal(ui.title.children[1].attributes['aria-hidden'],'true');
 assert.equal(ui.title.children[1].textContent,'Olá, você!');assert.equal(ui.subtitle.children[1].textContent,'Seu espaço em construção.');
 assert.equal(ui.animations[0].options.duration,1250);assert.equal(ui.animations[1].options.delay,50);
 assert.equal(ui.api.graphemes('e\u0301').length,1);
});
test('trocar de etapa cancela animações antigas em vez de sobrepor efeitos',()=>{
 const ui=setup();ui.api.reveal(ui.root);ui.flush();const previous=[...ui.animations];
 ui.api.reveal(ui.root);assert.ok(previous.every(animation=>animation.cancelled));assert.equal(ui.frames.size,1);
});
test('fade troca conteúdo somente depois da saída e interpola a altura da entrada',async()=>{
 const ui=setup(),effects=[];let height=160,swaps=0;
 const root={isConnected:true,getBoundingClientRect:()=>({height}),animate(frames,options){let resolve;const effect={frames,options,finished:new Promise(done=>resolve=done),finish:()=>resolve(),cancel(){this.cancelled=true}};effects.push(effect);return effect}};
 const task=ui.api.transition(root,()=>{swaps++;height=240});
 assert.equal(swaps,0);assert.equal(effects[0].options.duration,120);
 effects[0].finish();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(swaps,1);assert.equal(effects[1].frames[0].height,'160px');assert.equal(effects[1].frames[1].height,'240px');
 effects[1].finish();assert.equal(await task,true);assert.ok(effects.every(effect=>effect.cancelled));
});
test('fade impede transições sobrepostas e não troca a etapa se a janela fechar',async()=>{
 const ui=setup();let finish,swaps=0,open=true;
 const root={isConnected:true,getBoundingClientRect:()=>({height:100}),animate(){return {finished:new Promise(resolve=>finish=resolve),cancel(){}}}};
 const first=ui.api.transition(root,()=>swaps++,()=>open);
 assert.equal(await ui.api.transition(root,()=>swaps++),false);
 open=false;finish();assert.equal(await first,false);assert.equal(swaps,0);
});
test('movimento reduzido troca a etapa imediatamente, sem fade',async()=>{
 const ui=setup(true);let swaps=0;
 assert.equal(await ui.api.transition(ui.root,()=>swaps++),true);assert.equal(swaps,1);assert.equal(ui.animations.length,0);
});
