import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/scripts/navigation.js',import.meta.url),'utf8');
function navigation({reduced=false,native=false,resuming=false}={}){
 const listeners={},hints=[],transitions=[];
 const document={documentElement:{classList:{contains:()=>resuming}},addEventListener:(type,handler)=>listeners[type]=handler,head:{appendChild:hint=>hints.push(hint)},createElement:()=>({})};
 if(native)document.startViewTransition=update=>{
  const transition={skipped:false,skipTransition(){this.skipped=true},ready:Promise.resolve(),updateCallbackDone:Promise.resolve().then(update)};
  transition.finished=transition.updateCallbackDone;transitions.push(transition);return transition;
 };
 const context=vm.createContext({document,window:{},navigator:{},matchMedia:()=>({matches:reduced}),location:{origin:'https://clay.test',pathname:'/index.html',href:'https://clay.test/index.html'},URL});
 vm.runInContext(source,context);return {run:context.window.clayTransition,listeners,hints,transitions,document};
}
test('navegação é imediata sem suporte ou com movimento reduzido',async()=>{
 for(const options of [{},{native:true,reduced:true},{native:true,resuming:true}]){
  const page=navigation(options);let updated=false;const done=page.run(()=>updated=true);
  assert.equal(updated,true);await done;assert.equal(page.transitions.length,0);
 }
});
test('cliques rápidos não acumulam animações nem repetem atualizações',async()=>{
 const page=navigation({native:true}),states=[];
 const first=page.run(()=>states.push('AI')),second=page.run(()=>states.push('Início'));
 await Promise.all([first,second]);assert.deepEqual(states,['AI','Início']);assert.equal(page.transitions[0].skipped,true);
});
test('falha da captura não impede a troca de tela',async()=>{
 const page=navigation({native:true});page.document.startViewTransition=()=>{throw Error('Captura indisponível')};let count=0;
 await page.run(()=>count++);assert.equal(count,1);
});
test('pré-carrega só páginas locais e reutiliza a mesma antecipação',()=>{
 const page=navigation();
 const hover=href=>page.listeners.pointerover({target:{closest:()=>({href,hasAttribute:()=>false})}});
 hover('https://clay.test/perfil.html');hover('https://clay.test/perfil.html');hover('https://external.test/perfil.html');hover('https://clay.test/index.html');
 assert.equal(page.hints.length,1);assert.equal(page.hints[0].href,'https://clay.test/perfil.html');assert.equal(page.hints[0].rel,'prefetch');
});
