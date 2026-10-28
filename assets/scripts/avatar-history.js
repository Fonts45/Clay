(()=>{
 'use strict';
 const STYLE=Object.freeze({version:'clay-approved-3d-v1',reference:'assets/images/avatars/rodrigofontes-foreground.svg',prompt:'Create a polished semi-realistic stylized 3D profile portrait in the approved Clay reference style. Preserve the identity, age, facial proportions, skin tone, eyes and hair of the single person in the source photo. Automatically reframe the portrait to a chest-up composition with shoulders visible, the full head and hair inside the frame, and comfortable headroom. Adjust the portrait scale and placement to fit this framing. Vertical 2:3 composition. Transparent background for the shared Clay Aurora backdrop. Do not switch to a round toy style. No text, watermark or extra people.'});
 async function hashBytes(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')}
 const fingerprint=file=>file.arrayBuffer().then(hashBytes);
 const validImage=image=>typeof image==='string'&&(image===STYLE.reference||image.length<=300000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image));
 function createStore({db,uid}){
  if(!uid)throw Error('Entre na sua conta para guardar os avatares.');
  const collection=db.collection('learningSpaces').doc(uid).collection('avatars');
  async function remember(id,sourceHash,image){
   if(!validImage(image))throw Error('Não foi possível guardar o avatar: imagem inválida ou maior que o limite.');
   const ref=collection.doc(id);
   return db.runTransaction(async transaction=>{
    const snapshot=await transaction.get(ref);
    if(snapshot.exists)return {id,...snapshot.data()};
    const entry={sourceHash,image,styleVersion:STYLE.version,createdAt:Date.now()};
    transaction.set(ref,entry);return {id,...entry};
   });
  }
  return {
   async find(sourceHash){const snapshot=await collection.doc(sourceHash).get();return snapshot.exists?{id:snapshot.id,...snapshot.data()}:null},
   async rememberCurrent(image){const id=await hashBytes(new TextEncoder().encode('import:'+image));return remember(id,'',image)},
   async saveGenerated(sourceHash,image){if(!/^[a-f0-9]{64}$/.test(sourceHash))throw Error('Identificador da foto inválido.');return remember(sourceHash,sourceHash,image)},
   async list(cursor){let query=collection.orderBy('createdAt','desc').limit(20);if(cursor)query=query.startAfter(cursor);const snapshot=await query.get();return {items:snapshot.docs.map(doc=>({id:doc.id,...doc.data()})),cursor:snapshot.docs.at(-1),more:snapshot.size===20}}
  };
 }
 globalThis.ClayAvatarHistory={STYLE,fingerprint,validImage,createStore};
})();
