/* Acesso ao Clay AI liberado por Avançar, separado do editor de perfil. */
(() => {
 const key='clay-ai-floating-entry';let uid=null,button=null,entered=null;
 try{entered=sessionStorage.getItem(key)}catch{}
 function update(){if(!button)return;const editing=location.pathname.endsWith('/perfil.html')||document.body.classList.contains('profile-editing');button.hidden=!uid||entered!==uid||editing}
 window.clayAIShortcut={setUser(id){uid=id||null;if(!uid){entered=null;try{sessionStorage.removeItem(key)}catch{}}update()}};
 document.addEventListener('click',event=>{
  const advance=event.target.closest?.('#hero-avancar');
  if(!advance||!uid||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  entered=uid;try{sessionStorage.setItem(key,uid)}catch{}update();
 },true);
 function mount(){
  if(button)return;
  button=document.createElement('a');button.className='clay-ai-floating';button.href='index.html?destino=ia';button.setAttribute('aria-label','Abrir Clay AI');button.title='Clay AI';button.hidden=true;
  button.innerHTML='<img src="assets/images/clay-ai-floating.png" alt="" draggable="false">';
  button.addEventListener('click',event=>{
   if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const isLanding=!/\/(espaco|perfil)\.html$/.test(location.pathname);
   if(isLanding){const action=document.querySelector('body > nav .clay-header-actions > .clay-star-button');if(action){event.preventDefault();action.click()}}
  });
  document.body.append(button);new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 document.addEventListener('clay:navigation',update);
})();