/* Organizador determinístico: usa somente os registros da conta, sem API de IA. */
(function(root){
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const ignored=new Set('me leve levar para pro pra o a os as de do da dos das em no na nos nas um uma que estou fazendo agora agr curso cursos aula aulas estudo estudos projeto projetos abrir abra ir quero continuar retomar onde parei meu minha meus minhas por favor buscar procure encontrar mostre mostrar liste listar ver e com sobre voce pode acessar andamento atual'.split(' '));
 const target=(kind,id)=>'espaco.html?'+new URLSearchParams({aba:kind==='project'?'portfolio':'studies',...(id?{[kind]:id}:{})}).toString();
 function answer(query,data={}){
  const q=normalize(query),tokens=q.split(' ').filter(w=>!ignored.has(w));
  if(/^(oi|ola|bom dia|boa tarde|boa noite|tudo bem)[ !]*$/.test(q))return {text:'Olá! Posso encontrar seus cursos, retomar estudos e abrir seus projetos. Experimente: “continuar meu curso de engenharia de software”.',actions:[]};
  const project=/\b(projeto|projetos|portfolio)\b/.test(q),course=/\b(curso|cursos|aula|aulas|estudo|estudos|estudar|continuar|retomar|parei)\b/.test(q);
  if(/\b(perfil|curriculo)\b/.test(q))return {text:'Seu perfil está no Meu espaço.',actions:[{label:'Abrir meu perfil →',href:'espaco.html?aba=portfolio#portfolio-preview'}]};
  if(!project&&!course&&/\b(meu espaco|ajuda|comandos)\b/.test(q))return {text:'Posso buscar cursos pelo nome, mostrar seus projetos ou retomar um estudo em andamento.',actions:[{label:'Abrir meus estudos →',href:target('course')},{label:'Abrir meus projetos →',href:target('project')}]};
  const kind=project?'project':'course',items=project?(data.projects||[]):(data.courses||[]);
  let search=tokens.filter(t=>!['portfolio','andamento','concluido','concluidos','finalizado','finalizados','planejado','planejados','quais','todos','todas','tenho','esta','esta','sendo'].includes(t));
  let ranked=items.map(item=>{const title=normalize(item.title),fields=normalize([item.title,item.topic,item.platform,item.tech,item.lesson].join(' '));const matched=search.filter(t=>fields.split(' ').some(w=>w===t||w.startsWith(t)&&t.length>=4)).length;return {item,matched,score:matched*10+(item.status==='active'?2:0)}}).filter(x=>!search.length||x.matched===search.length);
  const current=/\b(agora|agr|andamento|continuar|retomar|parei|atual|fazendo)\b/.test(q);
  if(current)ranked=ranked.filter(x=>x.item.status==='active');
  if(/\b(concluidos?|finalizados?)\b/.test(q))ranked=ranked.filter(x=>x.item.status==='done');
  if(/\b(planejados?)\b/.test(q))ranked=ranked.filter(x=>x.item.status==='planned');
  ranked.sort((a,b)=>b.score-a.score||(b.item.updatedAt||0)-(a.item.updatedAt||0));
  if(!project&&!course&&!search.length)return {text:'Diga qual curso ou projeto você quer encontrar. Exemplo: “abrir curso de engenharia de software”.',actions:[]};
  if(!ranked.length)return {text:items.length?'Não encontrei um '+(project?'projeto':'curso')+' correspondente. Tente usar o nome cadastrado no Meu espaço.':'Você ainda não tem '+(project?'projetos':'cursos')+' cadastrados no Meu espaço.',actions:[{label:'Abrir '+(project?'meus projetos':'meus estudos')+' →',href:target(kind)}]};
  if(current&&!search.length&&ranked.length>1)ranked=ranked.slice(0,1);
  const selected=ranked.slice(0,6);return {text:ranked.length===1?'Encontrei '+selected[0].item.title+'.'+(!project&&selected[0].item.lesson?' Você parou em: '+selected[0].item.lesson+'.':''):'Encontrei '+ranked.length+' opções. Qual você quer abrir?',actions:selected.map(({item})=>({label:'Abrir '+item.title+' →',href:target(kind,item.id)}))};
 }
 root.ClayOrganizer={answer,normalize};
})(typeof window==='undefined'?globalThis:window);
