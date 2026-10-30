# Identidade visual do Clay — padrão aprovado

Referência registrada em 30/10/2026. Preservar a implementação atual e estender seus padrões; não é uma autorização para alterar componentes existentes apenas para uniformizar números.

## Paleta

- Laranja principal: #FF5402. Cor de ações principais e destaques intencionais.
- Fundo Meu Espaço e perfil: #0C0B0D com radial-gradient(ellipse at 75% 0%, #251910 0, transparent 40%).
- Superfícies: #18161B; campos e menus em cinza neutro #282828. Não usar fundos ou focos azulados.
- Texto principal: #F5F3F7 / branco. Texto secundário: #A29EA9.
- Bordas sutis: #FFFFFF1A. Foco de campos: borda #FFFFFF40, sem anel azul.
- Elementos existentes com exceção explícita conservam sua cor: logo Google colorida; carregamento com degradê predominante #FC5503 e tons de laranja mais escuros.

## Tipografia e formas

- Inter para interfaces e campos. Space Grotesk para a frase da hero. Conservar as logos originais, sem substituições.
- Campos principais e botão Salvar: raio 12px; links sociais: 10px; biografia: 16px; menu da conta: 18px e opções internas: 12px.
- Manter outros raios específicos existentes: botões de entrada em pílula, cards arredondados. Não trocar tudo por um raio único.
- Composição limpa, espaçamento equilibrado, bordas finas, sem caixas ou fundos extras não solicitados.

## Interações

- Animações leves, fluidas, sem movimentos magnéticos ou balanço em Entrar/Cadastrar; apenas ampliação suave.
- Não adicionar borda laranja ao hover de Cadastrar ou dos cards de avatar.
- Card de avatar: leve ampliação; menu de três traços usa a imagem fornecida e amplia suavemente conforme última preferência.
- Edição do nome do avatar no próprio lugar: sem caixa ou linha visível, sem deslocar texto.
- Barras de rolagem discretas, arredondadas, fundo transparente, sem setas. Dentro de textareas: mais largas e recuadas, cursor de seta sobre a barra.
- Respeitar prefers-reduced-motion.

## Comportamentos e elementos preservados

- Foto personalizada do Clay tem prioridade sobre a do Google; não exibir a do Google enquanto o perfil carrega. Fallback Google somente sem foto personalizada.
- Barra superior aparece com o fade da página e a foto pronta. Carregamento: tela preta, apenas ícone central estável e degradê animado; saída em fade.
- Botão Salvar laranja, alinhado com campos, retorna ao local anterior após sucesso. Não mostrar textos de salvamento/sucesso em cima ou embaixo; erros continuam úteis.
- Card sem indicador Online/Offline.
- Editor do perfil: formulário e card próximos, centralizados lado a lado no desktop; card não fixo ao viewport nessa página. Preservar layout responsivo.
- As agendas e a antiga seção Compromissos e tarefas foram removidas. A lista SpringCheck atual é outro componente e deve ser preservada.

## Fontes da verdade no código

Consultar assets/styles/espaco.css, profile-editor.css, account-menu.css, avatar-editor.css, header-layout.css, loading.css e scrollbar.css, além de index.html. Preferir reaproveitar seletores e componentes a criar variações concorrentes. Ao alterar recursos, atualizar a versão de cache nos HTMLs relevantes. Validar estados normal, hover, foco e responsividade.
