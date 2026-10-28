(()=>{
 'use strict';
 const workerURL=new URL('avatar-face-worker.js',document.currentScript.src);
 let worker,sequence=0;
 const pending=new Map();
 function check({faces=[],people=[],width,height}){
  if(faces.length>1||people.length>1)throw Error('Erro: encontramos mais de uma pessoa ou rosto. Escolha uma foto com apenas uma pessoa.');
  if(!faces.length)throw Error('Erro: não encontramos um rosto visível. Escolha uma foto nítida de uma única pessoa, olhando para a câmera.');
  const box=faces[0].boundingBox;
  if(!box||box.width<width*.08||box.height<height*.08)throw Error('Erro: o rosto está muito distante. Escolha uma foto mais próxima e nítida.');
  if(box.originX<=0||box.originY<=0||box.originX+box.width>=width||box.originY+box.height>=height)throw Error('Erro: o rosto parece estar cortado. Escolha uma foto com a cabeça inteira dentro da imagem.');
  return {face:box,width,height};
 }
 function unavailable(){return Error('Não foi possível verificar a foto neste aparelho. Verifique sua conexão e tente novamente. Nenhuma foto foi enviada.')}
 function stop(){worker?.terminate();worker=null;for(const task of pending.values()){clearTimeout(task.timer);task.reject(unavailable())}pending.clear()}
 async function validate(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Erro: escolha uma imagem JPG, PNG ou WebP.');
  if(file.size>8*1024*1024)throw Error('Erro: a imagem ultrapassa 8 MB. Escolha uma foto menor.');
  let bitmap;
  try{bitmap=await createImageBitmap(file)}catch{throw Error('Erro: não foi possível abrir essa imagem. Escolha outra foto JPG, PNG ou WebP.')}
  try{
   const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));
   if(scale<1){const resized=await createImageBitmap(bitmap,{resizeWidth:Math.round(bitmap.width*scale),resizeHeight:Math.round(bitmap.height*scale)});bitmap.close();bitmap=resized}
   if(!worker){worker=new Worker(workerURL,{type:'module'});worker.onerror=stop;worker.onmessage=({data})=>{const task=pending.get(data.id);if(!task)return;clearTimeout(task.timer);pending.delete(data.id);if(data.error)task.reject(Error(data.error));else{try{task.resolve(check(data))}catch(error){task.reject(error)}}}}
   return await new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(stop,60000);pending.set(id,{resolve,reject,timer});try{worker.postMessage({id,bitmap},[bitmap])}catch{stop()}});
  }catch(error){throw error.message?error:unavailable()}
  finally{bitmap.close()}
 }
 globalThis.ClayAvatarValidation={check,validate};
})();
