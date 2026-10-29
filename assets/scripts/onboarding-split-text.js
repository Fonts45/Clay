/* SplitText rise/lift adapted for the site's native HTML from the supplied React Bits reference.
 * Attribution: David Haz, React Bits. See ../../docs/licenses/react-bits-license.txt.
 */
(()=>{
 'use strict';
 const pending=new WeakMap();
 const transitions=new WeakSet();
 function cancel(root){pending.get(root)?.();pending.delete(root)}
 async function transition(root,swap,canCommit=()=>true){
  if(transitions.has(root))return false;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches||typeof root.animate!=='function'){
   if(!canCommit())return false;swap();return true;
  }
  transitions.add(root);let outgoing,incoming;
  try{
   const previousHeight=root.getBoundingClientRect().height;
   outgoing=root.animate([{opacity:1},{opacity:0}],{duration:120,easing:'ease-out',fill:'forwards'});
   await outgoing.finished;
   if(!root.isConnected||!canCommit())return false;
   swap();
   const nextHeight=root.getBoundingClientRect().height;
   incoming=root.animate([{opacity:0,height:previousHeight+'px'},{opacity:1,height:nextHeight+'px'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
   outgoing.cancel();
   await incoming.finished;return true;
  }catch{return false}
  finally{outgoing?.cancel();incoming?.cancel();transitions.delete(root)}
 }
 const graphemes=text=>typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('pt-BR',{granularity:'grapheme'}).segment(text),part=>part.segment):Array.from(text);
 function reveal(root){
  pending.get(root)?.();
  if(matchMedia('(prefers-reduced-motion:reduce)').matches||typeof root.animate!=='function')return;
  const animations=[];let stopped=false;
  const frame=requestAnimationFrame(()=>{
   if(stopped||!root.isConnected)return;
   root.querySelectorAll('h2,p').forEach((element,index)=>{
    const text=element.textContent;
    const accessible=document.createElement('span');accessible.className='clay-split-accessible';accessible.textContent=text;
    const visual=document.createElement('span');visual.className='clay-split-visual';visual.setAttribute('aria-hidden','true');
    const pieces=[];
    for(const word of text.split(/(\s+)/u)){
     if(!word)continue;
     if(/^\s+$/u.test(word)){visual.append(document.createTextNode(word));continue}
     const group=document.createElement('span');group.className='clay-split-word';
     for(const character of index===0?graphemes(word):[word]){
      const piece=document.createElement('span');piece.className='clay-split-piece';piece.textContent=character;group.append(piece);pieces.push(piece);
     }
     visual.append(group);
    }
    element.replaceChildren(accessible,visual);
    pieces.forEach((piece,i)=>{
     const animation=piece.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'translateY(0)'}],{duration:index===0?1250:850,delay:(index===0?0:180)+i*(index===0?50:40),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
     animations.push(animation);
     animation.finished.then(()=>{if(!stopped)piece.classList.add('clay-split-settled')}).catch(()=>{});
    });
   });
  });
  pending.set(root,()=>{stopped=true;cancelAnimationFrame(frame);animations.forEach(animation=>animation.cancel())});
 }
 globalThis.ClayOnboardingText={reveal,graphemes,cancel,transition};
})();
