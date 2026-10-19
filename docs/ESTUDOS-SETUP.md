# Estudos e portfólio no Clay

O novo espaço está em `espaco.html`. O login usa o mesmo projeto Firebase do Clay. Não há salvamento em localStorage: os dados pertencem ao UID da conta no Firestore.

Cadastro e login redirecionam para `espaco.html`. A opção Manter conectado usa persistência LOCAL do Firebase quando marcada e SESSION quando desmarcada. Nenhuma senha é gravada pelo código do Clay. Com uma sessão válida, entrar na página inicial restaura o acesso e abre o espaço automaticamente; `index.html?inicio=1` permite visitar a página inicial sem esse redirecionamento. O botão Sair encerra a sessão no Firebase.

## Ativação necessária no Firebase

1. Abra o projeto `clay-a9c78` no Console Firebase e ative Cloud Firestore, se ainda não estiver ativo.
2. Em Firestore → Regras, aplique as regras de `config/firestore.rules`. Se já houver regras de outras funcionalidades, integre os dois novos blocos (`learningSpaces` e `publicPortfolios`) sem apagar as regras existentes. Remova qualquer regra global permissiva que também conceda acesso aos estudos: permissões de blocos sobrepostos se somam.
3. Publique `espaco.html` e os arquivos `assets/styles/espaco.css` e `assets/scripts/espaco.js` junto com o `index.html` atualizado e a configuração existente. Sirva por HTTP(S), no mesmo domínio do login. Confirme que o domínio está autorizado no Firebase Authentication.
4. Teste com duas contas: cada uma deve ver só seus cursos. Sem login, `/espaco.html?perfil=UID` deve mostrar apenas um portfólio publicado. Retirar do público deve tornar o documento indisponível.

## Modelo de dados

- `learningSpaces/{uid}`: perfil editável, cursos, progresso, aula atual, links, notas e projetos. Somente o dono pode ler ou escrever. Listagem negada.
- `publicPortfolios/{uid}`: cópia publicada do perfil, projetos e resumo dos cursos que o usuário optou por incluir. Leitura individual pública; escrita restrita ao dono. Não inclui plataforma, aula, link da aula, progresso ou notas.
- Publicação e alterações posteriores usam um batch para sincronizar os dois documentos. Retirar do público exclui a cópia pública. Retirada não revoga cópias que visitantes já tenham feito.
- Nenhum dado foi publicado durante a implementação. O usuário publica na interface, com o botão Publicar perfil.

Os links de aulas são preenchidos pelo usuário. Detectar a posição automaticamente em plataformas externas exigiria integrações específicas. Currículo, GitHub e LinkedIn são links informados pelo usuário; arquivos de currículo devem estar disponíveis no destino escolhido.

## Navegação

A opção Perfil do menu abre `perfil.html`, uma página dedicada à criação e edição do perfil, com os estudos e o menu lateral ocultos. Ela reutiliza a estrutura de `espaco.html` e o controlador `assets/scripts/espaco.js`; ao alterar a estrutura compartilhada, mantenha os elementos necessários nas duas páginas. O editor abre durante o carregamento, com Salvar desabilitado até a sincronização. Ela reúne nome de usuário, nome, título, foto, formações, estudos atuais e carreiras de interesse. Os cursos ativos são exibidos como referência. O e-mail vem da conta autenticada, é somente leitura e não é copiado para o portfólio público. O nome de usuário é um nome de exibição, sem reserva de exclusividade. Salvar atualiza o mesmo perfil utilizado pelo card profissional.

Para salvar os novos campos (`username`, `education`, `currentStudies`, `careers`, `pronouns`, `website`, `social3`, `social4` e `company`), publique a versão atualizada de `config/firestore.rules` no Firebase. Os campos são opcionais nas regras para manter a compatibilidade com perfis anteriores.

O e-mail de acesso é alterado pelo botão “Confirmar novo e-mail”, com `verifyBeforeUpdateEmail` do Firebase Auth. A troca só termina após a confirmação pelo link recebido no novo endereço. O e-mail não é incluído no perfil público nem salvo como um campo do Firestore. Se o Firebase solicitar uma sessão recente, entre novamente antes de repetir a troca.

O projeto é HTML/JS estático. A navegação reproduz o comportamento de duas abas e partículas inspirado no exemplo GooeyNav sem adicionar React. Suporta teclado, foco visível e movimento reduzido.
