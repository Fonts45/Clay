/* Reorderable feature preview with animated positioning. */
(()=>{
const root=document.getElementById('resource-demo');if(!root)return;
const list=root.querySelector('ul'),status=document.getElementById('resource-status'),original=[...list.children],reduced=matchMedia('(prefers-reduced-motion:reduce)');let drag=null,suppress=false;
function animateOrder(mutate){const before=new Map([...list.children].map(el=>[el,el.getBoundingClientRect()]));mutate();if(reduced.matches)return;[...list.children].forEach(el=>{const from=before.get(el),to=el.getBoundingClientRect();if(from&&Math.abs(from.top-to.top)>.5)el.animate([{transform:`translateY(${from.top-to.top}px)`},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'})})}
function reorder(item,direction){const other=direction<0?item.previousElementSibling:item.nextElementSibling;if(other){animateOrder(()=>list.insertBefore(item,direction<0?other:other.nextSibling));status.textContent='Ordem dos cartões atualizada.'}}
function preview(d){const dy=d.py-d.y,dx=(d.px-d.x)*.3;d.button.style.transform=`translate(${dx}px,${dy}px) rotate(${reduced.matches?0:Math.max(-4,Math.min(4,dx*.07))}deg) scale(${reduced.matches?1:1.025})`;let index=0;const center=d.rect.top+dy+d.rect.height/2;
{d.items.forEach((el,i)=>{if(el!==d.item&&center>d.boxes[i].top+d.boxes[i].height/2)index++})}
d.to=index;const shift=d.rect.height+10;d.items.forEach((el,i)=>{if(el===d.item)return;let offset=0;if(index>d.from&&i>d.from&&i<=index)offset=-shift;if(index<d.from&&i>=index&&i<d.from)offset=shift;el.style.transform=`translateY(${offset}px)`});}
original.forEach(item=>{const button=item.querySelector('button'),detail=item.querySelector('.resource-detail');button.setAttribute('aria-keyshortcuts','Alt+ArrowUp Alt+ArrowDown');
button.addEventListener('click',()=>{if(suppress){suppress=false;return}const open=detail.hidden;detail.hidden=!open;button.setAttribute('aria-expanded',String(open))});
button.addEventListener('keydown',e=>{if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();reorder(item,e.key==='ArrowUp'?-1:1);button.focus()}});
button.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;button.getAnimations().forEach(a=>a.cancel());const items=[...list.children];drag={item,button,id:e.pointerId,x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,moved:false,items,from:items.indexOf(item),to:items.indexOf(item),rect:button.getBoundingClientRect(),boxes:items.map(el=>el.getBoundingClientRect())};button.setPointerCapture(e.pointerId)});
button.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;drag.px=e.clientX;drag.py=e.clientY;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6&&!drag.moved)return;if(!drag.moved){drag.moved=true;detail.hidden=true;button.setAttribute('aria-expanded','false');drag.boxes=drag.items.map(el=>el.getBoundingClientRect());drag.rect=button.getBoundingClientRect();item.classList.add('resource-drag-slot');button.classList.add('dragging')}preview(drag)});
function finish(e,cancel=false){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;const from=button.getBoundingClientRect();if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);if(!d.moved)return;suppress=true;setTimeout(()=>suppress=false,0);
const old=new Map(d.items.map(el=>[el,el.getBoundingClientRect()]));d.items.forEach(el=>{el.style.transition='none';el.style.transform=''});item.classList.remove('resource-drag-slot');button.classList.remove('dragging');button.style.transform='';
if(!cancel){const remaining=d.items.filter(el=>el!==item);list.insertBefore(item,remaining[d.to]||null);status.textContent=d.to===d.from?'Cartão reposicionado.':'Ordem dos cartões atualizada.'}
const target=button.getBoundingClientRect();d.items.forEach(el=>{if(!el.isConnected)return;const next=el.getBoundingClientRect(),previous=old.get(el);el.getBoundingClientRect();el.style.transition='';if(el!==item&&!reduced.matches&&previous)el.animate([{transform:`translateY(${previous.top-next.top}px)`},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'})});
if(!reduced.matches)button.animate([{transform:`translate(${from.left-target.left}px,${from.top-target.top}px) scale(1.025)`},{transform:'translate(0,0) scale(1)'}],{duration:440,easing:'cubic-bezier(.16,1,.3,1)'});
}
button.addEventListener('pointerup',e=>finish(e));button.addEventListener('pointercancel',e=>finish(e,true));button.addEventListener('lostpointercapture',e=>finish(e,true));button.addEventListener('dragstart',e=>e.preventDefault());
});
})();
