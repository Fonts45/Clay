(()=>{
const panel=document.getElementById('clay-branches');if(!panel)return;
document.body.classList.add('branch-visible');panel.inert=false;
panel.querySelectorAll('.branch-heading').forEach(button=>button.onclick=()=>{const group=button.closest('.branch-group'),open=group.classList.toggle('open');button.setAttribute('aria-expanded',String(open))});
panel.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{document.getElementById('tab-'+button.dataset.tab).click();panel.querySelectorAll('.branch-item').forEach(item=>{item.classList.remove('active');item.removeAttribute('aria-current')});button.classList.add('active');button.setAttribute('aria-current','page');let target=document.getElementById(button.dataset.scroll);if(!target||target.hidden)target=document.getElementById(button.dataset.tab);target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})});

function atualizarLinha(){
 panel.querySelectorAll('.branch-children').forEach(area=>{
  let line=area.querySelector('.branch-selection-line');if(!line){line=document.createElement('span');line.className='branch-selection-line';line.setAttribute('aria-hidden','true');area.appendChild(line)}
  const selected=area.querySelector('.branch-item.active');if(area.classList.contains('has-selection')!==!!selected)area.classList.toggle('has-selection',!!selected);
  if(selected)area.style.setProperty('--branch-selected-y',(selected.offsetTop-14)+'px');
 });
}
panel.addEventListener('click',event=>{if(event.target.closest('.branch-item,.branch-heading'))requestAnimationFrame(atualizarLinha)});
new ResizeObserver(atualizarLinha).observe(panel);
new MutationObserver(atualizarLinha).observe(panel,{attributes:true,subtree:true,attributeFilter:['class','hidden']});
atualizarLinha();

})();
