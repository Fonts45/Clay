import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replaceAll('\r\n','\n');
test('registra os dois links de retorno sem interromper a inicialização',()=>{
 const handlers=[],links=[{},{}];let closed=0;
 links.forEach(link=>link.addEventListener=(type,handler)=>handlers.push(handler));
 const binding=html.split('\n').find(line=>line.includes("('.chat-brand,.chat-header-logo').forEach"));
 vm.runInNewContext(binding,{$$:()=>links,$:()=>links[0],close:()=>closed++});
 assert.equal(handlers.length,2);
 handlers[0]({button:0,preventDefault(){}});assert.equal(closed,1);
 handlers[1]({button:0,ctrlKey:true,preventDefault(){throw Error('Não interceptar nova aba')}});assert.equal(closed,1);
});
function landing(user){
 let click,opened=0,login=0;
 const location={href:'https://clay.test/index.html?inicio=1'};
 const button={classList:{contains:name=>name==='clay-star-button'},textContent:'Conheça o Clay AI',addEventListener:(type,handler)=>click=handler};
 const context={$$:()=>[button],usuarioConta:user,alternarMenu(){},open(){opened++},mostrarConta(){login++},location,URL,history:{replaceState(state,title,path){location.href='https://clay.test'+path}}};
 const start=html.indexOf("$$('[data-open]').forEach");
 const end=html.indexOf("\naddEventListener('keydown'",start);
 vm.runInNewContext(html.slice(start,end),context);
 return {click:()=>click({preventDefault(){}}),location,opened:()=>opened,login:()=>login};
}
test('Conheça o Clay AI abre a IA para quem está conectado',()=>{
 const page=landing({uid:'owner'});page.click();assert.equal(page.opened(),1);assert.equal(page.login(),0);
 assert.equal(new URL(page.location.href).searchParams.get('destino'),'ia');
});
test('Conheça o Clay AI mantém o destino ao solicitar login',()=>{
 const page=landing(null);page.click();assert.equal(page.opened(),0);assert.equal(page.login(),1);
 assert.equal(new URL(page.location.href).searchParams.get('destino'),'ia');
});
test('login concluído abre o Clay AI sem redirecionar para Meu Espaço',async()=>{
 const nodes=new Map();let opened=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'teste',close(){}});return nodes.get(id)};
 const context={$:node,modoConta:'entrar',clienteConta:{setPersistence:async()=>{},signInWithEmailAndPassword:async()=>({user:{uid:'owner'}})},firebase:{auth:{Auth:{Persistence:{LOCAL:'local'}}}},autenticandoConta:false,atualizarUsuario(){},open(){opened++},location:{search:'?destino=ia'},URLSearchParams,erroConta:error=>{throw error}};
 const start=html.indexOf("$('#conta-form').onsubmit=async e=>{");const end=html.indexOf("$('#sair').onclick",start);
 vm.runInNewContext(html.slice(start,end),context);
 await node('#conta-form').onsubmit({preventDefault(){}});
 assert.equal(opened,1);assert.equal(context.location.href,undefined);
});
