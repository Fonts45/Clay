(()=>{
 'use strict';
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const destinations=[
  {label:'Início do site',words:'inicio home pagina inicial',href:'index.html?inicio=1'},
  {label:'Meus estudos',words:'estudos cursos aulas trilha aprendizagem',href:'espaco.html?aba=studies',tab:'studies',section:'course-list'},
  {label:'Meu portfólio',words:'portfolio trabalhos publicacao publicar',href:'espaco.html?aba=portfolio',tab:'portfolio',section:'portfolio'},
  {label:'Meus projetos',words:'projetos repositorios trabalho',href:'espaco.html?aba=portfolio',tab:'portfolio',section:'project-editor-list'},
  {label:'Meu perfil',words:'perfil foto nome biografia conta',href:'perfil.html'},
  {label:'Clay AI',words:'clay ai ia inteligencia artificial assistente',href:'index.html?destino=ia'},
  {label:'Recursos do site',words:'recursos atalhos links biblioteca documentos pdf',href:'index.html?inicio=1#recursos'}
 ];
 function matches(query){const text=normalize(query);if(!text||text.startsWith('@'))return [];return destinations.filter(item=>normalize(item.label+' '+item.words).includes(text)).slice(0,5)}
 async function lookup(value,db){
  const handle=normalize(value).replace(/^@/,'');if(!/^[a-z0-9_.-]{3,40}$/.test(handle)||!db)return null;
  const record=await db.collection('usernames').doc(handle).get();if(!record.exists)return null;
  const profile=await db.collection('publicPortfolios').doc(record.data().uid).get();if(!profile.exists)return null;
  return {label:profile.data().profile?.name||'@'+handle,handle,href:'espaco.html?usuario='+encodeURIComponent(handle)};
 }
 function attach(button,{dock,owner}){
  const box=document.createElement('div');box.className='space-search';box.id='space-search';box.hidden=true;
  box.innerHTML='<div class="space-search-results" hidden><nav aria-label="Resultados da busca"></nav><p role="status" aria-live="polite"></p></div><form class="space-search-capsule" role="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="Pesquisar no site ou por nome de usuário" placeholder="Ex.: meus estudos, projetos ou @usuario" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100"></form>';
  owner.append(box);const input=box.querySelector('input'),form=box.querySelector('form'),results=box.querySelector('.space-search-results'),list=results.querySelector('nav'),status=results.querySelector('p');
  let timer,version=0;
  button.removeAttribute('aria-haspopup');button.setAttribute('aria-controls',box.id);button.setAttribute('aria-expanded','false');
  function position(){
   const rect=button.getBoundingClientRect(),top=Math.min(rect.top,dock.getBoundingClientRect().top),width=Math.min(560,window.innerWidth-24);
   box.style.width=width+'px';box.style.left=((window.innerWidth-width)/2)+'px';
   box.style.bottom=(window.innerHeight-top+28)+'px';box.style.setProperty('--space-search-results-height',Math.max(60,top-120)+'px');
  }
  function close(focus=false){box.hidden=true;button.setAttribute('aria-expanded','false');dock.classList.remove('search-open');clearTimeout(timer);version++;if(focus)button.focus()}
  function addResult(item){
   const link=document.createElement('a');link.href=item.href;link.textContent=item.label+(item.handle?' · @'+item.handle:'');
   if(item.tab)link.addEventListener('click',event=>{
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const tab=document.getElementById('tab-'+item.tab);if(!tab)return;event.preventDefault();tab.click();close();
    document.getElementById(item.section)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
   });
   list.append(link);
  }
  function search(){
   clearTimeout(timer);const request=++version,value=input.value.trim();list.replaceChildren();status.textContent='';results.hidden=!value;if(!value)return;
   const local=matches(value);local.forEach(addResult);
   const handle=normalize(value).replace(/^@/,'');
   if(!/^[a-z0-9_.-]{3,40}$/.test(handle)){if(!local.length)status.textContent=value.startsWith('@')?'Digite pelo menos 3 caracteres do nome de usuário.':'Tente “estudos”, “projetos” ou um @usuario.';return}
   status.textContent='Buscando perfil @'+handle+'…';
   timer=setTimeout(async()=>{
    try{
     const db=window.firebase?.apps?.length?window.firebase.firestore():null;
     if(!db){if(request===version)status.textContent='A busca de perfis está indisponível. Tente novamente em instantes.';return}
     const profile=await lookup(handle,db);if(request!==version||box.hidden)return;
     if(profile){addResult(profile);status.textContent=''}else status.textContent=local.length?'':'Nenhum perfil público encontrado com esse nome de usuário.';
    }catch{if(request===version)status.textContent='Não foi possível buscar perfis. Verifique a conexão.'}
   },280);
  }
  button.onclick=()=>{if(!box.hidden){close(true);return}box.hidden=false;dock.classList.add('search-open');button.setAttribute('aria-expanded','true');position();search();input.focus({preventScroll:true})};
  input.addEventListener('input',search);form.addEventListener('submit',event=>{event.preventDefault();const first=list.querySelector('a');if(first)first.click()});
  box.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true)}if(event.key==='ArrowDown'){const first=list.querySelector('a');if(first&&document.activeElement===input){event.preventDefault();first.focus()}}});
  document.addEventListener('pointerdown',event=>{if(!box.hidden&&!box.contains(event.target)&&!button.contains(event.target))close()});
  window.addEventListener('resize',()=>{if(!box.hidden)position()});
 }
 globalThis.ClaySpaceSearch={matches,lookup,attach};
})();
