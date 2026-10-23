(() => {
 const key='clay-profile-return',pending='clay-profile-restore';
 function read(){try{return JSON.parse(sessionStorage.getItem(key))}catch{return null}}
 function remember(){
  if(location.pathname.endsWith('/perfil.html'))return;
  const url=new URL(location.href);
  const portfolio=document.getElementById('portfolio');
  const tab=portfolio&&!portfolio.hidden?'portfolio':'studies';
  if(location.pathname.endsWith('/espaco.html'))url.searchParams.set('aba',tab);
  try{sessionStorage.setItem(key,JSON.stringify({url:url.href,y:scrollY,tab,time:Date.now()}))}catch{}
 }
 document.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const target=event.target.closest('a,button');if(!target)return;
  if(target.id==='edit-profile'||target.id==='card-edit')remember();
  if(target.tagName==='A'){const url=new URL(target.href,location.href);if(url.origin===location.origin&&url.pathname.endsWith('/perfil.html'))remember()}
 },true);
 window.clayRememberProfileOrigin=remember;
 window.clayReturnFromProfile=inline=>{
  const record=read();let url;
  try{url=new URL(record?.url);if(url.origin!==location.origin||Date.now()-record.time>86400000)url=null}catch{}
  if(inline){inline(record?.tab==='portfolio'?1:0);if(url)history.replaceState(null,'',url.href);requestAnimationFrame(()=>window.scrollTo({top:record?.y||0,behavior:'instant'}));return}
  if(!url){location.assign('espaco.html');return}
  try{sessionStorage.setItem(pending,JSON.stringify(record))}catch{}
  location.assign(url.href);
 };
 let restore;try{restore=JSON.parse(sessionStorage.getItem(pending))}catch{}
 if(!restore||restore.url!==location.href)return;
 sessionStorage.removeItem(pending);
 let timer;
 const observer=new MutationObserver(apply);
 function apply(){
  const owner=document.getElementById('owner-space');
  if(owner&&(owner.hidden||owner.getAttribute('aria-busy')==='true'))return;
  const tab=document.getElementById('tab-'+restore.tab);if(tab)tab.click();
  if(document.documentElement.scrollHeight-innerHeight<restore.y)return;
  window.scrollTo({top:restore.y,behavior:'instant'});observer.disconnect();clearTimeout(timer);
 }
 addEventListener('load',()=>{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','aria-busy']});apply();timer=setTimeout(()=>observer.disconnect(),15000)},{once:true});
})();