/* Atalhos pessoais locais: links e documentos escolhidos pelo usuário. */
(()=>{
 const root=document.getElementById('resource-demo');if(!root)return;
 const list=root.querySelector('ul'),status=document.getElementById('resource-status');
 const categories=['Faculdade','Curso','Pesquisa','Livro'];let entries=Array(15).fill(null),editing=0,db;
 function transaction(mode,run){return new Promise((resolve,reject)=>{if(!db)return reject(Error('Armazenamento indisponível neste navegador.'));const tx=db.transaction('shortcuts',mode),store=tx.objectStore('shortcuts');let value;run(store,v=>value=v);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
 function notify(text){status.textContent=text}
 let drag=null,suppressClickUntil=0,savingOrder=false,openedRow=null;
 function settleSwipe(row,value){
  row.style.setProperty('--swipe-x',value+'px');row.classList.toggle('swipe-open',value>0);
  row.querySelector('.shortcut-swipe-actions').inert=value===0;
  row.querySelector('.resource-item').setAttribute('aria-expanded',String(value>0));
  if(value){if(openedRow&&openedRow!==row)settleSwipe(openedRow,0);openedRow=row}else if(openedRow===row)openedRow=null;
 }
 list.addEventListener('keydown',event=>{const row=event.target.closest('li');if(!row?.classList.contains('shortcut-swipe'))return;if(event.key==='ArrowLeft'){event.preventDefault();settleSwipe(row,160)}else if(event.key==='Escape'||event.key==='ArrowRight'){event.preventDefault();settleSwipe(row,0);row.querySelector('.resource-item').focus()}});
 document.addEventListener('pointerdown',event=>{if(openedRow&&!openedRow.contains(event.target))settleSwipe(openedRow,0)});

 list.addEventListener('dragstart',event=>event.preventDefault());
 list.addEventListener('click',event=>{if(Date.now()<suppressClickUntil&&event.target.closest('.resource-item')){event.preventDefault();event.stopImmediatePropagation()}},true);
 list.addEventListener('pointerdown',event=>{
  const bar=event.target.closest('.resource-item');
  if(!bar||event.button!==0||!event.isPrimary||!db||savingOrder||drag)return;
  const rows=Array.from(list.children),row=bar.closest('li'),rect=row.getBoundingClientRect();
  drag={pointerId:event.pointerId,bar,row,rows,startX:event.clientX,startY:event.clientY,startScroll:list.scrollTop,top:rect.top,centers:rows.map(item=>{const box=item.getBoundingClientRect();return box.top+box.height/2}),from:rows.indexOf(row),to:rows.indexOf(row),active:false,axis:null,exposed:row.classList.contains('swipe-open')?160:0};
  bar.setPointerCapture(event.pointerId);
 });
 list.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(!drag.active&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<7)return;
  if(!drag.axis)drag.axis=Math.abs(event.clientX-drag.startX)>Math.abs(event.clientY-drag.startY)?'x':'y';
  if(drag.axis==='x'){
   event.preventDefault();drag.active=true;suppressClickUntil=Date.now()+500;
   const width=drag.row.clientWidth,raw=drag.exposed+drag.startX-event.clientX;
   const exposed=raw<0?raw*.15:raw<=160?raw:160+(raw-160)*.55;
   drag.x=Math.min(width+20,Math.max(-20,exposed));drag.row.classList.add('swiping');
   drag.row.style.setProperty('--swipe-x',drag.x+'px');
   const ready=Boolean(entries[drag.from])&&drag.x>=Math.max(width*.6,200);
   if(ready&&!drag.row.classList.contains('swipe-ready')&&event.pointerType==='touch')navigator.vibrate?.(8);
   drag.row.classList.toggle('swipe-ready',ready);return;
  }
  settleSwipe(drag.row,0);
  event.preventDefault();
  drag.active=true;suppressClickUntil=Date.now()+500;
  drag.bar.classList.add('dragging');drag.row.classList.add('resource-drag-slot');
  const viewport=list.getBoundingClientRect();
  if(event.clientY<viewport.top+32)list.scrollTop-=12;
  else if(event.clientY>viewport.bottom-32)list.scrollTop+=12;
  const center=drag.centers[drag.from]+event.clientY-drag.startY+list.scrollTop-drag.startScroll;
  let target=drag.from;
  while(target<drag.rows.length-1&&center>drag.centers[target+1])target++;
  while(target>0&&center<drag.centers[target-1])target--;
  if(target!==drag.to){
   const ordered=drag.rows.filter(row=>row!==drag.row);ordered.splice(target,0,drag.row);
   ordered.forEach((row,index)=>{if(row!==drag.row)row.style.transform=`translateY(${drag.centers[index]-drag.centers[drag.rows.indexOf(row)]}px)`});drag.to=target;
  }
  drag.bar.style.transform=`translateY(${drag.top+event.clientY-drag.startY-drag.row.getBoundingClientRect().top}px)`;
 });
 async function finishDrag(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  const current=drag;drag=null;
  if(current.axis==='x'){
   current.row.classList.remove('swiping');
   if(current.bar.hasPointerCapture(current.pointerId))current.bar.releasePointerCapture(current.pointerId);
   suppressClickUntil=Date.now()+500;
   if(event.type==='pointerup'&&current.row.classList.contains('swipe-ready')){await foldShortcut(current.from,current.row)}
   else{current.row.classList.remove('swipe-ready');settleSwipe(current.row,event.type==='pointerup'&&current.x>65?160:0)}
   return;
  }
  current.rows.forEach(row=>{row.style.transform=''});
  current.bar.style.transform='';current.bar.classList.remove('dragging');current.row.classList.remove('resource-drag-slot');
  if(current.bar.hasPointerCapture(current.pointerId))current.bar.releasePointerCapture(current.pointerId);
  if(!current.active)return;
  suppressClickUntil=Date.now()+500;
  if(event.type!=='pointerup'||current.from===current.to){render();return}
  const previous=entries;
  const ordered=current.rows.filter(row=>row!==current.row);ordered.splice(current.to,0,current.row);
  entries=ordered.map(row=>{const entry=previous[current.rows.indexOf(row)];return entry?{...entry}:null});
  entries.forEach((entry,index)=>{if(entry)entry.order=index});
  savingOrder=true;render();
  try{await transaction('readwrite',store=>entries.forEach(entry=>{if(entry)store.put(entry)}));notify('Ordem dos atalhos salva neste navegador.')}
  catch(error){entries=previous;render();notify('Não foi possível salvar a ordem dos atalhos. Tente novamente.')}
  finally{savingOrder=false}
 }
 list.addEventListener('pointerup',finishDrag);
 list.addEventListener('pointercancel',finishDrag);
 list.addEventListener('lostpointercapture',finishDrag);
 async function removeShortcut(index){
  const entry=entries[index];if(!entry||!db||savingOrder)return;
  savingOrder=true;
  try{
   await transaction('readwrite',store=>store.delete(entry.id));
   entries[index]=null;render();notify('Atalho apagado. Você pode personalizar este espaço novamente.');
  }catch(error){notify('Não foi possível apagar o atalho. Tente novamente.')}
  finally{savingOrder=false}
 }
 const dialog=document.createElement('dialog');dialog.className='shortcut-dialog';dialog.innerHTML=`<form><h2>Personalizar atalho</h2><input name="kind" type="hidden" value="link"><label data-link>Link ou endereço do site<input name="url" type="url" placeholder="Cole um link aqui"></label><label data-file>Ou selecione um documento do computador<input name="file" type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"><small>Até 30 MB. Salvo somente neste navegador.</small></label><p data-source-state role="status" aria-live="polite"></p><button type="button" data-remove-file hidden>Remover documento</button><label>Categoria<select name="category">${categories.map(c=>'<option>'+c+'</option>').join('')}</select></label><label>Logo (opcional)<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"><small>O fundo uniforme é removido automaticamente. Até 5 MB.</small></label><label>Nome<input name="title" required maxlength="100" placeholder="Estácio"></label><label>Especificação<input name="description" required maxlength="180" placeholder="Engenharia de Software"></label><p class="shortcut-error" role="alert"></p><div><button type="button" data-cancel>Cancelar</button><button type="submit">Salvar atalho</button></div></form>`;document.body.appendChild(dialog);
 // Menu de contexto dos atalhos.
 const menu=document.createElement('div');menu.className='shortcut-context-menu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Opções do atalho');
 const menuEdit=document.createElement('button'),menuDelete=document.createElement('button');
 for(const button of [menuEdit,menuDelete]){button.type='button';button.setAttribute('role','menuitem');menu.appendChild(button)}
 menuEdit.textContent='Editar';menuDelete.textContent='Apagar';menuDelete.className='shortcut-context-delete';document.body.appendChild(menu);
 let menuIndex=-1,menuTrigger=null;
 function closeMenu(restoreFocus=false){menu.hidden=true;menuIndex=-1;if(restoreFocus&&menuTrigger?.isConnected)menuTrigger.focus()}
 list.addEventListener('contextmenu',event=>{
  const row=event.target.closest('li');const index=Array.from(list.children).indexOf(row);
  if(index<0)return;event.preventDefault();closeMenu();
  if(drag||savingOrder)return;
  menuIndex=index;menuTrigger=row.querySelector('.resource-item');menuDelete.disabled=!entries[index]||!db;
  menu.hidden=false;const rect=menuTrigger.getBoundingClientRect();
  const x=event.clientX||rect.left,y=event.clientY||rect.bottom;
  menu.style.left=Math.max(8,Math.min(x,window.innerWidth-menu.offsetWidth-8))+'px';
  menu.style.top=Math.max(8,Math.min(y,window.innerHeight-menu.offsetHeight-8))+'px';menuEdit.focus();
 });
 menuEdit.onclick=()=>{const index=menuIndex;closeMenu();if(index>=0)edit(index)};
 menuDelete.onclick=async()=>{const index=menuIndex;closeMenu(true);if(index>=0)await removeShortcut(index)};
 document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))closeMenu()});
 document.addEventListener('keydown',event=>{
  if(menu.hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeMenu(true)}
  else if(event.key==='Tab')closeMenu();
  else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const buttons=[menuEdit,menuDelete].filter(button=>!button.disabled);const index=buttons.indexOf(document.activeElement);buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus()}
 });
 document.addEventListener('scroll',()=>closeMenu(),true);window.addEventListener('resize',()=>closeMenu());
 const form=dialog.querySelector('form'),field=name=>form.elements.namedItem(name),error=dialog.querySelector('.shortcut-error');const manual={category:false,title:false,description:false};
 let keptFileName='';
 function source(){
  const name=field('file').files[0]?.name||keptFileName;
  const file=Boolean(name);
  field('kind').value=file?'file':'link';field('url').required=!file;
  dialog.querySelector('[data-source-state]').textContent=file?'Documento: '+name:field('url').value.trim()?'Destino identificado: link de um site.':'';
  dialog.querySelector('[data-remove-file]').hidden=!file;
 }
 for(const name of ['category','title','description'])field(name).addEventListener(name==='category'?'change':'input',()=>{manual[name]=Boolean(field(name).value.trim())});
 function auto(){source();const suggestion=ClayShortcutDetection.detect({kind:field('kind').value,url:field('url').value,fileName:field('file').files[0]?.name||keptFileName});for(const name of ['category','title','description'])if(!manual[name])field(name).value=suggestion[name]}
 field('url').oninput=()=>{if(field('url').value.trim()){field('file').value='';keptFileName=''}auto()};
 field('url').onblur=()=>{const value=field('url').value.trim();if(value&&!/^[a-z][a-z0-9+.-]*:/i.test(value))field('url').value='https://'+value;auto()};
 field('file').onchange=()=>{if(field('file').files[0]){field('url').value='';keptFileName=''}auto()};
 dialog.querySelector('[data-remove-file]').onclick=()=>{field('file').value='';keptFileName='';auto()};
 dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
 function edit(index){if(savingOrder)return;closeMenu();editing=index;form.reset();keptFileName='';for(const name of ['category','title','description'])manual[name]=false;error.textContent='';const entry=entries[index];if(entry){keptFileName=entry.kind==='file'?entry.file?.name||'Documento salvo':'';for(const name of ['url','category','title','description'])field(name).value=entry[name]||'';const suggestion=ClayShortcutDetection.detect({kind:entry.kind,url:entry.url,fileName:entry.file?.name});for(const name of ['category','title','description'])manual[name]=Boolean(entry[name]&&entry[name]!==suggestion[name])}source();if(!entry)auto();dialog.showModal()}
 async function open(entry){if(entry.kind==='link'){window.open(entry.url,'_blank','noopener,noreferrer');return}try{const saved=await transaction('readonly',(store,set)=>{const req=store.get(entry.id);req.onsuccess=()=>set(req.result)});if(!saved?.file)throw Error('Selecione o documento novamente.');const url=URL.createObjectURL(saved.file),a=document.createElement('a');a.href=url;a.download=saved.file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);notify('Documento aberto para download.')}catch(e){notify(e.message)}}
 async function foldShortcut(index,row){
  if(!entries[index]||savingOrder||row.classList.contains('swipe-collapsing'))return;
  row.classList.remove('swiping');row.classList.add('swipe-ready');row.style.setProperty('--swipe-x',row.clientWidth+'px');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!reduced){await new Promise(resolve=>setTimeout(resolve,180));row.classList.add('swipe-collapsing');await new Promise(resolve=>setTimeout(resolve,200))}
  await removeShortcut(index);if(row.isConnected){row.classList.remove('swipe-collapsing','swipe-ready');settleSwipe(row,0)}
 }
 function render(){openedRow=null;list.replaceChildren();for(let index=0;index<Math.max(15,entries.length);index++){const entry=entries[index],li=document.createElement('li'),bar=document.createElement('button');bar.type='button';bar.className='resource-item';const thumb=document.createElement('span');thumb.className='resource-thumb shortcut-thumb';thumb.setAttribute('aria-hidden','true');thumb.textContent=entry?entry.title.charAt(0).toUpperCase():'';if(!entry){thumb.classList.add('shortcut-thumb--empty');thumb.innerHTML='<img src="assets/images/shortcut-folder.png" alt="" draggable="false">';}if(entry?.logo||entry?.kind==='link'){const image=document.createElement('img');image.src=entry.logo||new URL('/favicon.ico',entry.url).href;image.alt='';image.onload=()=>thumb.replaceChildren(image);image.referrerPolicy='no-referrer';let fallback=false;image.onerror=()=>{if(!fallback&&entry.kind==='link'){fallback=true;image.src='https://www.google.com/s2/favicons?domain='+encodeURIComponent(new URL(entry.url).hostname)+'&sz=64'}else image.remove()};thumb.appendChild(image);thumb.classList.add('has-logo');if(!entry.logo)ClayLogo.fromSite(entry.url).then(src=>{image.onerror=null;image.src=src;thumb.replaceChildren(image)}).catch(()=>{})}else if(entry)thumb.textContent=entry.category==='Livro'?'▤':'↗';const copy=document.createElement('span');copy.className='resource-copy';const title=document.createElement('strong'),description=document.createElement('small');title.textContent=entry?.title||'Adicionar atalho';description.textContent=entry?.description||'Escolha um site ou documento';copy.append(title,description);const tag=document.createElement('span');tag.className='resource-tag';tag.textContent=entry?.category||'';bar.append(thumb,copy,tag);bar.onclick=()=>{if(li.classList.contains('swipe-open')){settleSwipe(li,0);return}entry?open(entry):edit(index)};
li.classList.add('shortcut-swipe');li.style.position='relative';
const drawer=document.createElement('div');drawer.className='shortcut-swipe-actions';drawer.inert=true;
const editButton=document.createElement('button'),deleteButton=document.createElement('button');
editButton.type=deleteButton.type='button';editButton.innerHTML='<img class="shortcut-pencil" src="assets/images/profile-edit-original.png" alt=""><span>Editar</span>';
deleteButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg><span>Apagar</span>';
deleteButton.className='shortcut-swipe-delete';deleteButton.disabled=!entry;
editButton.onclick=()=>{settleSwipe(li,0);edit(index)};deleteButton.onclick=()=>foldShortcut(index,li);
drawer.append(editButton,deleteButton);li.append(drawer,bar);bar.setAttribute('aria-expanded','false');bar.setAttribute('aria-label',(entry?.title||'Adicionar atalho')+'. Deslize para a esquerda para ver opções.');list.appendChild(li)}}
 form.onsubmit=async event=>{event.preventDefault();source();error.textContent='';const save=form.querySelector('[type="submit"]');save.disabled=true;try{let url='';const previous=entries[editing],kind=field('kind').value;if(kind==='link'){const parsed=new URL(field('url').value);if(!['https:','http:'].includes(parsed.protocol))throw Error('Use um link HTTP ou HTTPS.');url=parsed.href}const file=field('file').files[0];if(kind==='file'&&!file&&previous?.kind!=='file')throw Error('Escolha um documento.');if(file&&(file.size>30*1024*1024||! /\.(pdf|txt|docx?|xlsx?|pptx?)$/i.test(file.name)))throw Error('Escolha um documento permitido de até 30 MB.');const entry={id:previous?.id||crypto.randomUUID(),order:editing,kind,url,title:field('title').value.trim(),description:field('description').value.trim(),category:field('category').value};const logo=field('logo').files[0];if(logo){if(logo.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(logo.type))throw Error('Escolha uma logo PNG, JPG ou WebP de até 5 MB.');const logoUrl=URL.createObjectURL(logo);try{entry.logo=await ClayLogo.prepare(logoUrl)}finally{URL.revokeObjectURL(logoUrl)}}else if(previous?.logo)entry.logo=previous.logo;if(!entry.title||!entry.description)throw Error('Preencha o nome e a especificação.');if(kind==='file'){entry.file=file||(await transaction('readonly',(store,set)=>{const req=store.get(entry.id);req.onsuccess=()=>set(req.result)}))?.file;if(!entry.file)throw Error('Selecione o documento novamente.')}await transaction('readwrite',store=>store.put(entry));entries[editing]=entry;render();dialog.close();notify('Atalho salvo neste navegador.')}catch(e){error.textContent=e.message}finally{save.disabled=false}};
 render();const request=indexedDB.open('clay-personal-shortcuts',1);request.onupgradeneeded=()=>request.result.createObjectStore('shortcuts',{keyPath:'id'});request.onsuccess=async()=>{db=request.result;try{const saved=await transaction('readonly',(store,set)=>{const req=store.getAll();req.onsuccess=()=>set(req.result)});entries=Array(15).fill(null);saved.forEach(entry=>{if(Number.isInteger(entry.order)&&entry.order>=0&&entry.order<100)entries[entry.order]=entry});render()}catch(e){notify(e.message)}};request.onerror=()=>notify('Não foi possível acessar os atalhos salvos neste navegador.');
})();
