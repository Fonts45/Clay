/* Remove somente fundos uniformes ligados às bordas, preservando detalhes internos. */
(()=>{
 function removeBackground(image){
  const {data,width,height}=image,total=width*height;
  const corners=[0,width-1,(height-1)*width,total-1];
  const distance=(a,b)=>Math.max(...[0,1,2].map(channel=>Math.abs(data[a*4+channel]-data[b*4+channel])));
  const opaque=corners.filter(index=>data[index*4+3]>240);
  const seed=opaque.find(index=>opaque.filter(other=>distance(index,other)<24).length>=3);
  if(seed===undefined)return image;
  const color=Array.from(data.slice(seed*4,seed*4+3));
  const visited=new Uint8Array(total),queue=new Int32Array(total);let head=0,tail=0;
  function enqueue(index){
   if(visited[index])return;visited[index]=1;
   if(data[index*4+3]!==0&&color.some((value,channel)=>Math.abs(value-data[index*4+channel])>44))return;
   queue[tail++]=index;
  }
  for(let x=0;x<width;x++){enqueue(x);enqueue((height-1)*width+x)}
  for(let y=0;y<height;y++){enqueue(y*width);enqueue(y*width+width-1)}
  // Refuse a nearly empty result (e.g. a solid-color brand tile).
  while(head<tail){const index=queue[head++],x=index%width;if(x>0)enqueue(index-1);if(x<width-1)enqueue(index+1);if(index>=width)enqueue(index-width);if(index<total-width)enqueue(index+width)}
  if(tail>total*.97)return image;
  for(let index=0;index<tail;index++)data[queue[index]*4+3]=0;
  return image;
 }
 async function prepare(src){
  const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='no-referrer';image.src=src;await image.decode();
  const scale=Math.min(1,256/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const pixels=removeBackground(ctx.getImageData(0,0,canvas.width,canvas.height));ctx.putImageData(pixels,0,0);
  let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels.data[(y*canvas.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
  if(right<left)return canvas.toDataURL('image/png');
  const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;cropped.getContext('2d').drawImage(canvas,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
  return cropped.toDataURL('image/png');
 }
 const cache=new Map();
 function fromSite(url){const domain=new URL(url).hostname;if(!cache.has(domain))cache.set(domain,prepare('/api/shortcut-logo?domain='+encodeURIComponent(domain)).catch(error=>{cache.delete(domain);throw error}));return cache.get(domain)}
 globalThis.ClayLogo={removeBackground,prepare,fromSite};
})();
