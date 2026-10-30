(() => {
 const tasks=new Set(['document']);
 const workspace=/\/(espaco|perfil)\.html$/.test(location.pathname);
 if(workspace)tasks.add('workspace');
 let layer,exitTimer;
 function sync(){
  const busy=tasks.size>0;document.documentElement.classList.toggle('clay-content-loading',busy);
  if(!layer)return;
  if(busy){clearTimeout(exitTimer);layer.hidden=false;layer.classList.remove('is-leaving');return}
  if(layer.hidden||layer.classList.contains('is-leaving'))return;
  layer.classList.add('is-leaving');
  const duration=matchMedia('(prefers-reduced-motion:reduce)').matches?150:650;
  exitTimer=setTimeout(()=>{if(tasks.size===0){layer.hidden=true;layer.classList.remove('is-leaving')}},duration);
 }
 window.clayLoading={begin(key){tasks.add(key);sync()},end(key){tasks.delete(key);sync()}};
 function mount(){if(layer)return;layer=document.createElement('div');layer.className='clay-loading-layer';layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');layer.innerHTML='<span class="clay-loading-logo" aria-hidden="true"></span><span class="clay-loading-description">Carregando…</span>';document.body.append(layer);sync()}
 sync();document.addEventListener('DOMContentLoaded',()=>{
  mount();
  const hero=document.querySelector('.hero');if(!hero)return;
  const backgrounds=[getComputedStyle(hero).backgroundImage,getComputedStyle(hero,'::after').backgroundImage];
  const urls=backgrounds.flatMap(value=>[...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match=>match[1]));
  if(!urls.length)return;
  window.clayLoading.begin('hero-background');
  Promise.all(urls.map(url=>new Promise(resolve=>{const image=new Image();image.onload=image.onerror=resolve;image.src=url;if(image.complete)resolve()}))).finally(()=>window.clayLoading.end('hero-background'));
 },{once:true});
 window.addEventListener('load',()=>{mount();window.clayLoading.end('document')},{once:true});
 // O watchdog das páginas continua exibindo a falha, sem deixar uma camada presa.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
})();