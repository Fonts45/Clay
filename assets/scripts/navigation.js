(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let active=null;
 window.clayTransition=update=>{
  // Finish pending state changes before a rapid second click; never queue animations.
  if(active){active.apply();active.transition.skipTransition();active=null}
  let applied=false;
  const apply=()=>{if(!applied){applied=true;update()}};
  if(reduced.matches||!document.startViewTransition||document.documentElement.classList.contains('resume-ai')){apply();return Promise.resolve()}
  try{
   const transition=document.startViewTransition(apply),entry={apply,transition};active=entry;
   transition.ready.catch(()=>{});
   transition.finished.catch(()=>{}).finally(()=>{if(active===entry)active=null});
   return transition.updateCallbackDone.catch(()=>apply());
  }catch{apply();return Promise.resolve()}
 };
 // Warm the static page shell on intent, without executing scripts or waiting on it.
 const warmed=new Set();
 function prefetch(event){
  const link=event.target.closest?.('a[href]');
  if(!link||link.target||link.hasAttribute('download')||navigator.connection?.saveData)return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||!/^\/(index|espaco|perfil)\.html$/.test(url.pathname)||url.pathname===location.pathname)return;
  url.hash='';if(warmed.has(url.href)||warmed.size>=4)return;warmed.add(url.href);
  const hint=document.createElement('link');hint.rel='prefetch';hint.as='document';hint.href=url.href;document.head.appendChild(hint);
 }
 document.addEventListener('pointerover',prefetch,{passive:true});
 document.addEventListener('focusin',prefetch);
})();
