# Clay AI — organizador do Meu espaço

O Clay AI interpreta comandos por regras e palavras-chave. Não usa OpenAI, não exige chave nem créditos de API de IA. O Firebase existente continua necessário para login e leitura dos registros privados; a disponibilidade e os custos do Firebase seguem o plano do projeto.

Exemplos:

- “Me leve para o curso de engenharia de software que estou fazendo agr.”
- “Continuar meu curso de engenharia de software.”
- “Onde parei?” — mostra o estudo ativo mais recentemente atualizado.
- “Meus cursos concluídos.”
- “Abrir projeto React.”
- “Abrir meu perfil.”

A busca ignora maiúsculas e acentos, compara o nome, assunto, plataforma, aula atual e tecnologias. Nomes semelhantes geram opções; itens inexistentes não são inventados. Os botões levam à aba correta do Meu espaço e destacam o registro encontrado. Os comandos navegam; não alteram nem excluem registros automaticamente.

Os dados são lidos de `learningSpaces/{uid}` com o login Firebase do próprio usuário e as regras existentes. Uma falha de conexão não é apresentada como lista vazia. O histórico do chat fica somente em memória e é limpo ao recarregar ou trocar de conta. Não há compreensão geral como no ChatGPT, pesquisa na web ou análise de anexos.

## Executar

Sirva a pasta por HTTP(S) em uma hospedagem estática. Para desenvolvimento com Node.js 22+:

```powershell
node server.mjs
```

Abra http://localhost:3000/index.html?destino=ia. O domínio precisa estar autorizado no Firebase Authentication e o Firestore deve usar as regras do projeto. Não há pacotes adicionais para instalar. A antiga rota `/api/chat` e a dependência de OpenAI foram removidas; não é necessário configurar `.env`.

## Testes

```powershell
node --test tests/chat.test.mjs
```

Cobrem comandos naturais, acentos, ambiguidades, itens inexistentes, retomada, projetos e codificação dos links. A leitura dos dados reais depende de uma conta conectada com acesso ao Firestore.
