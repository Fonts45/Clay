/* Editor local: recorte quadrado com prévia circular para o avatar. */
(() => {
 let busy=false;
 window.ClayPhotoCrop={open:async source=>{
  if(busy)return null;
  busy=true;
  let ownedURL=null;
  try{
   const image=new Image();
   if(source instanceof Blob){if(!['image/jpeg','image/png','image/webp'].includes(source.type)||source.size>8*1024*1024)throw Error('Escolha uma imagem JPG, PNG ou WebP de até 8 MB.');ownedURL=URL.createObjectURL(source)}
   image.src=ownedURL||source;await image.decode();
   return await new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='photo-crop-dialog';dialog.setAttribute('aria-labelledby','photo-crop-title');
    dialog.innerHTML='<h2 id="photo-crop-title">Enquadrar foto</h2><p>Arraste a imagem para posicionar e ajuste o zoom.</p><canvas width="600" height="600" tabindex="0" aria-label="Enquadramento da foto. Use as setas para mover a imagem."></canvas><label>Zoom<input type="range" min="1" max="4" step="0.01" value="1"></label><div class="photo-crop-actions"><button type="button" class="button" data-cancel>Cancelar</button><button type="button" class="button" data-reset>Redefinir</button><button type="button" class="button primary" data-apply>Usar foto</button></div>';
    document.body.append(dialog);
    const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=dialog.querySelector('input');
    const base=Math.max(600/image.naturalWidth,600/image.naturalHeight);
    let zoom=1,x=0,y=0,drag=null,result=null,frame=0;
    function draw(){frame=0;const w=image.naturalWidth*base*zoom,h=image.naturalHeight*base*zoom;x=Math.max(-(w-600)/2,Math.min((w-600)/2,x));y=Math.max(-(h-600)/2,Math.min((h-600)/2,y));ctx.clearRect(0,0,600,600);ctx.drawImage(image,(600-w)/2+x,(600-h)/2+y,w,h);ctx.save();ctx.fillStyle='#0009';ctx.beginPath();ctx.rect(0,0,600,600);ctx.arc(300,300,298,0,Math.PI*2,true);ctx.fill('evenodd');ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(300,300,298,0,Math.PI*2);ctx.stroke();ctx.restore()}
    function paint(){if(!frame)frame=requestAnimationFrame(draw)}
    slider.oninput=()=>{const next=Number(slider.value);x*=next/zoom;y*=next/zoom;zoom=next;paint()};
    canvas.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
    canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;const rect=canvas.getBoundingClientRect();x+=(e.clientX-drag.x)*600/rect.width;y+=(e.clientY-drag.y)*600/rect.height;drag.x=e.clientX;drag.y=e.clientY;paint()};
    canvas.onpointerup=canvas.onpointercancel=()=>{drag=null};
    canvas.onkeydown=e=>{const step=e.shiftKey?30:8;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')x-=step;if(e.key==='ArrowRight')x+=step;if(e.key==='ArrowUp')y-=step;if(e.key==='ArrowDown')y+=step;paint()};
    dialog.querySelector('[data-reset]').onclick=()=>{x=y=0;zoom=1;slider.value='1';paint()};
    dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
    dialog.querySelector('[data-apply]').onclick=()=>{
     draw();const output=document.createElement('canvas');output.width=output.height=480;const out=output.getContext('2d');out.fillStyle='#211c17';out.fillRect(0,0,480,480);
     const w=image.naturalWidth*base*zoom,h=image.naturalHeight*base*zoom;
     out.drawImage(image,((600-w)/2+x)*.8,((600-h)/2+y)*.8,w*.8,h*.8);
     result=output.toDataURL('image/jpeg',.85);
     if(result.length>180000)result=output.toDataURL('image/jpeg',.65);
     dialog.close();
    };
    dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);dialog.remove();resolve(result)},{once:true});
    dialog.showModal();draw();
   });
  }finally{if(ownedURL)URL.revokeObjectURL(ownedURL);busy=false}
 }};
})();