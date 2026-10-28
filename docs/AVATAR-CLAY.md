# Avatar Clay Studio

## Histórico e recuperação da mesma foto

Ao clicar em Avatar, o editor abre as abas **Criar avatar** e **Meus avatares**. Quando já há uma imagem, o histórico é a aba inicial. O avatar atual é arquivado na conta antes de carregar os registros, e qualquer imagem antiga pode ser aplicada novamente. Trocar o avatar ativo não exclui os anteriores. O histórico carrega páginas de 20 itens.

O módulo `assets/scripts/avatar-history.js` mantém `STYLE`, uma configuração imutável e versionada com o prompt e a referência artística aprovados. Não se trata de memória do modelo: é uma regra persistente do projeto, usada em toda chamada ao futuro gerador.

O SHA-256 dos bytes da foto é o identificador privado da origem. Renomear ou copiar o mesmo arquivo não muda o identificador; recomprimir, editar ou reexportar pode mudá-lo. Antes de validar ou gerar novamente, o editor procura `learningSpaces/{uid}/avatars/{sourceHash}`. Se encontrar, usa exatamente a imagem armazenada. A foto de origem não é enviada ou armazenada por essa busca; apenas seu identificador é usado.

Cada registro contém `image` (imagem gerada em data URL até 300.000 caracteres, ou referência local ao avatar aprovado), `sourceHash`, `styleVersion` e `createdAt`. A transação cria somente se o documento não existir; mesmo chamadas concorrentes recuperam a primeira imagem canônica salva. O registro é imutável nas regras e privado à conta. Importações do avatar atual têm identificador derivado da imagem e `sourceHash` vazio, pois não é possível descobrir com segurança a foto original de um avatar antigo.

O editor possui um callback `generate(file, STYLE)` preparado para integração, mas nenhuma API de geração foi ativada. Quando a integração for autorizada, o resultado passa por `saveGenerated` antes de poder ser aplicado ao perfil. Falhas na consulta ao histórico interrompem o fluxo, evitando gerar outra imagem por engano. A aba de imagens antigas funciona independentemente de novas gerações assim que as permissões do banco forem publicadas.

**Ativação no banco:** publicar `config/firestore.rules`, incluindo o bloco privado `learningSpaces/{uid}/avatars/{avatarId}` e a validação atualizada de `profile.avatar`. As regras foram preparadas localmente; não há Firebase CLI autenticado neste ambiente e sua publicação não foi executada. Sem essa publicação, o site informa a falha de permissões e não afirma que salvou o histórico.

Atualização visual: o cartão usa agora o mesmo efeito Aurora da hero (`clay-aurora.js`), com a paleta #7A1600, #FF5402 e #FF9600 sobre #080808. As páginas Meu Espaço e Perfil reutilizam o script original, incluindo movimento reduzido e pausa quando oculto. O cartão não tem borda, contorno interno ou reflexo de moldura. Seus cantos continuam arredondados e a imagem preenche toda a área.

O retrato aprovado é apresentado por `assets/images/avatars/rodrigofontes-foreground.svg`, derivado da composição existente: somente o retângulo de fundo foi removido; o PNG incorporado e a máscara do rosto/cabelo foram preservados. Isso permite que a Aurora apareça atrás da pessoa. Avatares futuros devem ter fundo transparente para receber o mesmo efeito. As referências abaixo ao fundo sólido descrevem a versão anterior e a cor de apoio da prévia.

O cartão usa `profile.avatar`; a foto original continua em `profile.photo`. O botão sem círculo, com ícone arredondado e legenda Avatar, fica centralizado abaixo do cartão e pergunta **Deseja adicionar um avatar?**, ou **Deseja trocar seu avatar?** quando já existe um avatar. Confirmar abre o seletor de imagens do aparelho, sem permitir seleção múltipla. Aceita JPG, PNG e WebP de até 8 MB.

O ícone exato solicitado, `C1.pdf.png`, foi copiado para `assets/images/avatar-person-source.png`, mantendo seus pixels brancos e transparência. O CSS compensa as margens transparentes sem redesenhar o símbolo.

## Validação local da foto

`avatar-face-validation.js` usa `avatar-face-worker.js` para executar FaceDetector e ObjectDetector do MediaPipe no aparelho, fora da thread da interface. Bibliotecas e modelos públicos são baixados do jsDelivr e Google Storage; a imagem não é enviada para esses servidores. A versão do runtime está fixada em 0.10.32. A primeira verificação depende de conexão e suporte a Worker, WebAssembly e OffscreenCanvas.

A validação rejeita ausência de rosto, múltiplos rostos, múltiplas pessoas detectadas, rosto muito distante ou encostado nas bordas. Cada caso apresenta seu motivo. Falhas no carregamento dos modelos são informadas como falha de verificação, sem aprovar a imagem. Detecção probabilística pode errar e não comprova que todo o cabelo/cabeça está visível. A interface também orienta a escolher uma foto do peito para cima, com espaço acima do cabelo.

A foto validada aparece somente em uma prévia local e nunca é salva no campo `avatar` como se fosse uma imagem 3D gerada. O avatar atual é preservado. Fechar a janela libera a URL local da prévia. A criação automática permanece desativada enquanto a integração estiver pendente.

Enquadramento obrigatório para a futura geração: retrato vertical 2:3, do peito até a cabeça inteira, pessoa centralizada, ombros visíveis e margem acima do cabelo. Não recortar a cabeça. A prévia usa `object-fit: contain`. O cartão usa `object-fit: cover` e alinhamento ao topo para preencher toda a área até a base, sem faixa de fundo inferior.

Publique a versão atual de `config/firestore.rules` para permitir o novo campo `avatar`. A mudança mantém os demais campos e as permissões existentes.

## Avatar criado nesta conversa

Versão aprovada pelo usuário: o primeiro retrato 3D, com acabamento mais realista. A versão de cabeça mais arredondada em `previews/avatar-clay-rodrigo.png` foi substituída como referência artística pela imagem aprovada.

Arquivo final usado pelo cartão: `assets/images/avatars/rodrigofontes-orange-approved.png`. Fonte da composição: `assets/images/avatars/rodrigofontes-orange.svg`. O SVG preserva a imagem PNG original aprovada, sem redesenhar o rosto. Uma máscara de cor remove o verde na apresentação, e um retângulo sólido define o fundo exato #FF5402. A ferramenta integrada também foi usada para explorar a troca de fundo; a composição SVG foi escolhida para manter o retrato original e a cor exata. O cartão e o editor usam essa imagem como padrão de `@rodrigofontes` quando a conta ainda não tem outro avatar salvo. Outras contas não recebem o retrato de Rodrigo.

## Direção visual e prompt final

Use the approved Clay avatar portrait as the exact artistic style reference. Preserve the person's recognizable identity, facial proportions, age, skin tone, eye color, hair texture, eyebrow shape and personal accessories. The art direction is a polished, semi-realistic stylized 3D portrait with natural facial proportions, sculpted wavy hair retaining fine strand detail, subtle skin texture, expressive realistic eyes and soft cinematic lighting. Do not switch to a simplified round designer toy or exaggerated cartoon. Center the chest-up portrait, with neutral relaxed expression and a plain black crewneck shirt. Preserve the person rather than copying accessories or facial hair from a different person. For the approved Rodrigo portrait, modify only the background; do not redesign the face or character. Standard background for EVERY avatar: a uniform solid Clay orange #FF5402 (RGB 255, 84, 2), no gradients, no vignette, no background texture, no text or branding. For a transparent avatar, the site composites the portrait over #FF5402.

O fundo do cartão, da prévia e da composição de imagens transparentes usa a constante `BACKGROUND_COLOR='#ff5402'` do editor. Uma imagem opaca deve ser exportada com o fundo laranja; mudar apenas a cor CSS não recorta o fundo de uma imagem opaca.

## Geração automática pendente

A revisão automática bloqueou a integração de uma API que enviaria fotos de rosto dos usuários à OpenAI. O usuário precisa autorizar explicitamente esse envio e destino antes de implementar a integração. Nenhum endpoint de envio de fotos foi instalado. Também será necessária uma credencial de API no servidor; nenhuma chave deve ser colocada em código público.
