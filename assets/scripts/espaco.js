/* Account-owned learning records and a separate, explicitly published profile. */
(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
const link=(url,label,cls='button')=>safeUrl(url)?`<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'';
const statuses={planned:'Planejado',active:'Em andamento',done:'Concluído'};
const route=new URLSearchParams(location.search);
const dedicatedProfile=location.pathname.endsWith('/perfil.html');
if(dedicatedProfile)route.set('aba','perfil');
const uid=route.get('perfil');
let organizerRouteHandled=false;
let db,auth,user=null,state=null,unlisten=null,saving=false,courseId=null,projectId=null,step=0,setup={},loadTimer=null;
const writeControls=['#add-course','#edit-profile','#add-project','#publish-profile','#copy-profile','#unpublish-profile','#profile-save'];
// The dedicated editor uses the same account-owned profile as the card.
const profileEditor=document.createElement('section');profileEditor.id='profile-editor';profileEditor.className='profile-editor';profileEditor.hidden=true;profileEditor.setAttribute('aria-labelledby','profile-editor-title');
profileEditor.innerHTML='<button type="button" class="button" id="profile-back">Voltar ao Meu espaço</button><div class="profile-intro"><h1 id="profile-editor-title" tabindex="-1">Perfil público</h1></div>';
$('#owner-space').appendChild(profileEditor);
const profileForm=$('#profile-form');profileEditor.appendChild(profileForm);$('#profile-dialog').remove();
profileForm.querySelector('.dialog-heading').remove();
profileForm.insertAdjacentHTML('afterbegin','<fieldset><legend>Identidade</legend><div class="profile-photo-row"><div class="profile-photo-preview" id="profile-photo-preview" aria-label="Prévia da foto"></div><div id="profile-photo-control"></div></div><div class="form-row"><label>Nome de usuário<input name="username" maxlength="40" pattern="[A-Za-z0-9_.-]{3,40}" placeholder="Ex.: rodrigo.fontes"><small>De 3 a 40 letras, números, pontos, hífens ou sublinhados.</small></label><label>E-mail da conta<input id="profile-account-email" type="email" autocomplete="email" maxlength="254"><small>Para trocar o e-mail de acesso, digite o novo endereço e confirme abaixo.</small></label></div></fieldset>');
$('#profile-photo-control').appendChild($('#profile-photo').closest('label'));
profileForm.querySelector('[name="bio"]').closest('label').insertAdjacentHTML('beforebegin','<fieldset><legend>Formação e caminhos</legend><label>Formações<textarea name="education" rows="3" maxlength="2000" placeholder="Curso, instituição e situação. Ex.: Engenharia de Software · em andamento"></textarea></label><label>O que você está estudando agora<textarea name="currentStudies" rows="3" maxlength="2000" placeholder="Ex.: JavaScript, inglês e fundamentos de design"></textarea></label><div><p class="muted">Cursos em andamento na sua trilha</p><div class="profile-course-list" id="profile-current-courses"></div></div><label>Carreiras de interesse<textarea name="careers" rows="3" maxlength="1000" placeholder="Ex.: Desenvolvimento de software, design de produto, análise de dados"></textarea><small>Inclua os caminhos relacionados à sua formação e aos seus estudos atuais.</small></label></fieldset>');
// Keep the existing account fields and upload control while arranging the public editor.
const profileFields=document.createElement('div');profileFields.className='profile-fields';
const profilePhoto=document.createElement('aside');profilePhoto.className='profile-photo-column';profilePhoto.innerHTML='<h2>Foto de perfil</h2>';
profilePhoto.appendChild(profileForm.querySelector('.profile-photo-row'));
const moveField=(name,title,help)=>{const field=profileForm.elements.namedItem(name).closest('label');field.firstChild.textContent=title;profileFields.appendChild(field);if(help)field.insertAdjacentHTML('beforeend','<small>'+help+'</small>');return field};
moveField('name','Nome');
const emailField=$('#profile-account-email').closest('label');emailField.firstChild.textContent='E-mail da conta';profileFields.appendChild(emailField);
emailField.insertAdjacentHTML('beforeend','<button type="button" class="profile-email-change">Confirmar novo e-mail</button><small id="profile-email-feedback" role="status" aria-live="polite"></small>');
emailField.querySelector('button').addEventListener('click',async()=>{
 const input=$('#profile-account-email'),feedback=$('#profile-email-feedback'),button=emailField.querySelector('button');
 if(!user||!input.reportValidity())return;
 const email=input.value.trim();
 if(!email){feedback.textContent='Digite o novo endereço de e-mail.';return}
 if(email===user.email){feedback.textContent='Esse já é o e-mail da sua conta.';return}
 button.disabled=true;feedback.textContent='Enviando confirmação…';
 try{await user.verifyBeforeUpdateEmail(email);feedback.textContent='Confirmação enviada para '+email+'. Abra o link recebido para concluir a troca do e-mail de acesso.'}
 catch(error){feedback.textContent=error.code==='auth/requires-recent-login'?'Entre novamente na sua conta e tente trocar o e-mail outra vez.':error.code==='auth/email-already-in-use'?'Este endereço já está sendo usado por outra conta.':error.code==='auth/invalid-email'?'Digite um endereço de e-mail válido.':'Não foi possível enviar a confirmação. Verifique a conexão e tente novamente.'}
 finally{button.disabled=false}
});
moveField('bio','Biografia');
profileForm.elements.namedItem('bio').placeholder='Conte sobre você.';
profileFields.insertAdjacentHTML('beforeend','<label>Pronomes<select name="pronouns"><option value="">Não especificar</option><option value="ele/dele">ele/dele</option><option value="ela/dela">ela/dela</option><option value="elu/delu">elu/delu</option><option value="outros">outros</option></select></label><label>URL<input name="website" type="url" maxlength="2000"></label><fieldset class="profile-socials"><legend>Contas de redes sociais</legend></fieldset>');
const socialFields=profileFields.querySelector('.profile-socials');
['linkedin','github'].forEach((name,index)=>{const field=profileForm.elements.namedItem(name).closest('label');field.className='profile-social-field';field.firstChild.textContent='';field.insertAdjacentHTML('afterbegin','<span aria-hidden="true">'+(index===0?'in':'↗')+'</span>');field.querySelector('input').setAttribute('aria-label',index===0?'LinkedIn':'GitHub');field.querySelector('input').placeholder='Link para o perfil social '+(index+1);socialFields.appendChild(field)});
[3,4].forEach(index=>socialFields.insertAdjacentHTML('beforeend','<label class="profile-social-field"><span aria-hidden="true">↗</span><input name="social'+index+'" type="url" maxlength="2000" aria-label="Perfil social '+index+'" placeholder="Link para o perfil social '+index+'"></label>'));
profileFields.insertAdjacentHTML('beforeend','<label>Empresa<input name="company" maxlength="160"><small>Informe a empresa ou organização da qual você faz parte.</small></label>');
const additional=document.createElement('details');additional.className='profile-additional';additional.innerHTML='<summary>Formação e informações profissionais</summary>';
for(const field of [...profileForm.children]){if(field.matches('fieldset,.form-row,label'))additional.appendChild(field)}
profileForm.prepend(profilePhoto,profileFields);profileForm.querySelector('.form-error').before(additional);
// O editor público mostra apenas os campos escolhidos; mantém os dados anteriores.
emailField.hidden=true;
profileFields.querySelector('[name="pronouns"]').closest('label').hidden=true;
additional.hidden=true;
$('#profile-photo-control').hidden=true;
const photoPreviewButton=document.createElement('button');photoPreviewButton.type='button';photoPreviewButton.id='profile-photo-preview';photoPreviewButton.className='profile-photo-preview';photoPreviewButton.setAttribute('aria-label','Trocar foto de perfil');photoPreviewButton.title='Selecionar uma foto do computador';
$('#profile-photo-preview').replaceWith(photoPreviewButton);
photoPreviewButton.addEventListener('click',()=>$('#profile-photo').click());
const profileSave=profileForm.querySelector('button.primary');profileSave.type='submit';profileSave.id='profile-save';
const profileSaveRow=document.createElement('div');profileSaveRow.className='profile-save-row';profileSave.before(profileSaveRow);profileSaveRow.appendChild(profileSave);profileSaveRow.insertAdjacentHTML('beforeend','<p id="profile-save-feedback" role="status" aria-live="polite">Seu card profissional acompanha as informações salvas aqui.</p>');
let profilePhotoPreviewUrl=null,profileDirty=false,croppedProfilePhoto=null,profileCropSource=null;
function markProfileEdited(event){profileDirty=true;if(event.target.matches('input,textarea,select'))event.target.dataset.profileEdited='true'}
profileForm.addEventListener('input',markProfileEdited);
profileForm.addEventListener('change',markProfileEdited);
profileForm.addEventListener('invalid',event=>{const details=event.target.closest('details');if(details)details.open=true},true);
profileForm.elements.namedItem('headline').required=false;
function updateProfilePhoto(photo){const preview=$('#profile-photo-preview');preview.replaceChildren();if(photo&&photo!==user?.photoURL){const image=document.createElement('img');image.src=photo;image.alt='Sua foto de perfil';image.onerror=()=>{preview.innerHTML=profilePhotoPlaceholder};preview.appendChild(image)}else preview.innerHTML=profilePhotoPlaceholder}
const profilePhotoPlaceholder='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.56" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
async function enquadrarFoto(source){
 try{const cropped=await window.ClayPhotoCrop.open(source);if(!cropped)return;profileCropSource=source;croppedProfilePhoto=cropped;profileDirty=true;updateProfilePhoto(cropped)}
 catch(error){$('#profile-save-feedback').textContent=error.message||'Não foi possível abrir a imagem.'}
}
$('#profile-photo').addEventListener('change',async()=>{const file=$('#profile-photo').files[0];if(file)await enquadrarFoto(file);$('#profile-photo').value=''});
const recropButton=document.createElement('button');recropButton.type='button';recropButton.className='button profile-recrop';recropButton.textContent='Ajustar enquadramento';
profilePhoto.appendChild(recropButton);
recropButton.onclick=()=>{const source=profileCropSource||croppedProfilePhoto||state?.profile?.photo||user?.photoURL;if(source)enquadrarFoto(source);else $('#profile-photo').click()};
function openProfile(){
 if(!user)return;
 const profile=state?.profile||{name:user.displayName||'',headline:''};
 if(!profileDirty){fill(profileForm,profile);$('#profile-account-email').value=user.email||'';updateProfilePhoto(profile.photo||user.photoURL)}
 // Editing does not depend on the network. Merge arriving data only into untouched fields.
 profileForm.querySelectorAll('input,textarea,select').forEach(input=>{
  input.disabled=false;
  if(!profileDirty)delete input.dataset.profileEdited;
  if(profileDirty&&!input.dataset.profileEdited&&input.name&&input.type!=='file'&&Object.hasOwn(profile,input.name))input.value=profile[input.name]??'';
 });
 $('#profile-save-feedback').textContent=state?'Seu card profissional acompanha as informações salvas aqui.':'Carregando seu perfil salvo…';
 profileSave.disabled=!state;
 const active=(state?.courses||[]).filter(course=>course.status==='active');$('#profile-current-courses').innerHTML=active.length?active.map(course=>'<span>'+esc(course.title)+' · '+esc(course.topic)+'</span>').join(''):'<p>Os cursos em andamento aparecem aqui quando adicionados à sua trilha.</p>';
 $('#studies').hidden=true;$('#portfolio').hidden=true;profileEditor.hidden=false;document.body.classList.add('profile-editing');
 const url=new URL(location.href);if(!dedicatedProfile)url.searchParams.set('aba','perfil');url.searchParams.delete('course');url.searchParams.delete('project');url.hash='';history.replaceState(null,'',url);
 $('#profile-editor-title').focus({preventScroll:true});profileEditor.scrollIntoView({block:'start'});
}
$('#profile-back').onclick=()=>{if(dedicatedProfile)location.href='espaco.html';else setTab(0)};
function finishLoading(){clearTimeout(window.clayLoadingWatchdog);clearTimeout(loadTimer);$('#retry-load').hidden=true}
function accessError(message){$('#access-message').textContent=message;$('#access-state').hidden=false}

function atualizarCarta(){
 const profile=state?.profile||{};
 const rail=document.querySelector('.professional-rail');rail.hidden=!user||!!uid;
 document.getElementById('card-name').textContent=profile.name||user?.displayName||'Seu nome';
 document.getElementById('card-role').textContent=profile.headline||'Seu título profissional';
 document.getElementById('card-id').textContent=user?.uid?user.uid.slice(0,12).match(/.{1,4}/g).join(' '):'—';
 document.getElementById('card-verification').textContent=user?.emailVerified?'◇ Verificado':'◇ Perfil';
 const photo=profile.photo||user?.photoURL||'',face=document.getElementById('card-face');
 face.hidden=!photo;if(photo)face.src=photo;else face.removeAttribute('src');
}
async function fotoPerfil(){
 if(croppedProfilePhoto)return croppedProfilePhoto;
 const file=document.getElementById('profile-photo').files[0];if(!file)return state?.profile?.photo||'';
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Escolha uma imagem JPG, PNG ou WebP de até 8 MB.');
 const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const ratio=Math.min(1,480/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const photo=canvas.toDataURL('image/jpeg',.72);if(photo.length>180000)throw Error('Escolha uma foto menor para salvar no perfil.');return photo;
}
$('#card-edit').onclick=()=>{if(state)$('#edit-profile').click()};

function loadingShell(){
 document.dispatchEvent(new CustomEvent('clay:studies-update',{detail:{courses:[],published:false,loading:true}}));
 atualizarCarta();
 $('#access-state').hidden=true;$('#owner-space').hidden=false;$('#owner-space').setAttribute('aria-busy','true');
 writeControls.forEach(id=>$(id).disabled=true);$('#account-name').textContent=user.displayName||user.email||'';
 if(route.get('aba')==='perfil')openProfile();
 ['active','done','lessons','platforms'].forEach(k=>$('#stat-'+k).textContent='—');
 $('#resume-card').hidden=true;$('#course-list').innerHTML='<div class="loading-placeholder"><span></span><span></span><span></span><p>Sincronizando sua trilha…</p></div>';
 $('#portfolio-preview').innerHTML='<div class="loading-placeholder"><span></span><span></span><p>Carregando seu perfil…</p></div>';$('#project-editor-list').replaceChildren();
 $('#publication-label').textContent='Verificando seu perfil';$('#publication-help').textContent='Aguarde a sincronização da sua conta.';notice('Buscando os dados da sua conta…');
 loadTimer=setTimeout(async()=>{
 if(state)return;
 const owner=user?.uid;
 let message='Não foi possível conectar ao banco. Seus dados não foram alterados.';
 try{
  const project=window.CLAY_CONFIG.firebase.projectId;
  const response=await fetch('https://firestore.googleapis.com/v1/projects/'+encodeURIComponent(project)+'/databases/(default)/documents/learningSpaces/diagnostic-nonexistent',{signal:AbortSignal.timeout(4000)});
  const data=await response.json();
  if(data.error?.details?.some(detail=>detail.reason==='SERVICE_DISABLED'))message='O Firestore deste projeto está desativado no Google Cloud. Ative o serviço e configure o banco no Firebase para carregar e salvar seu perfil e seus estudos.';
 }catch{}
 if(state||!owner||user?.uid!==owner)return;
 notice(message,true);$('#owner-space').setAttribute('aria-busy','false');$('#retry-load').hidden=false;
 $('#course-list').replaceChildren();$('#portfolio-preview').replaceChildren();
 },8000);
}
$('#workspace-signout').onclick=async()=>{const b=$('#workspace-signout');b.disabled=true;try{await auth.signOut();location.replace('index.html')}catch{notice('Não foi possível sair. Verifique sua conexão e tente novamente.',true)}finally{b.disabled=false}};
const blank=()=>({profile:{name:user?.displayName||'',headline:'Estudante de Engenharia de Software',bio:'',resume:'',github:'',linkedin:''},courses:[],projects:[],published:false,initialized:false});
const clone=v=>JSON.parse(JSON.stringify(v));
function notice(message,error=false){$('#save-state').textContent=message;$('#save-state').classList.toggle('error',error)}
function failure(e){if(e?.code==='permission-denied')return 'O banco não autorizou o acesso. É necessário ativar o Firestore e aplicar as regras de acesso do Clay.';if(e?.code==='unavailable')return 'Sem conexão com o banco. Tente novamente; as alterações ainda não foram salvas.';return 'Não foi possível salvar ou carregar. Verifique a conexão e a configuração do Firebase.'}
function publicData(data){return {profile:clone(data.profile),projects:clone(data.projects),learning:data.courses.filter(c=>c.share).map(c=>({title:c.title,topic:c.topic,status:c.status})),updatedAt:Date.now()}}
async function persist(next){
 if(!user||saving)throw Error('Aguarde o salvamento anterior e tente novamente.');
 const owner=user.uid;saving=true;notice('Salvando na sua conta…');
 try{
  const batch=db.batch();batch.set(db.collection('learningSpaces').doc(owner),{...next,updatedAt:Date.now()});
  const publicRef=db.collection('publicPortfolios').doc(owner);
  if(next.published)batch.set(publicRef,publicData(next));else if(state?.published)batch.delete(publicRef);
  await batch.commit();
  if(user?.uid!==owner)return;
  state=next;render();notice('Salvo na sua conta · sincronizado entre dispositivos');
 }catch(e){notice(failure(e),true);throw e}finally{saving=false}
}
function renderProfile(data){
 const p=data.profile||{},projects=data.projects||[],learning=data.learning||[];
 const initials=(p.name||'Seu nome').trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
 const summary=status=>learning.filter(c=>c.status===status);
 const skills=entries=>entries.map(c=>`<span class="skill">${esc(c.title)} <span>· ${esc(c.topic)}</span></span>`).join('');
 return `<article class="profile-cover"><div class="avatar" aria-hidden="true">${esc(initials)}</div><p class="eyebrow">ENGENHARIA · APRENDIZADO · CONSTRUÇÃO</p><h1>${esc(p.name||'Seu nome aqui')}</h1><h3>${esc(p.headline||'Seu título profissional')}</h3>${p.bio?`<p class="bio">${esc(p.bio)}</p>`:''}<div class="profile-links">${link(p.resume,'Currículo')}${link(p.github,'GitHub')}${link(p.linkedin,'LinkedIn')}</div></article>
 <section class="public-section"><h2>Aprendizado em movimento</h2><p>Um resumo do que estou explorando e do conhecimento que já construí.</p>${summary('active').length?`<h3>Estudando agora</h3><div class="skill-list">${skills(summary('active'))}</div>`:''}${summary('done').length?`<h3 style="margin-top:24px">Já estudei</h3><div class="skill-list">${skills(summary('done'))}</div>`:''}${!summary('active').length&&!summary('done').length?'<p>Nenhum estudo incluído no resumo ainda.</p>':''}</section>
 <section class="public-section"><h2>Projetos & experiências</h2><div class="project-grid">${projects.map(p=>`<article class="project-card"><p class="eyebrow">${p.status==='done'?'CONCLUÍDO':'EM DESENVOLVIMENTO'}</p><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><p class="tech">${esc(p.tech)}</p>${link(p.url,'Explorar projeto','project-link')}</article>`).join('')}</div>${!projects.length?'<p>Os próximos projetos aparecerão aqui.</p>':''}</section>`;
}
function render(){
 if(!state)return;
 atualizarCarta();
 document.dispatchEvent(new CustomEvent('clay:profile-updated',{detail:{uid:user?.uid,profile:state.profile}}));
 const courses=state.courses;
 document.dispatchEvent(new CustomEvent('clay:studies-update',{detail:{courses,published:state.published}}));
 $('#account-name').textContent=state.profile.name||user?.email||'';
 $('#stat-active').textContent=courses.filter(c=>c.status==='active').length;
 $('#stat-done').textContent=courses.filter(c=>c.status==='done').length;
 $('#stat-lessons').textContent=courses.reduce((n,c)=>n+c.completed,0);
 $('#stat-platforms').textContent=new Set(courses.map(c=>c.platform.trim().toLowerCase())).size;
 const current=courses.filter(c=>c.status==='active').sort((a,b)=>b.updatedAt-a.updatedAt)[0];
 $('#resume-card').hidden=!current;
 if(current)$('#resume-card').innerHTML=`<div><p class="eyebrow">RETOME DE ONDE PAROU</p><h2>${esc(current.title)}</h2><p class="muted">${esc(current.platform)} · ${esc(current.lesson||'Registre a aula atual')}</p></div>${safeUrl(current.url)?link(current.url,'Continuar aula','button primary'):`<button class="button primary" data-edit-course="${esc(current.id)}">Registrar link da aula</button>`}`;
 const filtered=courses.filter(c=>$('#course-filter').value==='all'||c.status===$('#course-filter').value);
 $('#course-list').innerHTML=filtered.map(c=>{
  const index=courses.indexOf(c),percent=c.total?Math.round(c.completed/c.total*100):0;
  return `<article class="course-card" id="course-${esc(c.id)}" tabindex="-1"><div class="course-number">${String(index+1).padStart(2,'0')}</div><div><div class="course-meta"><span class="badge ${esc(c.status)}">${statuses[c.status]||'Planejado'}</span><span>${esc(c.platform)}</span><span>·</span><span>${esc(c.topic)}</span></div><h3>${esc(c.title)}</h3><p class="lesson">${esc(c.lesson||'Aula atual ainda não registrada')}</p><div class="progress-line">${c.total?`<progress value="${c.completed}" max="${c.total}" aria-label="Progresso de ${esc(c.title)}"></progress>`:''}<span>${c.completed}${c.total?' / '+c.total:''} aulas${c.total?' · '+percent+'%':''}</span></div>${c.notes?`<details class="course-notes"><summary>Anotações pessoais</summary><p>${esc(c.notes)}</p></details>`:''}<div class="actions"><button class="text-button" data-move="${esc(c.id)}" data-direction="-1" ${index===0?'disabled':''} aria-label="Mover ${esc(c.title)} para cima">↑ Subir</button><button class="text-button" data-move="${esc(c.id)}" data-direction="1" ${index===courses.length-1?'disabled':''} aria-label="Mover ${esc(c.title)} para baixo">↓ Descer</button><button class="text-button danger" data-delete-course="${esc(c.id)}">Excluir</button></div></div><div class="course-actions">${link(c.url,'Continuar aula','button primary')}<button class="button" data-edit-course="${esc(c.id)}">Atualizar aula</button></div></article>`;
 }).join('')||`<div class="empty"><h3>${courses.length?'Nenhum curso nesse filtro.':'Sua trilha começa aqui.'}</h3><p>${courses.length?'Escolha outro filtro para ver seus cursos.':'Adicione um curso, registre a aula atual e retome sem procurar de novo.'}</p>${!courses.length?'<button class="button" data-new-course>＋ Primeiro curso</button>':''}</div>`;
 $('#portfolio-preview').innerHTML=renderProfile(publicData(state));
 $('#project-editor-list').innerHTML=state.projects.map(p=>`<div class="project-edit-row" id="project-${esc(p.id)}" tabindex="-1"><span>${esc(p.title)}</span><div class="actions"><button class="text-button" data-edit-project="${esc(p.id)}">Editar</button><button class="text-button danger" data-delete-project="${esc(p.id)}">Excluir</button></div></div>`).join('')||'<p class="muted">Adicione projetos reais para compor seu portfólio.</p>';
 $('#publication-label').textContent=state.published?'Seu perfil está público':'Perfil ainda privado';
 $('#publication-help').textContent=state.published?'As alterações salvas atualizam o perfil público automaticamente.':'Publique quando estiver pronto. Apenas este resumo ficará público.';
 $('#publish-profile').hidden=state.published;$('#copy-profile').hidden=!state.published;$('#unpublish-profile').hidden=!state.published;
 if(!organizerRouteHandled&&!uid){
  organizerRouteHandled=true;
  if(route.get('aba')==='perfil'){openProfile()}
  else if(route.has('aba')||route.has('course')||route.has('project')){
   const project=route.has('project')||route.get('aba')==='portfolio';setTab(project?1:0,false);
   const id=route.get(project?'project':'course');
   const destination=id?document.getElementById((project?'project-':'course-')+id):document.getElementById(project?'project-editor-list':'studies');
   if(destination)requestAnimationFrame(()=>{destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});destination.focus({preventScroll:true});destination.classList.add('organizer-target')});
   else notice('Esse item não está mais no Meu espaço. Selecione outro estudo ou projeto.',true);
  }
 }

}
function setTab(index,animate=true){
 const leavingProfile=!profileEditor.hidden;profileEditor.hidden=true;document.body.classList.remove('profile-editing');
 if(leavingProfile){const url=new URL(location.href);url.searchParams.set('aba',index===1?'portfolio':'studies');history.replaceState(null,'',url)}
 const portfolio=index===1;$('.gooey-nav').classList.toggle('portfolio-active',portfolio);
 ['studies','portfolio'].forEach((name,i)=>{const b=$('#tab-'+name);b.classList.toggle('active',i===index);b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;$('#'+name).hidden=i!==index});

}
$('.gooey-nav').setAttribute('role','tablist');
$('#tab-studies').onclick=()=>setTab(0);$('#tab-portfolio').onclick=()=>setTab(1);
$('.gooey-nav').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'||e.key==='ArrowLeft'?0:1;setTab(n);$('#tab-'+(n?'portfolio':'studies')).focus()}};setTab(0,false);
$('#course-filter').onchange=render;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
function fill(form,data){form.reset();form.querySelector('.form-error').textContent='';Object.entries(data).forEach(([key,v])=>{const input=form.elements.namedItem(key);if(!input)return;if(input.type==='checkbox')input.checked=!!v;else input.value=v??''})}
function editCourse(id=null){courseId=id;fill($('#course-form'),state.courses.find(c=>c.id===id)||{title:'',platform:'',topic:state.initialTopic||'',status:'planned',lesson:'',url:'',notes:'',completed:0,total:'',share:true});$('#course-dialog-title').textContent=id?'Atualizar curso':'Adicionar curso';$('#course-dialog').showModal()}
function editProject(id=null){projectId=id;fill($('#project-form'),state.projects.find(p=>p.id===id)||{title:'',description:'',tech:'',status:'building',url:''});$('#project-dialog').showModal()}
$('#add-course').onclick=()=>editCourse();$('#add-project').onclick=()=>editProject();
$('#edit-profile').onclick=openProfile;
function values(form){return Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,typeof v==='string'?v.trim():v]))}
function checkUrls(data,keys){for(const k of keys)if(data[k]&&!safeUrl(data[k]))throw Error('Use links completos começando com https:// ou http://.')}
function bindForm(id,handler){const form=$(id);form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button[type="submit"],button.primary');button.disabled=true;form.querySelector('.form-error').textContent='';try{await handler(values(form));form.closest('dialog')?.close()}catch(e){form.querySelector('.form-error').textContent=e.code?failure(e):e.message}finally{button.disabled=false}}}
bindForm('#course-form',async data=>{
 checkUrls(data,['url']);data.completed=Number(data.completed);data.total=data.total?Number(data.total):null;
 if(!data.title||!data.platform||!data.topic)throw Error('Preencha o nome, a plataforma e o tema do curso.');
 if(!Number.isInteger(data.completed)||data.completed<0||data.completed>10000||data.total!==null&&(!Number.isInteger(data.total)||data.total<1||data.total>10000||data.completed>data.total))throw Error('Confira as quantidades: as aulas concluídas não podem superar o total.');
 if(data.status==='done'&&data.total)data.completed=data.total;
 data.share=$('#course-form').elements.namedItem('share').checked;
 const next=clone(state),entry={...data,id:courseId||crypto.randomUUID(),updatedAt:Date.now()},index=next.courses.findIndex(c=>c.id===courseId);
 if(index<0){if(next.courses.length>=100)throw Error('O limite desta trilha é de 100 cursos.');next.courses.push(entry)}else next.courses[index]=entry;
 await persist(next);
});
bindForm('#profile-form',async data=>{checkUrls(data,['resume','github','linkedin','website','social3','social4']);if(!data.name)throw Error('Preencha seu nome.');if(data.username&&!/^[A-Za-z0-9_.-]{3,40}$/.test(data.username))throw Error('Confira o nome de usuário: use de 3 a 40 letras, números, pontos, hífens ou sublinhados.');const next=clone(state);next.profile={...state.profile,...data,photo:await fotoPerfil()};await persist(next);profileDirty=false;$('#profile-photo').value='';updateProfilePhoto(next.profile.photo||user?.photoURL);$('#profile-save-feedback').textContent='Perfil salvo. Seu card profissional foi atualizado.'});
bindForm('#project-form',async data=>{checkUrls(data,['url']);const next=clone(state),entry={...data,id:projectId||crypto.randomUUID()},index=next.projects.findIndex(p=>p.id===projectId);if(index<0){if(next.projects.length>=40)throw Error('O limite é de 40 projetos.');next.projects.push(entry)}else next.projects[index]=entry;await persist(next)});
$('#owner-space').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||saving||!state)return;
 if(b.hasAttribute('data-edit-course'))return editCourse(b.dataset.editCourse);
 if(b.hasAttribute('data-new-course'))return editCourse();
 if(b.hasAttribute('data-edit-project'))return editProject(b.dataset.editProject);
 try{
  if(b.hasAttribute('data-move')){const next=clone(state),i=next.courses.findIndex(c=>c.id===b.dataset.move),j=i+Number(b.dataset.direction);if(i<0||j<0||j>=next.courses.length)return;[next.courses[i],next.courses[j]]=[next.courses[j],next.courses[i]];await persist(next)}
  if(b.hasAttribute('data-delete-course')&&confirm('Excluir este curso e suas anotações?')){const next=clone(state);next.courses=next.courses.filter(c=>c.id!==b.dataset.deleteCourse);await persist(next)}
  if(b.hasAttribute('data-delete-project')&&confirm('Excluir este projeto do portfólio?')){const next=clone(state);next.projects=next.projects.filter(p=>p.id!==b.dataset.deleteProject);await persist(next)}
 }catch(e){notice(failure(e),true)}
});
$('#publish-profile').onclick=async()=>{if(!state.profile.name.trim()){notice('Preencha seu nome em Editar perfil antes de publicar.',true);return}const next=clone(state);next.published=true;try{await persist(next)}catch{}};
$('#unpublish-profile').onclick=async()=>{const next=clone(state);next.published=false;try{await persist(next)}catch{}};
$('#copy-profile').onclick=async()=>{const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('perfil',user.uid);try{await navigator.clipboard.writeText(url.href);notice('Link público copiado. Só o portfólio será mostrado.')}catch{notice('Link do perfil: '+url.href)}};
function onboarding(direction=0){
 $('#onboarding-back').hidden=step===0;$('#onboarding-next').textContent=step===3?'Concluir':'Continuar →';
 document.querySelectorAll('.onboarding-steps button').forEach((e,i)=>{e.classList.toggle('active',i===step);e.classList.toggle('visited',i<step);if(i===step)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current')});
 const contents=[`<h2>Bem-vindo(a) a bordo</h2><p>Um espaço para lembrar onde parou e mostrar o que está construindo. Configure em poucos passos.</p>`,
 `<h2>Qual é a sua direção?</h2><p>Escolha um tema para começar a organizar sua trilha. Você pode adicionar outros depois.</p><label>Tema inicial<input name="setup-topic" maxlength="80" required placeholder="Ex.: Desenvolvimento web" value="${esc(setup.topic??'Engenharia de Software')}"></label>`,
 `<h2>Como você quer se apresentar?</h2><label>Seu nome<input name="setup-name" required maxlength="100" value="${esc(setup.name??state.profile.name)}"></label><label>Título profissional<input name="setup-headline" required maxlength="160" value="${esc(setup.headline??state.profile.headline)}"></label>`,
 `<h2>Pronto para começar.</h2><div class="review-item">Trilha inicial: ${esc(setup.topic)}</div><div class="review-item">${esc(setup.name)}<br>${esc(setup.headline)}</div><p>Seus estudos ficam privados na sua conta. O portfólio só será público quando você clicar em Publicar perfil.</p>`];
 const content=$('#onboarding-content');content.innerHTML=contents[step];
 const title=content.querySelector('h2');title.id='onboarding-title';title.tabIndex=-1;
 if(direction&&!matchMedia('(prefers-reduced-motion:reduce)').matches){content.getAnimations().forEach(a=>a.cancel());content.animate([{opacity:0,transform:`translateX(${direction>0?28:-28}px)`},{opacity:1,transform:'translateX(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'})}
 if(direction&&$('#onboarding').open)title.focus({preventScroll:true});
}
function captureSetup(){const f=$('#onboarding-form');if(step===1)setup.topic=f.elements.namedItem('setup-topic').value.trim();if(step===2){setup.name=f.elements.namedItem('setup-name').value.trim();setup.headline=f.elements.namedItem('setup-headline').value.trim()}}
function goToStep(target){if(saving||target===step||target<0||target>3)return;captureSetup();const direction=target-step;step=target;$('#onboarding .form-error').textContent='';onboarding(direction);$('#onboarding').dispatchEvent(new CustomEvent('clay:step-change',{bubbles:true,detail:{step:step+1}}))}
document.querySelectorAll('.onboarding-steps button').forEach(b=>b.onclick=()=>goToStep(Number(b.dataset.step)));
$('#onboarding-back').onclick=()=>goToStep(step-1);
$('#onboarding').addEventListener('cancel',e=>e.preventDefault());
$('#onboarding-form').onsubmit=async e=>{
 e.preventDefault();captureSetup();if(step<3){goToStep(step+1);return}
 const missing=!setup.topic?.trim()?1:!setup.name?.trim()||!setup.headline?.trim()?2:null;
 if(missing!==null){goToStep(missing);$('#onboarding .form-error').textContent='Preencha os campos desta etapa antes de concluir.';$('#onboarding-form').reportValidity();return}
 const b=$('#onboarding-next');b.disabled=true;
 try{const next=clone(state);next.profile.name=setup.name;next.profile.headline=setup.headline;next.initialTopic=setup.topic;next.initialized=true;await persist(next);$('#onboarding').close();$('#onboarding').dispatchEvent(new CustomEvent('clay:setup-completed',{bubbles:true,detail:{step:4}}))}
 catch(e){$('#onboarding .form-error').textContent=failure(e)}finally{b.disabled=false}
};
async function loadPublic(){
 $('#access-message').textContent='Carregando portfólio…';
 if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid)){finishLoading();accessError('Link de perfil inválido.');return }
 try{const doc=await db.collection('publicPortfolios').doc(uid).get();finishLoading();if(!doc.exists){accessError('Este perfil não foi publicado ou foi retirado do público.');return}$('#public-profile').innerHTML=renderProfile(doc.data());$('#access-state').hidden=true;$('#public-space').hidden=false;document.title=(doc.data().profile.name||'Portfólio')+' · Clay'}catch(e){finishLoading();accessError(failure(e));$('#retry-load').hidden=false}
}
try{
 if(!window.firebase?.firestore||!window.CLAY_CONFIG?.firebase?.projectId)throw Error('Firebase indisponível');
 firebase.initializeApp(window.CLAY_CONFIG.firebase);db=firebase.firestore();db.settings({experimentalAutoDetectLongPolling:true});auth=firebase.auth();
 if(uid){loadPublic();return}
 auth.onAuthStateChanged(async account=>{
  finishLoading();
  if(unlisten){unlisten();unlisten=null}user=account;state=null;saving=false;profileDirty=false;document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('#owner-space').hidden=true;$('.professional-rail').hidden=true;$('#access-state').hidden=true;$('#workspace-signout').hidden=!account;
  if(!account){location.replace('index.html?destino=espaco'+(route.get('aba')==='perfil'?'&aba=perfil':''));return}
  $('#login-link').hidden=true;loadingShell();
  const owner=account.uid;
  unlisten=db.collection('learningSpaces').doc(owner).onSnapshot({includeMetadataChanges:true},doc=>{
   if(user?.uid!==owner)return;
   if(doc.metadata.hasPendingWrites)return;
   if(!doc.exists&&doc.metadata.fromCache)return;
   finishLoading();state=doc.exists?{...blank(),...doc.data()}:blank();$('#access-state').hidden=true;$('#owner-space').hidden=false;$('#owner-space').setAttribute('aria-busy','false');writeControls.forEach(id=>$(id).disabled=false);render();notice(doc.metadata.fromCache?'Dados em memória · verificando atualizações…':'Dados da sua conta carregados');
   if(route.get('aba')!=='perfil'&&!state.initialized&&!$('#onboarding').open){step=0;setup={topic:state.initialTopic||'Engenharia de Software',name:state.profile.name,headline:state.profile.headline};onboarding();$('#onboarding').showModal()}
  },e=>{if(user?.uid!==owner)return;finishLoading();$('#owner-space').setAttribute('aria-busy','false');if(!state){$('#owner-space').hidden=false;$('#access-state').hidden=false;$('#course-list').replaceChildren();$('#portfolio-preview').replaceChildren()}$('#access-message').textContent=failure(e);notice(failure(e),true);$('#retry-load').hidden=false});
 });
}catch{finishLoading();accessError('Não foi possível conectar. Confira a conexão e tente novamente.');$('#login-link').hidden=!!uid;$('#retry-load').hidden=false}
})();
