(()=>{
 'use strict';
 document.querySelectorAll('.clay-header-actions,.chat-header-actions').forEach((actions,instance)=>{
 const header=actions.closest('nav')||actions.closest('.bar');
 header.classList.add('has-account-menu');
 const account=document.createElement('div');account.className='clay-account';
 const silhouette='<svg class="clay-account-icon" viewBox="0 0 840 996" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="420" cy="259" r="259"/><path d="M150 996C35 996-36 877 15 778C99 625 248 536 420 536S741 625 825 778C876 877 805 996 690 996Z"/></svg>';
 account.innerHTML=`<button class="clay-account-toggle" type="button" aria-label="Abrir menu da conta" aria-expanded="false" aria-controls="clay-account-menu">${silhouette}</button><div class="clay-account-menu" id="clay-account-menu" aria-label="Menu da conta" hidden><a href="perfil.html">Perfil</a><a href="espaco.html?aba=studies#resume-card">Recentes</a><button type="button" data-account-action="support">Suporte</button><button type="button" data-account-action="settings">Configurações</button><button type="button" data-account-action="signout" disabled>Sair</button></div>`;
 const menuId='clay-account-menu-'+instance;account.querySelector('.clay-account-menu').id=menuId;account.querySelector('.clay-account-toggle').setAttribute('aria-controls',menuId);
 actions.prepend(account);
 const toggle=account.querySelector('.clay-account-toggle'),menu=account.querySelector('.clay-account-menu'),items=[...menu.querySelectorAll('a,button')],signout=menu.querySelector('[data-account-action="signout"]');
 let auth=null,user=null;
 function close(focus=false){menu.hidden=true;header.classList.remove('account-menu-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu da conta');if(focus)toggle.focus()}
 toggle.onclick=()=>{const opening=menu.hidden;menu.hidden=!opening;header.classList.toggle('account-menu-open',opening);toggle.setAttribute('aria-expanded',String(opening));toggle.setAttribute('aria-label',opening?'Fechar menu da conta':'Abrir menu da conta')};
 document.addEventListener('pointerdown',event=>{if(!account.contains(event.target))close()});
 account.addEventListener('focusout',event=>{if(!account.contains(event.relatedTarget))close()});
 account.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.stopPropagation();close(true)}
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();menu.hidden=false;header.classList.add('account-menu-open');toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fechar menu da conta');
   const available=items.filter(item=>!item.disabled),index=available.indexOf(document.activeElement);
   available[event.key==='Home'?0:event.key==='End'?available.length-1:(index+(event.key==='ArrowUp'?-1:1)+available.length)%available.length].focus();
  }
 });
 const dialog=document.createElement('dialog');dialog.className='clay-account-dialog';dialog.setAttribute('aria-labelledby','clay-account-title-'+instance);document.body.appendChild(dialog);
 function show(title,content){close();dialog.innerHTML='<button class="clay-account-close" type="button" aria-label="Fechar">×</button><h2 id="clay-account-title"></h2>'+content;dialog.querySelector('h2').id='clay-account-title-'+instance;dialog.querySelector('h2').textContent=title;dialog.querySelector('.clay-account-close').onclick=()=>dialog.close();dialog.showModal()}
 dialog.addEventListener('close',()=>toggle.focus());
 menu.addEventListener('click',async event=>{
  const action=event.target.closest('[data-account-action]')?.dataset.accountAction;
  if(!action){if(event.target.closest('a'))close();return}
  if(action==='account'){
   if(!user){close();if(typeof mostrarConta==='function')mostrarConta('entrar');else location.href='index.html?destino=espaco';return}
   show('Sua conta','<p data-account-name></p><p data-account-email></p><a href="perfil.html">Abrir meu perfil</a>');
   dialog.querySelector('[data-account-name]').textContent=user.displayName||'Conta Clay';dialog.querySelector('[data-account-email]').textContent=user.email||'';
  }
  if(action==='support')show('Suporte','<p>Para acessar seus estudos e projetos, entre em sua conta e abra Meu espaço.</p><p>Esqueceu sua senha? Na tela de entrada, escolha “Esqueci minha senha” para receber as instruções por e-mail.</p><a href="espaco.html">Abrir Meu espaço</a>');
  if(action==='settings'){
   show('Configurações','<label for="clay-account-theme">Aparência<select id="clay-account-theme"><option value="dark">Escuro</option><option value="light">Claro</option></select></label>');
   const select=dialog.querySelector('select');select.id='clay-account-theme-'+instance;dialog.querySelector('label').htmlFor=select.id;select.value=document.documentElement.dataset.theme||'dark';select.onchange=()=>{document.dispatchEvent(new CustomEvent('clay:theme-change',{detail:select.value}))};
  }
  if(action==='signout'&&auth){signout.disabled=true;try{await auth.signOut();location.href='index.html?inicio=1'}catch{show('Não foi possível sair','<p>Verifique sua conexão e tente novamente.</p>')}finally{signout.disabled=!user}}
 });
 const photoTask='header-photo-'+instance;globalThis.clayLoading?.begin(photoTask);
 const photoReady=()=>globalThis.clayLoading?.end(photoTask);
 let unsubscribeProfile=null,currentPhoto='',photoRequest=0,customPhoto='';
 function cachedPhoto(uid){try{return localStorage.getItem('clay-profile-photo:'+uid)||''}catch{return ''}}
 function applyProfilePhoto(profile,confirmed=false){
  if(!user)return;
  if(profile?.photo){customPhoto=profile.photo;try{localStorage.setItem('clay-profile-photo:'+user.uid,customPhoto)}catch{}}
  const photo=customPhoto||cachedPhoto(user.uid)||(confirmed?user.photoURL:'')||'';showProfilePhoto(photo);if(confirmed&&!photo)photoReady();
 }
 function showProfilePhoto(photo){
  if(currentPhoto===photo&&toggle.childElementCount){if(photo)photoReady();return;}
  const request=++photoRequest;
  if(!photo){currentPhoto='';toggle.innerHTML=silhouette;return}
  const image=new Image();image.alt='';image.referrerPolicy='no-referrer';
  image.onload=async()=>{try{await image.decode()}catch{}if(request!==photoRequest)return;currentPhoto=photo;toggle.replaceChildren(image);photoReady()};
  image.onerror=()=>{if(request!==photoRequest)return;if(!toggle.querySelector('img'))toggle.innerHTML=silhouette;photoReady()};image.src=photo;
 }
 document.addEventListener('clay:profile-updated',event=>{
  if(user&&event.detail?.uid===user.uid)applyProfilePhoto(event.detail.profile,true);
 });
 function connect(){
  if(!window.firebase?.apps?.length){photoReady();return;}
  auth=firebase.auth();auth.onAuthStateChanged(value=>{
   if(unsubscribeProfile){unsubscribeProfile();unsubscribeProfile=null}
   user=value;customPhoto=user?cachedPhoto(user.uid):'';signout.disabled=!user;showProfilePhoto(customPhoto);if(!user)photoReady();
   if(user&&firebase.firestore){
    const owner=user.uid;
    unsubscribeProfile=firebase.firestore().collection('learningSpaces').doc(owner).onSnapshot({includeMetadataChanges:true},snapshot=>{
     if(user?.uid!==owner)return;
     const profile=snapshot.exists?snapshot.data().profile:null;
     applyProfilePhoto(profile,!snapshot.metadata.fromCache);
    },()=>{photoReady();});
   }
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});else connect();
 });
})();
