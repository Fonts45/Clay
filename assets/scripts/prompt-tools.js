(()=>{
const add=document.getElementById('prompt-add'),files=document.getElementById('prompt-files'),list=document.getElementById('prompt-attachments'),mic=document.getElementById('prompt-mic'),input=document.getElementById('in'),status=document.getElementById('prompt-tool-status');if(!add)return;
function message(text){status.textContent=text;status.hidden=!text}
add.onclick=()=>files.click();let selected=[];
function render(){list.replaceChildren();selected.forEach((file,index)=>{const chip=document.createElement('div');chip.className='prompt-file-chip';const text=document.createElement('span');text.textContent=file.name;const remove=document.createElement('button');remove.textContent='×';remove.type='button';remove.setAttribute('aria-label','Remover '+file.name);remove.onclick=()=>{selected.splice(index,1);render();if(!selected.length)message('')};chip.append(text,remove);list.appendChild(chip)})}
files.onchange=()=>{selected=[...selected,...files.files].slice(0,5);files.value='';render();message('Arquivos selecionados para visualização. O envio de anexos à IA ainda não está disponível.')};

// VoicePill: tap to toggle, hold to dictate, drag left 64px to cancel.
mic.classList.add('voice-pill');
mic.insertAdjacentHTML('beforeend','<span class="voice-pill-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="voice-pill-time" aria-hidden="true">0:00</span><span class="voice-pill-cancel" aria-hidden="true">Cancelar</span>');
mic.setAttribute('aria-pressed','false');
mic.title='Clique para ditar ou segure; arraste para a esquerda para cancelar';
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!Speech){mic.disabled=true;mic.title='Ditado indisponível neste navegador';return}
const recognition=new Speech();recognition.lang='pt-BR';recognition.interimResults=false;
let recording=false,starting=false,cancelled=false,transcript='',startedAt=0,ticker,holdTimer,gesture=null,suppressClick=false,stopOnStart=false;
const time=mic.querySelector('.voice-pill-time');
function updateTime(){const seconds=Math.floor((performance.now()-startedAt)/1000);time.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}
async function start(){
 if(recording||starting)return;
 cancelled=false;transcript='';stopOnStart=false;starting=true;
 // Consulte a decisão atual; não salve concessões temporárias como permanentes.
 let permission=null;
 try{if(navigator.permissions?.query)permission=await navigator.permissions.query({name:'microphone'})}catch{}
 if(permission?.state==='denied'){
  starting=false;resetGesture();message('Microfone bloqueado. Para usar o ditado, altere a permissão nas configurações do navegador.');return;
 }
 if(stopOnStart||cancelled){starting=false;return}
 try{recognition.start()}catch{starting=false;message('Não foi possível iniciar o ditado.')}
}
function stop(cancel=false){if(!recording&&!starting)return;cancelled=cancel;stopOnStart=true;if(recording){if(cancel)recognition.abort();else recognition.stop()}}
function resetGesture(){clearTimeout(holdTimer);gesture=null;mic.classList.remove('is-pressed','is-cancelling');mic.style.removeProperty('--voice-drag')}
mic.addEventListener('pointerdown',e=>{
 if(e.button!==0||mic.disabled)return;
 suppressClick=false;gesture={id:e.pointerId,x:e.clientX,held:false,wasActive:recording||starting};mic.setPointerCapture(e.pointerId);mic.classList.add('is-pressed');
 if(!gesture.wasActive)holdTimer=setTimeout(()=>{if(gesture){gesture.held=true;start()}},300);
});
mic.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const distance=Math.max(0,gesture.x-e.clientX);mic.style.setProperty('--voice-drag',-Math.min(distance,8)+'px');mic.classList.toggle('is-cancelling',distance>=64)});
mic.addEventListener('pointerup',e=>{
 if(!gesture||gesture.id!==e.pointerId)return;
 const cancel=gesture.x-e.clientX>=64,held=gesture.held,wasActive=gesture.wasActive;suppressClick=true;
 resetGesture();if(mic.hasPointerCapture(e.pointerId))mic.releasePointerCapture(e.pointerId);
 if(cancel){stop(true);return}if(held||wasActive)stop();else start();
});
mic.addEventListener('pointercancel',()=>{resetGesture();stop(true)});
mic.addEventListener('lostpointercapture',()=>{if(gesture){resetGesture();stop(true)}});
mic.onclick=e=>{if(suppressClick&&e.detail!==0){suppressClick=false;return}if(recording||starting)stop();else start()};
mic.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();resetGesture();stop(true)}});
recognition.onstart=()=>{starting=false;recording=true;startedAt=performance.now();time.textContent='0:00';mic.setAttribute('aria-pressed','true');mic.setAttribute('aria-label','Parar ditado. Arraste para a esquerda para cancelar.');message('Ouvindo…');ticker=setInterval(updateTime,250);if(stopOnStart){if(cancelled)recognition.abort();else recognition.stop()}};
recognition.onresult=e=>{if(!cancelled)transcript=[...e.results].map(result=>result[0].transcript).join(' ')};
recognition.onerror=e=>{if(!cancelled&&e.error!=='aborted')message(e.error==='no-speech'?'Nenhuma fala detectada. Tente novamente.':'Não foi possível usar o microfone. Confira a permissão do navegador.')};
recognition.onend=()=>{
 clearInterval(ticker);recording=false;starting=false;stopOnStart=false;resetGesture();mic.setAttribute('aria-pressed','false');mic.setAttribute('aria-label','Ditar mensagem');
 if(!cancelled&&transcript){input.value+=(input.value?' ':'')+transcript;input.dispatchEvent(new Event('input',{bubbles:true}));message('')}
 else if(cancelled||status.textContent==='Ouvindo…')message('');transcript='';
};
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetGesture();stop(true)}});
new MutationObserver(()=>{if(!document.getElementById('app').classList.contains('o')){resetGesture();stop(true)}}).observe(document.getElementById('app'),{attributes:true,attributeFilter:['class']});
})();
