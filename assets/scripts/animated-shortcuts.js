/* Comportamento AnimatedList sobre os atalhos pessoais existentes. */
(()=>{
 const root=document.getElementById('resource-demo');if(!root)return;
 const list=root.querySelector('.resource-list'),ring=document.createElement('span');
 ring.className='animated-shortcuts-ring';ring.setAttribute('aria-hidden','true');root.appendChild(ring);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 let selected=null,entered=reduced,keyboard=false,frame=0,last=0;
 const motion={y:0,h:0,vy:0,vh:0,ty:0,th:0,ready:false};
 function write(){ring.style.transform=`translate3d(0,${motion.y}px,0)`;ring.style.height=motion.h+'px'}
 function tick(now){
  frame=0;const dt=Math.min(.05,(now-last)/1000||0);last=now;
  const steps=Math.max(1,Math.ceil(dt*240)),h=dt/steps;
  for(let i=0;i<steps;i++){
   motion.vy+=(900*(motion.ty-motion.y)-46.8*motion.vy)*h;
   motion.vh+=(900*(motion.th-motion.h)-46.8*motion.vh)*h;
   motion.y+=motion.vy*h;motion.h+=motion.vh*h;
  }
  const moving=Math.abs(motion.ty-motion.y)>.05||Math.abs(motion.th-motion.h)>.05||Math.abs(motion.vy)+Math.abs(motion.vh)>.5;
  if(!moving){motion.y=motion.ty;motion.h=motion.th;motion.vy=motion.vh=0}write();
  if(moving)frame=requestAnimationFrame(tick);
 }
 function place(snap=false){
  if(!selected?.isConnected||!list.contains(selected)){ring.style.opacity='0';motion.ready=false;return}
  const top=selected.offsetTop-list.scrollTop;
  if(selected.dataset.state!=='in'||top<0||top+selected.offsetHeight>list.clientHeight){ring.style.opacity='0';return}
  ring.style.opacity='1';ring.style.left=(list.offsetLeft+selected.offsetLeft)+'px';ring.style.width=selected.offsetWidth+'px';
  motion.ty=list.offsetTop+top;motion.th=selected.offsetHeight;
  if(snap||reduced||!motion.ready){cancelAnimationFrame(frame);frame=0;motion.y=motion.ty;motion.h=motion.th;motion.vy=motion.vh=0;motion.ready=true;write()}
  else if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}
 }
 function reveal(entrance=false){
  const scroll=list.scrollTop,view=list.clientHeight;let order=0;
  list.style.setProperty('--al-fade-top',Math.min(56,Math.max(0,scroll))+'px');
  list.style.setProperty('--al-fade-bottom',Math.min(56,Math.max(0,list.scrollHeight-view-scroll))+'px');
  for(const row of list.children){
   const top=row.offsetTop-scroll,height=row.offsetHeight;
   const overlap=Math.min(view,top+height)-Math.max(0,top);
   const state=reduced?'in':!entered?'below':overlap>=Math.min(height,view)*.5?'in':top+height/2<view/2?'above':'below';
   if(row.dataset.state===state)continue;
   row.style.transitionDelay=entrance&&state==='in'?`${order++*.05}s`:'0s';row.dataset.state=state;
  }
 }
 function select(target){const row=target.closest('li');if(!row||row.parentElement!==list)return;selected=row;place()}
 list.addEventListener('pointermove',event=>{if(event.buttons)return;keyboard=false;select(event.target)});
 list.addEventListener('focusin',event=>select(event.target));
 list.addEventListener('click',event=>select(event.target));
 root.addEventListener('pointerleave',()=>{if(!keyboard&&!list.contains(document.activeElement)){selected=null;place()}});
 root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget)){selected=null;place()}});
 list.addEventListener('scroll',()=>{reveal();place(true)},{passive:true});
 list.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||!event.target.matches('.resource-item'))return;
  const buttons=Array.from(list.querySelectorAll('.resource-item')),index=buttons.indexOf(event.target);
  let next;if(event.key==='ArrowDown')next=Math.min(index+1,buttons.length-1);else if(event.key==='ArrowUp')next=Math.max(0,index-1);else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
  event.preventDefault();keyboard=true;buttons[next].focus({preventScroll:true});
  const row=buttons[next].parentElement,top=row.offsetTop,bottom=top+row.offsetHeight;
  if(top<list.scrollTop+56)list.scrollTo({top:Math.max(0,top-56),behavior:reduced?'auto':'smooth'});
  else if(bottom>list.scrollTop+list.clientHeight-56)list.scrollTo({top:bottom-list.clientHeight+56,behavior:reduced?'auto':'smooth'});
 });
 function refresh(){selected=null;reveal(entered);place(true)}
 new MutationObserver(refresh).observe(list,{childList:true});
 new ResizeObserver(()=>{reveal();place(true)}).observe(list);refresh();
 if(!entered){
  if(typeof IntersectionObserver==='undefined'){entered=true;reveal(true)}
  else{const gate=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){entered=true;reveal(true);gate.disconnect()}},{rootMargin:'0px 0px -10% 0px'});gate.observe(root)}
 }
})();
