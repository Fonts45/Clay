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
  let category='Pesquisa',title='';
  const group=kind==='link'&&parsed&&[[universities,'Faculdade'],[courses,'Curso'],[research,'Pesquisa']].map(([items,category])=>{const found=items.find(item=>item.slice(1).some(domain=>matches(parsed,domain)));return found&&{category,title:found[0]}}).find(Boolean);
  if(group)({category,title}=group);
  else if(kind==='link'&&parsed){
   if(/\.edu(?:\.[a-z]{2})?$/.test(parsed.hostname))category='Faculdade';
   title=parsed.hostname.replace(/^www\./,'');
  }
  if(pdf){category='Livro';title=titleFromFile(activeFile||(/\.pdf$/i.test(path)?path.split('/').pop():Array.from(parsed.searchParams.values()).find(value=>/\.pdf$/i.test(value)))||'Livro')}
  else if(activeFile)title=titleFromFile(activeFile);
  const description=title?({Faculdade:'Portal da instituição de ensino',Curso:'Cursos e aulas online',Pesquisa:kind==='file'?'Documento de consulta':'Conteúdo para consulta e pesquisa',Livro:'Leitura em PDF'})[category]:'';
  return {category,title:title.slice(0,100),description};
 }
 globalThis.ClayShortcutDetection={detect};
})();
