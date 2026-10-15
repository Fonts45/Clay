# Clay

Site estático com login, espaço de estudos e portfólio profissional.

## Organização

- `index.html`: página inicial e formulários de cadastro e login.
- `espaco.html`: estudos privados e portfólio público por usuário.
- `assets/images/`: logos, ícones e imagens do site.
- `assets/scripts/`: JavaScript das interfaces e efeitos visuais.
- `assets/styles/`: folhas de estilo.
- `config/clay-config.js`: configuração pública do Firebase, carregada pelas páginas.
- `config/firestore.rules`: regras de acesso ao banco.
- `docs/`: instruções e licenças de componentes.
- `previews/`: capturas da interface com dados fictícios de teste; não são usadas pelo site.

## Executar e publicar

Sirva esta pasta por HTTP(S), mantendo a estrutura de `assets/` e `config/`. O ponto de entrada é `index.html`. As páginas usam Firebase e precisam de conexão à internet.

Para ativar a sincronização de estudos e os perfis públicos, consulte o [guia de configuração](docs/ESTUDOS-SETUP.md). As regras e capturas não precisam ser publicadas como arquivos do site.

## Organizador Clay AI

O chat encontra cursos e projetos cadastrados no Meu espaço por palavras-chave, sem API de IA ou chave OpenAI. Usa o login e o Firestore existentes. Consulte [o guia](docs/CLAY-AI-SETUP.md). Pode ser hospedado como site estático ou servido localmente com `node server.mjs`.
