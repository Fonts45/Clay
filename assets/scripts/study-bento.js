/* Gráficos e painéis derivados dos cursos reais, sem indicadores fictícios. */
(()=>{
 const root=document.querySelector('.study-bento');if(!root)return;
 root.querySelectorAll('.mb-steps li').forEach(row=>row.dataset.pending='');
 root.querySelector('[data-bento-portfolio]').onclick=()=>document.getElementById('tab-portfolio').click();
 document.addEventListener('clay:studies-update',event=>{
  const {courses,published,loading}=event.detail;
  const active=courses.filter(course=>course.status==='active').length;
  const done=courses.filter(course=>course.status==='done').length;
  const lessons=courses.reduce((sum,course)=>sum+(Number(course.completed)||0),0);
  const counts=[courses.length,active,lessons,done];
  ['total','active','lessons','done'].forEach((name,index)=>{
   document.getElementById('bento-step-'+name).textContent=loading?'—':counts[index];
   root.querySelectorAll('.mb-steps li')[index].toggleAttribute('data-pending',!counts[index]);
  });
  const recent=courses.slice(-7);
  const bars=Array.from(root.querySelectorAll('.mb-bars i'));
  const maximum=Math.max(1,...recent.map(course=>Number(course.completed)||0));
  bars.forEach((bar,index)=>{
   const value=Number(recent[index]?.completed)||0;
   bar.style.setProperty('--h',String(Math.max(.04,value/maximum)));
   bar.toggleAttribute('data-peak',value>0&&value===maximum);
  });
  const points=recent.length?recent.map((course,index)=>{
   const ratio=course.total?Math.min(1,Math.max(0,course.completed/course.total)):0;
   return [recent.length===1?160:index/(recent.length-1)*160,66-ratio*60];
  }):[[0,66],[160,66]];
  if(points.length===1)points.unshift([0,66]);
  const path=points.map(([x,y],index)=>(index?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ');
  root.querySelector('.mb-line').setAttribute('d',path);
  root.querySelector('.mb-area').setAttribute('d',path+' L160 72 L0 72 Z');
  const current=courses.filter(course=>course.status==='active').sort((a,b)=>b.updatedAt-a.updatedAt)[0];
  document.getElementById('bento-plan-title').textContent=current?.title||'Plano de estudos';
  const visibility=document.getElementById('bento-public-switch');
  visibility.toggleAttribute('data-off',!published);
  visibility.setAttribute('aria-label',published?'Portfólio público':'Portfólio privado');
  document.getElementById('bento-privacy-copy').textContent=loading?'Verificando sua conta…':published?'Estudos privados, portfólio público':'Estudos e portfólio privados';
 });
})();
