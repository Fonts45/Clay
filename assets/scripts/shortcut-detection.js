/* Identificação local: compara domínios completos, sem confiar em anúncios ou parâmetros. */
(()=>{
 const universities=[
  ['Estácio','estacio.br'],['Anhanguera','anhanguera.com'],['UNIP','unip.br'],['Uninter','uninter.com'],
  ['UniCesumar','unicesumar.edu.br'],['Uniasselvi','uniasselvi.com.br'],['UNINOVE','uninove.br'],
  ['Cruzeiro do Sul','cruzeirodosul.edu.br','cruzeirodosulvirtual.com.br'],['UNICSUL','unicsul.edu.br'],
  ['UNISA','unisa.br'],['UNIFRAN','unifran.edu.br'],['UNOPAR','unopar.com.br'],['UNIDERP','uniderp.com.br'],
  ['Pitágoras','pitagoras.com.br'],['UNIFACS','unifacs.br'],['UNIFOR','unifor.br'],['UNIFESP','unifesp.br'],
  ['USP','usp.br'],['UNICAMP','unicamp.br'],['UNESP','unesp.br'],['UFRJ','ufrj.br'],['UFMG','ufmg.br'],
  ['UFRGS','ufrgs.br'],['UFSC','ufsc.br'],['UFPR','ufpr.br'],['UFBA','ufba.br'],['UFPE','ufpe.br'],
  ['UFC','ufc.br'],['UFSCar','ufscar.br'],['UFABC','ufabc.edu.br'],['UnB','unb.br'],
  ['PUC-SP','pucsp.br'],['PUC-Rio','puc-rio.br'],['PUC Minas','pucminas.br'],['PUCRS','pucrs.br'],
  ['Mackenzie','mackenzie.br'],['FGV','fgv.br'],['Insper','insper.edu.br'],['ESPM','espm.br'],
  ['FIAP','fiap.com.br'],['Senac','sp.senac.br'],['Harvard','harvard.edu'],['MIT','mit.edu'],['Stanford','stanford.edu']
 ];
 const courses=[
  ['Alura','alura.com.br'],['Udemy','udemy.com'],['Coursera','coursera.org'],['edX','edx.org'],
  ['Udacity','udacity.com'],['Domestika','domestika.org'],['Hotmart','hotmart.com'],['DIO','dio.me'],
  ['Rocketseat','rocketseat.com.br','rocketseat.com'],['Origamid','origamid.com'],
  ['EBAC','ebaconline.com.br'],['Descomplica','descomplica.com.br'],['Gran Cursos','grancursosonline.com.br'],
  ['Estratégia Concursos','estrategiaconcursos.com.br'],['Skillshare','skillshare.com'],
  ['LinkedIn Learning','linkedin.com/learning'],['Pluralsight','pluralsight.com'],['DataCamp','datacamp.com'],
  ['Codecademy','codecademy.com'],['Khan Academy','khanacademy.org'],['Curso em Vídeo','cursoemvideo.com']
 ];
 const research=[['Wikipédia','wikipedia.org'],['Google Acadêmico','scholar.google.com','scholar.google.com.br'],['SciELO','scielo.br','scielo.org'],['Brasil Escola','brasilescola.uol.com.br'],['Toda Matéria','todamateria.com.br'],['MDN Web Docs','developer.mozilla.org'],['Stack Overflow','stackoverflow.com'],['YouTube','youtube.com','youtu.be']];
 function matches(url,domain){const [host,...path]=domain.split('/');return (url.hostname===host||url.hostname.endsWith('.'+host))&&(!path.length||url.pathname==='/'+path.join('/')||url.pathname.startsWith('/'+path.join('/')+'/'))}
 function titleFromFile(name){return name.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').trim().slice(0,100)}
 function detect({url='',fileName='',kind='link'}={}){
  let parsed;try{parsed=new URL(/^https?:\/\//i.test(url.trim())?url.trim():'https://'+url.trim());if(!['http:','https:'].includes(parsed.protocol))parsed=null}catch{}
  const activeFile=kind==='file'?fileName:'';
  let path='';try{path=parsed?decodeURIComponent(parsed.pathname):''}catch{path=parsed?.pathname||''}
  const pdf=kind==='file'?/\.pdf$/i.test(activeFile):parsed&&(/\.pdf$/i.test(path)||Array.from(parsed.searchParams.values()).some(value=>/\.pdf$/i.test(value)));
  let category='Curso',title='';
  const group=kind==='link'&&parsed&&[[universities,'Faculdade'],[courses,'Curso'],[research,'Pesquisa']].map(([items,category])=>{const found=items.find(item=>item.slice(1).some(domain=>matches(parsed,domain)));return found&&{category,title:found[0]}}).find(Boolean);
  if(group)({category,title}=group);
  else if(kind==='link'&&parsed){
   if(/\.edu(?:\.[a-z]{2})?$/.test(parsed.hostname))category='Faculdade';
   title=parsed.hostname.replace(/^www\./,'');
  }
  if(pdf){category='Documento';title=titleFromFile(activeFile||(/\.pdf$/i.test(path)?path.split('/').pop():Array.from(parsed.searchParams.values()).find(value=>/\.pdf$/i.test(value)))||'Documento')}
  else if(activeFile){category='Documento';title=titleFromFile(activeFile)}
  if(!activeFile&&!pdf&&parsed&&/\/(?:artigos?|articles?|papers?|research|pesquisa|publicacoes|blog|docs|documentation|wiki|journal)(?:[\/.-]|$)/i.test(path))category='Pesquisa';
  const description=title?({Faculdade:'Portal da instituição de ensino',Curso:'Cursos e aulas online',Pesquisa:kind==='file'?'Documento de consulta':'Conteúdo para consulta e pesquisa',Documento:'Documento para consulta'})[category]:'';
  return {category,title:title.slice(0,100),description};
 }

 const pageCache=new Map();
 async function inspect(input){
  const fallback=detect(input);if(input.kind==='file'||fallback.category==='Documento'||!input.url?.trim())return fallback;
  let url;try{url=new URL(/^https?:\/\//i.test(input.url)?input.url:'https://'+input.url);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return fallback}catch{return fallback}
  if(pageCache.has(url.href))return pageCache.get(url.href);
  try{
   const response=await fetch(url.href,{credentials:'omit',signal:AbortSignal.timeout(5000)});if(!response.ok)return fallback;
   const type=response.headers.get('content-type')||'';if(type.includes('application/pdf'))return {...fallback,category:'Documento',description:'Documento em PDF'};
   if(!type.includes('text/html'))return fallback;
   const reader=response.body.getReader(),decoder=new TextDecoder();let html='';try{while(html.length<250000){const chunk=await reader.read();if(chunk.done)break;html+=decoder.decode(chunk.value,{stream:true})}}finally{await reader.cancel()}
   const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script:not([type="application/ld+json"]),style,nav,footer').forEach(node=>node.remove());
   const title=(doc.querySelector('meta[property="og:title"]')?.content||doc.title||'').trim();
   const description=doc.querySelector('meta[name="description"]')?.content||'';
   const schema=Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).map(node=>node.textContent).join(' ');
   const text=(title+' '+description+' '+(doc.body?.textContent||'')).toLowerCase();
   let category=fallback.category;
   if(/ScholarlyArticle|NewsArticle|BlogPosting|TechArticle/.test(schema)||/\b(doi|resumo|abstract|referências bibliográficas)\b/i.test(text))category='Pesquisa';
   else if(/"@type"\s*:\s*"(?:Course|CourseInstance)"/.test(schema)||/\b(matricule|inscreva-se|comprar curso|carga horária|ementa|acessar curso)\b/i.test(text))category='Curso';
   else if(/CollegeOrUniversity/.test(schema)||/\b(faculdade|universidade|centro universitário)\b/.test(title.toLowerCase()+' '+description.toLowerCase()))category='Faculdade';
   else if(/Article/.test(schema)||/\b(documentação|enciclopédia|artigo científico)\b/.test(text))category='Pesquisa';
   const result={...fallback,category,title:(title||fallback.title).slice(0,100),description:({Documento:'Documento para consulta',Faculdade:'Portal da instituição de ensino',Pesquisa:'Conteúdo para consulta e pesquisa',Curso:'Cursos e aulas online'})[category]};pageCache.set(url.href,result);return result;
  }catch{return fallback}
 }
 globalThis.ClayShortcutDetection={detect,inspect};
})();
