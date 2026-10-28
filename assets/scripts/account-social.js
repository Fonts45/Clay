(()=>{
 const buttons=[...document.querySelectorAll('[data-provider]')];
 function message(error){
  if(error.code==='auth/operation-not-allowed')return 'Este provedor ainda precisa ser ativado em Firebase → Authentication → Método de login.';
  if(error.code==='auth/unauthorized-domain')return 'Este endereço do site precisa ser autorizado no Firebase Authentication.';
  if(error.code==='auth/popup-blocked')return 'Permita a janela de login no navegador e tente novamente.';
  if(error.code==='auth/account-exists-with-different-credential')return 'Este e-mail já possui uma conta. Entre pelo método usado no cadastro.';
  if(error.code==='auth/popup-closed-by-user'||error.code==='auth/cancelled-popup-request')return '';
  return erroConta(error);
 }
 buttons.forEach(button=>button.addEventListener('click',async()=>{
  const status=document.getElementById('conta-status');
  if(!clienteConta){status.textContent='O acesso às contas ainda não está disponível. Tente novamente.';return}
  if(location.protocol==='file:'){status.textContent='Para entrar com estas contas, acesse o site publicado ou pelo localhost.';return}
  if(autenticandoConta)return;
  const key=button.dataset.provider;
  const provider=key==='google'?new firebase.auth.GoogleAuthProvider():key==='github'?new firebase.auth.GithubAuthProvider():new firebase.auth.OAuthProvider('apple.com');
  if(key==='google')provider.setCustomParameters({prompt:'select_account'});
  if(key==='apple'){provider.addScope('email');provider.addScope('name')}
  autenticandoConta=true;buttons.forEach(b=>b.disabled=true);document.getElementById('conta-enviar').disabled=true;document.getElementById('conta-alternar').disabled=true;
  status.textContent='Aguardando sua autenticação…';
  try{
   // Launch directly from the click so browsers allow the popup.
   const result=await clienteConta.signInWithPopup(provider);
   atualizarUsuario(result.user);document.getElementById('conta').close();
   if(new URLSearchParams(location.search).get('destino')==='ia')open();
   else location.href=new URLSearchParams(location.search).get('aba')==='perfil'?'perfil.html':'espaco.html';
  }catch(error){status.textContent=message(error)}
  finally{autenticandoConta=false;buttons.forEach(b=>b.disabled=false);document.getElementById('conta-enviar').disabled=false;document.getElementById('conta-alternar').disabled=false}
 }));
})();
