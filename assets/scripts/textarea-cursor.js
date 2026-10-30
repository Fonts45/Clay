(()=>{
 const update=event=>{const field=event.target;if(!(field instanceof HTMLTextAreaElement))return;const rect=field.getBoundingClientRect();const scrolling=field.scrollHeight>field.clientHeight;field.style.cursor=scrolling&&event.clientX>=rect.right-16?'default':'text'};
 document.addEventListener('pointermove',update,{passive:true});
 document.addEventListener('pointerout',event=>{if(event.target instanceof HTMLTextAreaElement)event.target.style.removeProperty('cursor')});
})();