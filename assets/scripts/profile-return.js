(()=>{
 const key='clay-profile-origin-v2',pending='clay-profile-return-v2';
 document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const target=new URL(link.href,location.href);if(target.pathname.endsWith('/perfil.html')&&!location.pathname.endsWith('/perfil.html'))try{sessionStorage.setItem(key,JSON.stringify({url:location.href,y:scrollY}))}catch{}},true);
 window.clayReturnFromProfile=()=>{let origin;try{origin=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}if(origin){try{const url=new URL(origin.url);if(url.origin===location.origin&&!url.pathname.endsWith('/perfil.html')){sessionStorage.setItem(pending,JSON.stringify(origin));location.href=url.href;return}}catch{}}location.href='espaco.html'};
 let origin;try{origin=JSON.parse(sessionStorage.getItem(pending)||'null')}catch{}
 if(!origin||location.pathname.endsWith('/perfil.html'))return;
 let attempts=0;const timer=setInterval(()=>{if(++attempts>100){clearInterval(timer);return}const layer=document.querySelector('.clay-loading-layer');if(document.readyState!=='complete'||document.documentElement.classList.contains('clay-content-loading')||(layer&&!layer.hidden))return;clearInterval(timer);sessionStorage.removeItem(pending);requestAnimationFrame(()=>{const root=document.documentElement,previous=root.style.scrollBehavior;root.style.scrollBehavior='auto';scrollTo(0,Number(origin.y)||0);root.style.scrollBehavior=previous})},100);
})();
