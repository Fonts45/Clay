(()=>{
const root=document.getElementById('owner-space');if(!root)return;
const selector='.stats>div,.course-card,.project-card,.resume-card,.profile-cover,.publish-bar,.empty,.loading-placeholder';
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function prepare(){root.querySelectorAll(selector).forEach((card,index)=>{if(card.classList.contains('bento-card'))return;card.classList.add('bento-card');if(!reduced){card.style.setProperty('--intro-delay',Math.min(index,5)*45+'ms');card.classList.add('bento-enter')}})}
prepare();new MutationObserver(prepare).observe(root,{childList:true,subtree:true});
root.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduced)return;root.querySelectorAll('.bento-card').forEach(card=>{const r=card.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;const d=Math.hypot(Math.max(-x,0,x-r.width),Math.max(-y,0,y-r.height));card.style.setProperty('--spot-x',x+'px');card.style.setProperty('--spot-y',y+'px');card.style.setProperty('--spot-alpha',String(Math.max(0,1-d/300)))})},{passive:true});
root.addEventListener('pointerleave',()=>root.querySelectorAll('.bento-card').forEach(card=>card.style.setProperty('--spot-alpha','0')));
root.addEventListener('click',event=>{if(reduced)return;const card=event.target.closest('.bento-card');if(!card)return;const r=card.getBoundingClientRect(),pulse=document.createElement('i');pulse.className='bento-ripple';pulse.setAttribute('aria-hidden','true');pulse.style.left=event.clientX-r.left+'px';pulse.style.top=event.clientY-r.top+'px';card.appendChild(pulse);pulse.addEventListener('animationend',()=>pulse.remove(),{once:true})});
})();