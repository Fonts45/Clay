/* Presença por sessão: várias abas não desligam umas às outras. */
(() => {
 const ttl=90000;let uid=null,ref=null,unsubscribe=null,heartbeat=null,refresh=null,rows=[],generation=0;
 const session=crypto.randomUUID();
 function paint(online){const label=document.getElementById('card-presence');if(!label)return;label.classList.toggle('is-online',online);label.innerHTML='<i aria-hidden="true"></i><span>'+(online?'Online':'Offline')+'</span>';label.setAttribute('aria-label',online?'Usuário online':'Usuário offline')}
 function update(){paint(navigator.onLine&&rows.some(row=>row.online===true&&row.lastSeen?.toMillis&&Date.now()-row.lastSeen.toMillis()<ttl))}
 async function send(online=true){const target=ref;if(!target||!navigator.onLine)return;try{await target.set({online,lastSeen:firebase.firestore.FieldValue.serverTimestamp()})}catch{if(target===ref)paint(false)}}
 function stop(){generation++;clearInterval(heartbeat);clearInterval(refresh);unsubscribe?.();unsubscribe=null;const old=ref;ref=null;rows=[];uid=null;paint(false);if(old&&navigator.onLine)old.set({online:false,lastSeen:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{})}
 window.clayPresence={setUser(id){if(id===uid)return;stop();if(!id)return;uid=id;const current=generation;const collection=firebase.firestore().collection('presence').doc(id).collection('sessions');ref=collection.doc(session);unsubscribe=collection.where('lastSeen','>',firebase.firestore.Timestamp.fromMillis(Date.now()-ttl)).onSnapshot({includeMetadataChanges:true},snapshot=>{if(current!==generation)return;if(snapshot.metadata.fromCache)return;rows=snapshot.docs.map(doc=>doc.data());update()},()=>{rows=[];paint(false)});send();heartbeat=setInterval(()=>send(),25000);refresh=setInterval(update,5000)}};
 window.addEventListener('offline',()=>paint(false));window.addEventListener('online',()=>send());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){send();update()}});
 window.addEventListener('pagehide',()=>{send(false);paint(false)});
 window.addEventListener('pageshow',event=>{if(event.persisted)send()});
})();