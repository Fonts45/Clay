/* DotField interpretation for the static Clay hero. */
(()=>{
 const canvas=document.getElementById('clay-dots'),hero=document.querySelector('.hero');if(!canvas||!hero)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const settings={dotRadius:1.5,dotSpacing:14,cursorRadius:420,cursorForce:.26,bulgeOnly:true,bulgeStrength:105,glowRadius:210,sparkle:true,waveAmplitude:0};
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 let width=0,height=0,points=[],visible=true,frame=0,last=0;
 let pointer={x:0,y:0,strength:0},target={x:0,y:0,active:false},client={x:0,y:0,known:false};
 function size(){const r=hero.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);points=[];
 for(let y=7;y<height;y+=settings.dotSpacing)for(let x=7;x<width;x+=settings.dotSpacing)points.push({x,y,phase:Math.random()*Math.PI*2});draw(0)}
 function draw(t,dt=16.67){const ease=1-Math.exp(-dt/110),fade=1-Math.exp(-dt/180);pointer.x+=(target.x-pointer.x)*ease;pointer.y+=(target.y-pointer.y)*ease;pointer.strength+=((target.active&&!reduced?1:0)-pointer.strength)*fade;ctx.clearRect(0,0,width,height);
 for(const p of points){const dx=p.x-pointer.x,dy=p.y-pointer.y,distance=Math.hypot(dx,dy),near=pointer.strength*Math.max(0,1-distance/settings.cursorRadius);
 const bulge=near*near*settings.bulgeStrength*settings.cursorForce;
 const x=p.x+(distance?dx/distance:0)*bulge,y=p.y+(distance?dy/distance:0)*bulge;
 const glow=pointer.strength*Math.max(0,1-distance/settings.glowRadius);
 const sparkle=settings.sparkle&&!reduced?Math.pow(Math.max(0,Math.sin(t*.0012+p.phase)),18)*.16:0;
 ctx.fillStyle='rgba(249,115,22,'+Math.min(.85,.14+glow*.55+sparkle)+')';ctx.beginPath();ctx.arc(x,y,settings.dotRadius*(1+glow*.55),0,Math.PI*2);ctx.fill();
 }
 }
 function loop(t){frame=0;if(!visible||document.hidden)return;const dt=last?Math.min(t-last,50):16.67;last=t;draw(t,dt);if(!reduced)frame=requestAnimationFrame(loop)}
 function start(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(loop)}
 function updateTarget(){if(!client.known)return;const r=hero.getBoundingClientRect();target.x=client.x-r.left;target.y=client.y-r.top;target.active=target.x>=0&&target.x<r.width&&target.y>=0&&target.y<r.height}
 hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const first=!client.known;client={x:e.clientX,y:e.clientY,known:true};updateTarget();if(first){pointer.x=target.x;pointer.y=target.y}},{passive:true});
 hero.addEventListener('pointerleave',()=>target.active=false);
 window.addEventListener('scroll',updateTarget,{passive:true});
 new ResizeObserver(size).observe(hero);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible&&frame){cancelAnimationFrame(frame);frame=0}else start()}).observe(hero);
 document.addEventListener('visibilitychange',start);size();start();
})();
