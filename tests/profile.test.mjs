import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/scripts/espaco.js',import.meta.url),'utf8').replaceAll('\r\n','\n');
const body=source.match(/bindForm\('#profile-form',async data=>\{([\s\S]*?)\}\);/)[1];
function editor({fail=false}={}){
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)};
 const saved=[];
 const context=vm.createContext({state:{profile:{name:'Anterior',headline:'Anterior',photo:'foto-existente',bio:'',resume:'',github:'',linkedin:''}},user:{email:'conta@gmail.com'},checkUrls(){},clone:value=>JSON.parse(JSON.stringify(value)),fotoPerfil:async()=> 'foto-existente',persist:async value=>{if(fail)throw Error('Sem conexão');saved.push(value)},updateProfilePhoto(){},$:node});
 return {save:vm.runInContext('(async data=>{'+body+'})',context),saved,node};
}
const data={name:'Nome atualizado',headline:'Desenvolvedor',username:'nome.usuario',education:'Engenharia de Software',currentStudies:'JavaScript',careers:'Desenvolvimento web',bio:'Sobre mim',resume:'',github:'',linkedin:''};
test('salva formação, estudos e carreira com o perfil e preserva a foto',async()=>{
 const form=editor();await form.save({...data});
 assert.equal(form.saved[0].profile.username,data.username);
 for(const key of ['education','currentStudies','careers','name','headline'])assert.equal(form.saved[0].profile[key],data[key]);
 assert.equal(form.saved[0].profile.photo,'foto-existente');
 assert.equal('email' in form.saved[0].profile,false);
 assert.match(form.node('#profile-save-feedback').textContent,/Perfil salvo/);
});
test('nome de usuário inválido não é enviado ao banco',async()=>{
 const form=editor();await assert.rejects(form.save({...data,username:'nome com espaço'}),/nome de usuário/);assert.equal(form.saved.length,0);
});
test('falha no banco não confirma o salvamento nem limpa a foto selecionada',async()=>{
 const form=editor({fail:true});form.node('#profile-photo').value='foto-nova';
 await assert.rejects(form.save({...data}),/Sem conexão/);
 assert.equal(form.node('#profile-photo').value,'foto-nova');assert.equal(form.node('#profile-save-feedback').textContent,undefined);
});
test('menu Perfil aponta para uma página própria com interface de perfil',()=>{
 const menu=readFileSync(new URL('../assets/scripts/account-menu.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../perfil.html',import.meta.url),'utf8');
 assert.match(menu,/<a href="perfil\.html">Perfil<\/a>/);
 assert.match(page,/class="profile-page"/);
 assert.match(page,/<title>Meu perfil · Clay<\/title>/);
});
test('perfil abre durante o carregamento e mantém Salvar desabilitado',()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{focus(){},scrollIntoView(){}});return nodes.get(id)};
 const classes=new Set();const save={};const panel={hidden:true,scrollIntoView(){}};
 const body=source.slice(source.indexOf('function openProfile(){'),source.indexOf("$('#profile-back').onclick"));
 const context=vm.createContext({user:{displayName:'Nome da conta',email:'nome@icloud.com'},state:null,profileDirty:false,profileForm:{querySelectorAll:()=>[]},profileSave:save,profileEditor:panel,dedicatedProfile:true,fill(){},updateProfilePhoto(){},$:node,document:{body:{classList:{add:value=>classes.add(value)}}},URL,location:{href:'https://clay.test/perfil.html'},history:{replaceState(){}},esc:value=>value});
 vm.runInContext(body+'openProfile()',context);
 assert.equal(panel.hidden,false);assert.equal(save.disabled,true);
 assert.equal(node('#studies').hidden,true);assert.equal(node('#portfolio').hidden,true);
 assert.equal(node('#profile-account-email').value,'nome@icloud.com');assert.equal(classes.has('profile-editing'),true);
});


test('sincronização preserva o texto que está sendo editado',()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{focus(){},scrollIntoView(){}});return nodes.get(id)};
 let fills=0;
 const body=source.slice(source.indexOf('function openProfile(){'),source.indexOf("$('#profile-back').onclick"));
 const context=vm.createContext({user:{email:'atual@gmail.com'},state:{profile:{name:'Nome salvo'},courses:[]},profileDirty:true,profileForm:{querySelectorAll:()=>[]},profileSave:{},profileEditor:{scrollIntoView(){}},dedicatedProfile:true,fill(){fills++},updateProfilePhoto(){throw Error('Não deve apagar a prévia')},$:node,document:{body:{classList:{add(){}}}},URL,location:{href:'https://clay.test/perfil.html'},history:{replaceState(){}},esc:v=>v});
 node('#profile-account-email').value='novo@gmail.com';
 vm.runInContext(body+'openProfile()',context);
 assert.equal(fills,0);assert.equal(node('#profile-account-email').value,'novo@gmail.com');
});

test('permite digitar durante o carregamento e mescla dados sem apagar o rascunho',()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{focus(){},scrollIntoView(){}});return nodes.get(id)};
 const name={name:'name',value:'Nome da conta',disabled:true,dataset:{}};
 const bio={name:'bio',value:'',disabled:true,dataset:{}};
 const email=node('#profile-account-email');Object.assign(email,{value:'conta@gmail.com',disabled:true,dataset:{}});
 const save={};
 const context=vm.createContext({user:{email:'conta@gmail.com'},state:null,profileDirty:false,profileForm:{querySelectorAll:()=>[name,bio,email]},profileSave:save,profileEditor:{scrollIntoView(){}},dedicatedProfile:true,fill(){},updateProfilePhoto(){},$:node,document:{body:{classList:{add(){}}}},URL,location:{href:'https://clay.test/perfil.html'},history:{replaceState(){}},esc:v=>v});
 const body=source.slice(source.indexOf('function openProfile(){'),source.indexOf("$('#profile-back').onclick"));
 vm.runInContext(body+'openProfile()',context);
 assert.equal(name.disabled,false);assert.equal(email.disabled,false);assert.equal(save.disabled,true);
 name.value='Nome digitado';name.dataset.profileEdited='true';email.value='novo@gmail.com';email.dataset.profileEdited='true';
 context.profileDirty=true;context.state={profile:{name:'Nome salvo no banco',bio:'Biografia salva'},courses:[]};
 vm.runInContext('openProfile()',context);
 assert.equal(name.value,'Nome digitado');assert.equal(email.value,'novo@gmail.com');assert.equal(bio.value,'Biografia salva');assert.equal(save.disabled,false);
});

test('permite salvar os campos visíveis sem exigir título profissional recolhido',async()=>{
 const form=editor();await form.save({...data,headline:'',pronouns:'ele/dele',website:'https://example.com',social3:'',social4:'',company:'Clay'});
 assert.equal(form.saved[0].profile.company,'Clay');assert.equal(form.saved[0].profile.headline,'');
});

test('troca de e-mail solicita verificação do novo endereço',async()=>{
 const body=source.slice(source.indexOf("emailField.querySelector('button').addEventListener('click',async()=>{")+"emailField.querySelector('button').addEventListener('click',async()=>{".length,source.indexOf("\n});\nmoveField('bio'"));
 const input={value:'novo@gmail.com',reportValidity:()=>true},feedback={},button={};let sent;
 const context=vm.createContext({user:{email:'anterior@gmail.com',verifyBeforeUpdateEmail:async email=>{sent=email}},$:id=>id==='#profile-account-email'?input:feedback,emailField:{querySelector:()=>button}});
 await vm.runInContext('(async()=>{'+body+'})()',context);
 assert.equal(sent,'novo@gmail.com');assert.match(feedback.textContent,/Confirmação enviada/);assert.equal(button.disabled,false);
});
