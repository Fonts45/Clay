/* BorderGlow nativo: proximidade da borda e direção do cursor. */
(()=>{
 const cards=document.querySelectorAll('#sobre .border-glow-card');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const animations=new Map();
 function stop(card){cancelAnimationFrame(animations.get(card));animations.delete(card)}
 cards.forEach(card=>{
  card.addEventListener('pointermove',event=>{
   stop(card);const rect=card.getBoundingClientRect(),cx=rect.width/2,cy=rect.height/2;
   const dx=event.clientX-rect.left-cx,dy=event.clientY-rect.top-cy;
   const edge=Math.min(1,Math.max(Math.abs(dx)/cx,Math.abs(dy)/cy));
   card.style.setProperty('--edge-proximity',(edge*100).toFixed(3));
   card.style.setProperty('--cursor-angle',((Math.atan2(dy,dx)*180/Math.PI+450)%360).toFixed(3)+'deg');
  });
  card.addEventListener('pointerleave',()=>{stop(card);card.style.setProperty('--edge-proximity','0')});
 });
 if(reduced||typeof IntersectionObserver==='undefined')return;
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;const card=entry.target;observer.unobserve(card);
  const start=performance.now();
  function sweep(now){
   const elapsed=now-start,t=Math.min(1,elapsed/4000);
   const edge=elapsed<500?100*(1-Math.pow(1-elapsed/500,3)):elapsed<2500?100:100*(1-Math.pow(Math.min(1,(elapsed-2500)/1500),3));
   card.style.setProperty('--edge-proximity',String(Math.max(0,edge)));
   card.style.setProperty('--cursor-angle',(110+355*(t*t*(3-2*t)))+'deg');
   if(t<1)animations.set(card,requestAnimationFrame(sweep));else animations.delete(card);
  }
  animations.set(card,requestAnimationFrame(sweep));
 }),{threshold:.35});cards.forEach(card=>observer.observe(card));
})();
