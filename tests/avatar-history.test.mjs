import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({crypto:webcrypto,TextEncoder});
vm.runInContext(readFileSync(new URL('../assets/scripts/avatar-history.js',import.meta.url),'utf8'),context);
const {fingerprint,createStore,STYLE}=context.ClayAvatarHistory;
const image='data:image/png;base64,YWJj';
function database(){
 const entries=new Map();
 function ref(path){return {path,doc:id=>ref(path+'/'+id),collection:id=>ref(path+'/'+id),get:async()=>({id:path.split('/').at(-1),exists:entries.has(path),data:()=>entries.get(path)})}}
 return {entries,collection:ref,runTransaction:async action=>action({get:r=>r.get(),set:(r,value)=>entries.set(r.path,value)})};
}
test('mesmos bytes têm o mesmo identificador mesmo com outro nome de arquivo',async()=>{
 const photo=(name,content)=>({name,arrayBuffer:async()=>new TextEncoder().encode(content).buffer});
 const first=await fingerprint(photo('foto.png','same pixels'));
 assert.equal(first,await fingerprint(photo('copia.png','same pixels')));
 assert.notEqual(first,await fingerprint(photo('foto.png','different pixels')));assert.match(first,/^[a-f0-9]{64}$/);
});
test('não sobrescreve a imagem canônica de uma foto e isola contas',async()=>{
 const db=database(),a=createStore({db,uid:'a'}),b=createStore({db,uid:'b'}),hash='a'.repeat(64);
 await a.saveGenerated(hash,image);
 const duplicate=await a.saveGenerated(hash,'data:image/png;base64,ZGVm');
 assert.equal(duplicate.image,image);assert.equal((await a.find(hash)).image,image);assert.equal(await b.find(hash),null);
 assert.equal(db.entries.size,1);
});
test('novo avatar não apaga o antigo e importar o atual é idempotente',async()=>{
 const db=database(),store=createStore({db,uid:'a'});
 await store.saveGenerated('a'.repeat(64),image);await store.saveGenerated('b'.repeat(64),'data:image/png;base64,ZGVm');
 await store.rememberCurrent(STYLE.reference);await store.rememberCurrent(STYLE.reference);
 assert.equal(db.entries.size,3);assert.equal((await store.find('a'.repeat(64))).image,image);
 assert.equal(Object.isFrozen(STYLE),true);assert.match(STYLE.prompt,/full head/);
});
test('não armazena foto de origem ou URL arbitrária como avatar',async()=>{
 const db=database(),store=createStore({db,uid:'a'});
 await assert.rejects(store.saveGenerated('a'.repeat(64),'https://untrusted.example/image.png'),/imagem inválida/);
 await store.saveGenerated('a'.repeat(64),image);
 assert.deepEqual(Object.keys([...db.entries.values()][0]).sort(),['createdAt','image','sourceHash','styleVersion']);
});
