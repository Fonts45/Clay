/* Preserve the trail position while changing its angular speed. */
(()=>{
 const buttons=[...document.querySelectorAll('.clay-star-button')];if(!buttons.length||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 buttons.forEach(button=>{
  let hovered=false,angle=0,velocity=90,last=0;
  button.addEventListener('pointerenter',()=>hovered=true);
  button.addEventListener('pointerleave',()=>hovered=false);
  button.addEventListener('blur',()=>hovered=false);
  function tick(time){const dt=last?Math.min((time-last)/1000,.05):0;last=time;
   velocity+=((hovered?300:90)-velocity)*(1-Math.exp(-dt*12));
   angle=(angle+velocity*dt)%360;
   button.style.setProperty('--clay-star-angle',angle+'deg');
   requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange',()=>last=0);requestAnimationFrame(tick);
 });
})();