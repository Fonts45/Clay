import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../assets/scripts/resource-shredder.js',import.meta.url),'utf8');
function setup(){
 const handlers={},saved=[],deleted=[],status={};
 const list={children:[],scrollTop:0,getBoundingClientRect(){return {top:0,bottom:440}},addEventListener(name,handler){handlers[name]=handler},appendChild(row){this.children=this.children.filter(item=>item!==row);this.children.push(row)}};
 const classes=()=>({add(){},remove(){}});
 const rows=Array.from({length:4},()=>({style:{},classList:classes(),getBoundingClientRect(){return {top:list.children.indexOf(this)*78,height:68}}}));
 list.children=[...rows];
 const bars=rows.map(row=>({closest:()=>row,classList:classes(),style:{},setPointerCapture(){},hasPointerCapture(){return false}}));
 const context={document:{getElementById:id=>id==='resource-demo'?{querySelector:()=>list}:status},Date,Math};
 const prefix=source.slice(0,source.indexOf(' const dialog='));
 runInNewContext(prefix+`
 db={};entries=[{id:'site',order:0,kind:'link',url:'https://example.com'},null,{id:'book',order:2,kind:'file',file:'document'},null];
 transaction=async(mode,run)=>run({put:entry=>saved.push(entry),delete:id=>{if(globalThis.failDelete)throw Error('Storage unavailable');deleted.push(id)}},()=>{});
 function render(){}
 globalThis.readEntries=()=>entries;
 globalThis.removeShortcut=removeShortcut;
})();`,Object.assign(context,{saved,deleted}));
 const event=(index,y,type='pointermove')=>({target:{closest:()=>bars[index]},button:0,isPrimary:true,pointerId:1,clientX:20,clientY:y,type,preventDefault(){},stopImmediatePropagation(){}});
 return {handlers,list,rows,event,saved,deleted,status,context};
}

test('drag reorders filled and empty slots and persists document data atomically',async()=>{
 const {handlers,list,rows,event,saved,context}=setup();
 handlers.pointerdown(event(0,34,'pointerdown'));
 handlers.pointermove(event(0,278));
 assert.equal(rows[1].style.transform,'translateY(-78px)');
 assert.deepEqual(list.children,rows);
 await handlers.pointerup(event(0,278,'pointerup'));
 assert.deepEqual(Array.from(context.readEntries(),entry=>entry?.id??null),[null,'book',null,'site']);
 assert.deepEqual(saved.map(entry=>[entry.id,entry.order]),[['book',1],['site',3]]);
 assert.equal(saved[0].file,'document');
 let blocked=false;
 handlers.click({preventDefault(){blocked=true},stopImmediatePropagation(){}});
 assert.equal(blocked,true);
});

test('small pointer movement keeps normal clicks and does not save an order',async()=>{
 const {handlers,event,saved}=setup();
 handlers.pointerdown(event(0,34,'pointerdown'));
 handlers.pointermove(event(0,37));
 await handlers.pointerup(event(0,37,'pointerup'));
 assert.equal(saved.length,0);
 let blocked=false;
 handlers.click({preventDefault(){blocked=true},stopImmediatePropagation(){}});
 assert.equal(blocked,false);
});

test('cancelled drag leaves saved order unchanged',async()=>{
 const {handlers,event,saved,context}=setup();
 handlers.pointerdown(event(2,190,'pointerdown'));
 handlers.pointermove(event(2,10));
 await handlers.pointercancel(event(2,10,'pointercancel'));
 assert.equal(saved.length,0);
 assert.equal(context.readEntries()[2].id,'book');
});

test('deletion removes only the selected saved shortcut and frees its slot',async()=>{
 const {context,deleted,status}=setup();
 await context.removeShortcut(2);
 assert.deepEqual(deleted,['book']);
 assert.equal(context.readEntries()[2],null);
 assert.equal(context.readEntries()[0].id,'site');
 assert.match(status.textContent,/Atalho apagado/);
 await context.removeShortcut(2);
 assert.equal(deleted.length,1);
});

test('failed deletion keeps the shortcut and allows retry',async()=>{
 const {context,deleted,status}=setup();
 context.failDelete=true;
 await context.removeShortcut(0);
 assert.equal(context.readEntries()[0].id,'site');
 assert.match(status.textContent,/Não foi possível apagar/);
 context.failDelete=false;
 await context.removeShortcut(0);
 assert.equal(context.readEntries()[0],null);
 assert.deepEqual(deleted,['site']);
});
