(()=>{
 'use strict';
 const MAX_AVATAR_LENGTH=300000;
 const BACKGROUND_COLOR='#ff5402';
 const APPROVED_AVATARS=Object.freeze({rodrigofontes:'assets/images/avatars/rodrigofontes-foreground.svg'});
 function preset(username){return APPROVED_AVATARS[String(username||'').trim().replace(/^@/,'').toLowerCase()]||''}
 async function prepare(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Escolha uma imagem JPG, PNG ou WebP de até 8 MB.');
  const bitmap=await createImageBitmap(file);
  try{
   const ratio=Math.min(1,720/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
   const ctx=canvas.getContext('2d');ctx.fillStyle=BACKGROUND_COLOR;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [.88,.78,.68,.58,.48]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=MAX_AVATAR_LENGTH)return data}
   throw Error('Escolha uma imagem com menos detalhes ou menor resolução.');
  }finally{bitmap.close()}
 }
 function open({avatar='',history,save,generate}){
  let busy=false,revision=0,photoURL='',candidate='',cursor=null,historyLoading=false;
  const dialog=document.createElement('dialog');dialog.className='clay-avatar-editor';dialog.setAttribute('aria-labelledby','clay-avatar-title');
  const action='Selecionar foto';
  dialog.innerHTML='<div class="avatar-editor-heading"><div><p>CLAY STUDIO</p><h2 id="clay-avatar-title"></h2></div></div><nav class="avatar-editor-tabs" aria-label="Avatares"><button type="button" data-avatar-create-tab aria-pressed="true">Criar avatar</button><button type="button" data-avatar-history-tab aria-pressed="false">Meus avatares</button></nav><section data-avatar-create><div class="avatar-editor-preview" hidden><img alt="Foto selecionada para criar o avatar"></div><input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Selecionar uma foto de rosto" hidden><div class="avatar-editor-actions"><button type="button" data-avatar-choose></button><button type="button" data-avatar-apply hidden>Usar avatar</button></div></section><section data-avatar-history hidden><p class="avatar-editor-help">Seus avatares ficam guardados na sua conta. Escolha um para aplicar novamente.</p><div class="avatar-history-grid"></div><button type="button" class="avatar-history-more" hidden>Carregar mais</button><div class="avatar-editor-actions"><button type="button" data-avatar-change>Trocar avatar</button></div></section><p class="avatar-editor-status" role="status" aria-live="polite"></p>';
  document.body.append(dialog);
  const preview=dialog.querySelector('img'),input=dialog.querySelector('input'),status=dialog.querySelector('.avatar-editor-status'),choose=dialog.querySelector('[data-avatar-choose]');
  const apply=dialog.querySelector('[data-avatar-apply]'),grid=dialog.querySelector('.avatar-history-grid'),more=dialog.querySelector('.avatar-history-more');
  const shown=new Set();
  function errorMessage(error){return error.code==='permission-denied'?'Não foi possível acessar seus avatares. As permissões do histórico precisam ser atualizadas.':error.message||'Não foi possível acessar seus avatares. Tente novamente.'}
  async function use(image){
   if(busy)return;busy=true;apply.disabled=true;choose.disabled=true;status.dataset.error='false';status.textContent='Aplicando seu avatar…';
   try{await save(image);if(dialog.isConnected)dialog.close()}
   catch(error){if(dialog.isConnected){status.dataset.error='true';status.textContent=errorMessage(error)}}
   finally{busy=false;apply.disabled=false;choose.disabled=false}
  }
  function tile(entry){
   if(shown.has(entry.image))return;shown.add(entry.image);
   const button=document.createElement('button');button.type='button';button.className='avatar-history-item';button.setAttribute('aria-label','Usar este avatar');
   const image=document.createElement('img');image.src=entry.image;image.alt='Avatar Clay salvo';image.loading='lazy';
   const label=document.createElement('span');label.textContent='Usar este avatar';button.append(image,label);button.onclick=()=>use(entry.image);grid.append(button);
  }
  async function loadHistory(reset=false){
   if(!history||historyLoading)return;historyLoading=true;more.disabled=true;
   try{
    if(reset){cursor=null;shown.clear();grid.replaceChildren();if(avatar)tile({image:avatar});if(avatar)await history.rememberCurrent(avatar)}
    const page=await history.list(cursor);if(!dialog.isConnected)return;
    page.items.forEach(tile);cursor=page.cursor;more.hidden=!page.more;
    if(!shown.size)status.textContent='Você ainda não tem avatares salvos.';
   }catch(error){if(dialog.isConnected){status.dataset.error='true';status.textContent=errorMessage(error)}}
   finally{historyLoading=false;more.disabled=false}
  }
  let sizeAnimation;
  function tab(showHistory){
   sizeAnimation?.cancel();
   const previous=dialog.querySelector('[data-avatar-history-tab]').getAttribute('aria-pressed')==='true';
   dialog.querySelector('.avatar-editor-tabs').dataset.active=showHistory?'history':'create';
   dialog.querySelector('[data-avatar-create]').hidden=showHistory;dialog.querySelector('[data-avatar-history]').hidden=!showHistory;
   dialog.querySelector('[data-avatar-create-tab]').setAttribute('aria-pressed',String(!showHistory));dialog.querySelector('[data-avatar-history-tab]').setAttribute('aria-pressed',String(showHistory));
   if(previous!==showHistory&&dialog.open&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    sizeAnimation=dialog.animate([{opacity:.65,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
   }
   if(previous!==showHistory&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const panel=dialog.querySelector(showHistory?'[data-avatar-history]':'[data-avatar-create]');panel.getAnimations().forEach(animation=>animation.cancel());panel.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});}
  }
  dialog.querySelector('[data-avatar-create-tab]').onclick=()=>tab(false);
  dialog.querySelector('[data-avatar-history-tab]').onclick=()=>{tab(true);if(!shown.size)loadHistory(true)};
  more.onclick=()=>loadHistory();apply.onclick=()=>candidate&&use(candidate);
  dialog.querySelector('h2').textContent=avatar?'Deseja trocar seu avatar?':'Deseja adicionar um avatar?';
  choose.textContent=action;
  choose.onclick=()=>{if(!busy){input.value='';input.click()}};
  dialog.querySelector('[data-avatar-change]').onclick=()=>{if(!busy){tab(false);input.value='';input.click()}};
  input.addEventListener('change',async()=>{
   if(!input.files.length)return;
   if(photoURL){URL.revokeObjectURL(photoURL);photoURL=''}
   preview.parentElement.hidden=true;preview.removeAttribute('src');
   candidate='';apply.hidden=true;
   status.dataset.error='false';
   if(input.files.length!==1){status.dataset.error='true';status.textContent='Erro: selecione apenas uma imagem de uma pessoa por vez.';return}
   const file=input.files[0],request=++revision;busy=true;choose.disabled=true;status.textContent='Verificando se há apenas uma pessoa e um rosto na foto…';
   try{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Escolha uma imagem JPG, PNG ou WebP de até 8 MB.');
    const sourceHash=history?await ClayAvatarHistory.fingerprint(file):null;
    const cached=history?await history.find(sourceHash):null;
    if(request!==revision||!dialog.isConnected)return;
    if(cached){candidate=cached.image;preview.src=candidate;preview.alt='Avatar recuperado da sua conta';preview.parentElement.hidden=false;apply.hidden=false;status.textContent='Esta foto já tem um avatar salvo. Recuperamos exatamente a mesma imagem.';return}
    if(!globalThis.ClayAvatarValidation)throw Error('Não foi possível iniciar a verificação da foto. Atualize a página e tente novamente.');
    await ClayAvatarValidation.validate(file);
    if(request!==revision||!dialog.isConnected)return;
    photoURL=URL.createObjectURL(file);preview.src=photoURL;preview.parentElement.hidden=false;
    preview.alt='Foto selecionada para criar o avatar';
    if(!generate){status.textContent='Foto validada: um único rosto identificado. A geração automática ainda não está ativada. Seu avatar atual foi mantido.';return}
    if(!history)throw Error('O histórico não está disponível. Nenhum avatar novo foi criado.');
    status.textContent='Criando seu avatar no estilo Clay…';
    const image=await generate(file,ClayAvatarHistory.STYLE);
    // Persist before applying: a profile save failure must not lose a generated image.
    const entry=await history.saveGenerated(sourceHash,image);
    if(request!==revision||!dialog.isConnected)return;
    candidate=entry.image;preview.src=candidate;preview.alt='Avatar Clay criado';apply.hidden=false;tile(entry);status.textContent='Avatar salvo em Meus avatares. Você pode usá-lo agora ou recuperar depois.';
   }catch(error){if(request===revision&&dialog.isConnected){status.dataset.error='true';status.textContent=errorMessage(error)}}
   finally{if(request===revision){busy=false;choose.disabled=false;choose.textContent='Escolher outra foto'}}
  });
  function close(){dialog.close()}
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close()});
  dialog.addEventListener('close',()=>{sizeAnimation?.cancel();revision++;if(photoURL)URL.revokeObjectURL(photoURL);dialog.remove();document.getElementById('card-edit')?.focus()});
  if(avatar){tab(true);tile({image:avatar})}
  dialog.showModal();
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches){sizeAnimation=dialog.animate([{opacity:0,transform:'scale(.84)'},{opacity:1,transform:'scale(1)'}],{duration:280,easing:'cubic-bezier(.16,1,.3,1)'});}
  if(history)loadHistory(true);
 }
 globalThis.ClayAvatarEditor={open,prepare,preset,BACKGROUND_COLOR,MAX_AVATAR_LENGTH};
})();
