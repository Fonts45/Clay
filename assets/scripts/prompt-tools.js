(()=>{
const add=document.getElementById('prompt-add'),files=document.getElementById('prompt-files'),list=document.getElementById('prompt-attachments'),mic=document.getElementById('prompt-mic'),input=document.getElementById('in'),status=document.getElementById('prompt-tool-status');if(!add)return;
function message(text){status.textContent=text;status.hidden=!text}
add.onclick=()=>files.click();let selected=[];
function render(){list.replaceChildren();selected.forEach((file,index)=>{const chip=document.createElement('div');chip.className='prompt-file-chip';const text=document.createElement('span');text.textContent=file.name;const remove=document.createElement('button');remove.textContent='×';remove.type='button';remove.setAttribute('aria-label','Remover '+file.name);remove.onclick=()=>{selected.splice(index,1);render();if(!selected.length)message('')};chip.append(text,remove);list.appendChild(chip)})}
files.onchange=()=>{selected=[...selected,...files.files].slice(0,5);files.value='';render();message('Arquivos selecionados para visualização. A IA em demonstração ainda não recebe nem analisa anexos.')};

const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!Speech){mic.disabled=true;mic.title='Ditado indisponível neste navegador';return}
const recognition=new Speech();recognition.lang='pt-BR';recognition.interimResults=false;let recording=false;
mic.onclick=()=>{if(recording){recognition.stop();return}try{recognition.start()}catch(e){message('Não foi possível iniciar o ditado.')}};
recognition.onstart=()=>{recording=true;mic.setAttribute('aria-pressed','true');mic.setAttribute('aria-label','Parar ditado');message('Ouvindo…')};
recognition.onresult=e=>{const text=[...e.results].map(result=>result[0].transcript).join(' ');input.value+=(input.value?' ':'')+text;input.dispatchEvent(new Event('input',{bubbles:true}));message('Texto inserido. Confira antes de enviar.')};
recognition.onerror=()=>message('Não foi possível usar o microfone. Confira a permissão do navegador.');
recognition.onend=()=>{recording=false;mic.setAttribute('aria-pressed','false');mic.setAttribute('aria-label','Ditar mensagem')};
})();