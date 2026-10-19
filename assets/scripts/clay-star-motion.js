/* Vector border avoids mask-compositing artifacts at rounded corners. */
(()=>{
 const buttons=[...document.querySelectorAll('.clay-star-button')];
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 buttons.forEach(button=>{
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.classList.add('clay-star-outline-svg');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  // Align every trail segment at its clockwise leading edge.
  const trails=[];
  for(let i=0;i<16;i++){
   const rect=document.createElementNS(ns,'rect');rect.setAttribute('fill','none');rect.setAttribute('stroke','#fff');rect.setAttribute('stroke-width','1');rect.setAttribute('pathLength','100');rect.setAttribute('stroke-dasharray',`${1.5+i*1.5} ${98.5-i*1.5}`);rect.setAttribute('stroke-opacity','.08');rect.setAttribute('stroke-dashoffset',1.5+i*1.5-24);svg.append(rect);trails.push(rect);
  }
  button.append(svg);
  function resize(){const w=button.clientWidth,h=button.clientHeight,r=parseFloat(getComputedStyle(button).borderRadius)||12;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);trails.forEach(rect=>{rect.setAttribute('x','1');rect.setAttribute('y','1');rect.setAttribute('width',Math.max(0,w-2));rect.setAttribute('height',Math.max(0,h-2));rect.setAttribute('rx',Math.max(0,r-1))})}
  new ResizeObserver(resize).observe(button);resize();
  let hovered=false,angle=0,velocity=90,last=0,frame=0,visible=false;
  function covered(){return !button.closest('#app')&&(document.documentElement.classList.contains('clay-ai-active')||document.documentElement.classList.contains('resume-ai'))}
  button.addEventListener('pointerenter',()=>hovered=true);button.addEventListener('pointerleave',()=>hovered=false);button.addEventListener('blur',()=>hovered=false);
  function tick(time){frame=0;if(document.hidden||reduced.matches||!visible||covered())return;const dt=last?Math.min((time-last)/1000,.05):0;last=time;velocity+=((hovered?300:90)-velocity)*(1-Math.exp(-dt*12));angle=(angle+velocity*dt)%360;trails.forEach((rect,i)=>rect.setAttribute('stroke-dashoffset',1.5+i*1.5-24-angle/3.6));frame=requestAnimationFrame(tick)}
  function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden&&!reduced.matches&&visible&&!covered())frame=requestAnimationFrame(tick)}
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()}).observe(button);
  document.addEventListener('clay:navigation',sync);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
 });
})();
