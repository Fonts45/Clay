(()=>{
const root=document.documentElement;let theme='dark';try{theme=localStorage.getItem('clay-theme')==='light'?'light':'dark'}catch(e){}
function apply(value){theme=value;root.dataset.theme=value;document.querySelectorAll('.clay-theme-toggle').forEach(b=>{b.setAttribute('aria-label',value==='light'?'Ativar modo escuro':'Ativar modo claro');b.setAttribute('aria-pressed',String(value==='light'))});try{localStorage.setItem('clay-theme',value)}catch(e){}}
apply(theme);document.addEventListener('clay:theme-change',e=>{if(['light','dark'].includes(e.detail))apply(e.detail)});document.addEventListener('DOMContentLoaded',()=>{apply(theme);document.querySelectorAll('.clay-theme-toggle').forEach(b=>b.onclick=()=>apply(theme==='dark'?'light':'dark'))});window.addEventListener('storage',e=>{if(e.key==='clay-theme')apply(e.newValue==='light'?'light':'dark')});
})();
