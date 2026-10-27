(() => {
  const owner = document.getElementById('owner-space');
  if (!owner) return;
  const icons = [
    '<path d="M4 10a3 3 0 0 1 1.2-2.4l5-3.7a3 3 0 0 1 3.6 0l5 3.7A3 3 0 0 1 20 10v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/>',
    '<circle cx="10.8" cy="10.8" r="7.3"/><path d="m16 16 5 5"/>',
    '<rect x="3" y="4" width="18" height="16" rx="5"/><path d="m4 6 6 4a4 4 0 0 0 4 0l6-4"/>',
    '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H7l-5 2 1.8-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 9h8M8 13h5"/>',
    '<path d="M9 18V5l11-3v13M9 9l11-3"/><ellipse cx="6" cy="18.5" rx="3" ry="3"/><ellipse cx="17" cy="15.5" rx="3" ry="3"/>',
    '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.4"/><path d="m4 19 7-8a3 3 0 0 1 4 0l6 5"/>',
    '<path d="m10 3-.7 3-2 .9-2.7-1L2.5 9.5l2 2v2l-2 2L4.6 19l2.7-1 2 .9.7 3h4l.7-3 2-.9 2.7 1 2.1-3.5-2-2v-2l2-2-2.1-3.6-2.7 1-2-.9L14 3Z"/><circle cx="12" cy="12.5" r="3.3"/>',
    '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>'
  ];
  const labels = ['Início', 'Buscar', 'Caixa de entrada', 'Clay AI', 'Música', 'Imagens', 'Configurações', 'Lixeira'];
  const anchor = document.createElement('div');
  anchor.className = 'space-dock-anchor';
  const dock = document.createElement('nav');
  dock.className = 'space-dock';
  dock.setAttribute('aria-label', 'Barra de tarefas do Meu Espaço');
  anchor.append(dock);
  // Dentro do espaço autenticado: acompanha a visibilidade e a sessão do proprietário.
  owner.append(anchor);
  const dialog = document.createElement('dialog');
  dialog.id = 'space-dock-dialog';
  dialog.setAttribute('aria-labelledby', 'space-dock-title');
  dialog.innerHTML = '<div class="dialog-heading"><h2 id="space-dock-title"></h2><button type="button" class="icon-button" aria-label="Fechar">×</button></div><div class="space-dock-panel"></div>';
  document.body.append(dialog);
  dialog.querySelector('button').onclick = () => dialog.close();
  let mediaURL;
  let lastButton;
  dialog.addEventListener('close', () => {
    dialog.querySelector('audio')?.pause();
    if (mediaURL) URL.revokeObjectURL(mediaURL);
    mediaURL = undefined;
    lastButton?.focus();
  });
  function openPanel(index, button) {
    lastButton = button;
    dialog.querySelector('h2').textContent = labels[index];
    const panel = dialog.querySelector('.space-dock-panel');
    panel.replaceChildren();
    if (index === 1) {
      dialog.querySelector('h2').textContent = 'Encontrar perfil';
      const form = document.createElement('form');
      const label = document.createElement('label');label.textContent = 'Nome de usuário';
      const input = document.createElement('input');input.name='handle';input.type='search';input.placeholder='@nome de usuário';input.required=true;input.maxLength=41;input.pattern='@?[a-z0-9_.-]{3,40}';input.autocapitalize='none';input.spellcheck=false;
      input.setAttribute('aria-label','Nome de usuário para buscar');
      input.addEventListener('input',()=>{input.value=input.value.toLowerCase()});
      const submit=document.createElement('button');submit.type='submit';submit.className='button primary';submit.textContent='Buscar perfil';
      label.append(input);form.append(label,submit);panel.append(form);
      form.onsubmit=event=>{event.preventDefault();const handle=input.value.trim().replace(/^@/,'').toLowerCase();const url=new URL('espaco.html',location.href);url.searchParams.set('usuario',handle);location.assign(url.href)};
    } else if (index === 4 || index === 5) {
      const label = document.createElement('label');
      label.textContent = index === 4 ? 'Ouvir um arquivo do seu dispositivo' : 'Visualizar uma imagem do seu dispositivo';
      const input = document.createElement('input'); input.type = 'file'; input.accept = index === 4 ? 'audio/*' : 'image/*';
      const preview = document.createElement('div');
      input.onchange = () => {
        preview.querySelector('audio')?.pause(); preview.replaceChildren();
        if (mediaURL) URL.revokeObjectURL(mediaURL);
        const file = input.files[0]; if (!file) return;
        mediaURL = URL.createObjectURL(file);
        const media = document.createElement(index === 4 ? 'audio' : 'img');
        if (index === 4) media.controls = true; else media.alt = file.name;
        media.src = mediaURL; preview.append(media);
      };
      label.append(input); panel.append(label, preview);
    } else if (index === 6) {
      const profile = document.createElement('button'); profile.className = 'button'; profile.textContent = 'Editar meu perfil';
      profile.onclick = () => { dialog.close(); document.getElementById('edit-profile')?.click(); };
      const theme = document.createElement('button'); theme.className = 'button'; theme.textContent = 'Alternar tema claro / escuro';
      theme.onclick = () => document.dispatchEvent(new CustomEvent('clay:theme-change', {detail: document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'}));
      panel.append(profile, theme);
    } else {
      const text = document.createElement('p'); text.className = 'muted';
      text.textContent = index === 2 ? 'A caixa de entrada ainda não está conectada a um serviço de mensagens.' : 'A recuperação de itens excluídos ainda não está disponível.';
      panel.append(text);
    }
    dialog.showModal();
  }
  labels.forEach((label, index) => {
    if (index === 3 || index === 4) return;
    const item = document.createElement(index === 0 || index === 3 ? 'a' : 'button');
    item.dataset.dockIndex = String(index); item.className = 'space-dock-item'; item.setAttribute('aria-label', label);
    if (item.tagName === 'A') {
      item.href = index === 0 ? 'espaco.html?aba=studies' : 'index.html?destino=ia';
      if(index===0)item.addEventListener('click',event=>{
        if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        event.preventDefault();
        document.getElementById('tab-studies')?.click();
        document.querySelectorAll('.organizer-target').forEach(target=>target.classList.remove('organizer-target'));
        const url=new URL(location.href);url.searchParams.set('aba','studies');url.searchParams.delete('course');url.searchParams.delete('project');url.hash='';history.replaceState(history.state,'',url);
        window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      });
    }
    else { item.type = 'button'; item.setAttribute('aria-haspopup', 'dialog'); item.onclick = () => openPanel(index, item); }
    item.innerHTML = '<span class="space-dock-tile"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons[index] + '</svg></span><span class="space-dock-label" aria-hidden="true">' + label + '</span>';
    dock.append(item);
  });
  // Badges são expostos apenas com contagens reais fornecidas pela aplicação.
  document.addEventListener('clay:dock-badges', event => {
    const counts = event.detail || {};
    [2, 3].forEach(index => {
      const button = dock.querySelector('[data-dock-index="' + index + '"]'); if (!button) return; button.querySelector('.space-dock-badge')?.remove();
      const count = counts[index === 2 ? 'inbox' : 'chat'];
      button.setAttribute('aria-label', labels[index]);
      if (!(count === true || Number(count) > 0)) return;
      const badge = document.createElement('span'); badge.className = 'space-dock-badge' + (count === true ? ' space-dock-badge--dot' : ''); badge.setAttribute('aria-hidden','true');
      badge.textContent = count === true ? '' : String(count);
      button.querySelector('.space-dock-tile').append(badge);
      button.setAttribute('aria-label', labels[index] + ', ' + (count === true ? 'novidade' : count + ' não lidas'));
    });
  });
  dock.addEventListener('keydown', event => {
    const items = Array.from(dock.children); const at = items.indexOf(document.activeElement);
    if (at < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (at + 1) % items.length;
    if (event.key === 'ArrowLeft') next = (at - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next !== undefined) { event.preventDefault(); items[next].focus(); }
  });
})();
