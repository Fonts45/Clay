import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../assets/scripts/space-search.js';

const {matches,lookup}=globalThis.ClaySpaceSearch;
test('palavras-chave encontram destinos do site e respeitam acentos',()=>{
 assert.equal(matches('portfólio')[0].tab,'portfolio');assert.equal(matches('estudos')[0].tab,'studies');
 assert.equal(matches('documentos')[0].href,'index.html?inicio=1#recursos');assert.equal(matches('@usuario').length,0);
});
test('busca usuário por nome exato e só retorna um perfil publicado',async()=>{
 const reads=[];
 const db={collection:collection=>({doc:id=>({get:async()=>{reads.push([collection,id]);return collection==='usernames'?{exists:true,data:()=>({uid:'owner'})}:{exists:true,data:()=>({profile:{name:'Nome público'}})}}})})};
 const profile=await lookup('@Usuario',db);assert.equal(profile.handle,'usuario');assert.equal(profile.label,'Nome público');
 assert.deepEqual(reads,[['usernames','usuario'],['publicPortfolios','owner']]);
});
test('perfil inexistente ou privado não vira resultado público',async()=>{
 for(const exists of [false,true]){
  const db={collection:name=>({doc:()=>({get:async()=>({exists:name==='usernames'?exists:false,data:()=>({uid:'owner'})})})})};
  assert.equal(await lookup('usuario',db),null);
 }
 assert.equal(await lookup('@a',{}),null);assert.equal(await lookup('usuario',null),null);
});

function searchUI(){
 const events={},classes=new Set(),nodes={};
 const node=()=>({value:'',children:[],attrs:{},style:{setProperty(key,value){this[key]=value}},listeners:{},setAttribute(key,value){this.attrs[key]=value},removeAttribute(key){delete this.attrs[key]},addEventListener(type,handler){this.listeners[type]=handler},append(child){this.children.push(child)},replaceChildren(){this.children=[]},contains(target){return this===target},focus(){this.focused=true},getBoundingClientRect:()=>({top:800,left:400,width:50})});
 const box=node(),input=node(),form=node(),results=node(),list=node(),status=node(),close=node(),button=node(),owner=node(),dock=node();
 dock.classList={add:item=>classes.add(item),remove:item=>classes.delete(item)};
 box.querySelector=selector=>({'input':input,'form':form,'.space-search-results':results,'button':close}[selector]);results.querySelector=selector=>selector==='nav'?list:status;
 list.querySelector=()=>list.children[0];
 const document={activeElement:input,createElement:tag=>tag==='div'?box:node(),addEventListener:(type,handler)=>events[type]=handler};
 const window={innerWidth:1000,innerHeight:900,addEventListener(){}};
 const context=vm.createContext({document,window,setTimeout:()=>1,clearTimeout(){}});
 vm.runInContext(readFileSync(new URL('../assets/scripts/space-search.js',import.meta.url),'utf8'),context);
 context.ClaySpaceSearch.attach(button,{dock,owner});
 return {box,input,button,close,events,results};
}
test('abre acima da lupa com espaço de 28px e recolhe ao clicar novamente',()=>{
 const page=searchUI();page.button.onclick();assert.equal(page.box.hidden,false);assert.equal(page.input.focused,true);
 assert.equal(page.box.style.bottom,'128px');assert.equal(page.box.style.width,'560px');assert.equal(page.box.style.left,'220px');assert.equal(page.button.attrs['aria-expanded'],'true');
 page.button.onclick();assert.equal(page.box.hidden,true);assert.equal(page.button.focused,true);
});
test('Escape fecha a busca e clique fora também dispensa a cápsula',()=>{
 const page=searchUI();page.button.onclick();page.box.listeners.keydown({key:'Escape',preventDefault(){},stopPropagation(){}});assert.equal(page.box.hidden,true);
 page.button.onclick();page.events.pointerdown({target:{}});assert.equal(page.box.hidden,true);assert.equal(page.button.attrs['aria-expanded'],'false');
});
