# Backend Task Manager

## Requisitos

- Node.js 20 ou superior.
- MySQL acessível pelo serviço.
- Em banco novo, execute `sql/schema.sql` com um usuário administrador. Em banco existente, execute `sql/upgrade_existing_email.sql` para ampliar a coluna de e-mail sem remover dados e `sql/feedback.sql` para acrescentar a tabela de mensagens. Faça backup e teste migrações no ambiente de homologação antes de produção. Nenhum SQL é executado automaticamente pela API.

## Configuração

Copie `.env.example` para `.env` e configure os dados do banco, uma chave JWT aleatória com pelo menos 32 caracteres e a origem pública exata do frontend em `CORS_ORIGIN`. Para gerar um segredo, use `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Não publique o `.env` nem reutilize a chave de desenvolvimento.

O usuário MySQL da aplicação deve ter somente as permissões necessárias sobre o banco da aplicação. Ative `DB_SSL=true` quando o provedor exigir TLS; use `DB_SSL_CA` se ele fornecer uma autoridade certificadora específica. Mantenha backups automáticos do banco.

## Executar e verificar

Na pasta `backend`:

```sh
npm ci
npm test
npm run check
npm start
```

`GET /health` responde `200` somente quando a API consegue consultar o MySQL. O serviço encerra o pool ao receber `SIGINT` ou `SIGTERM`. Configure o health check do provedor para essa rota.

## Publicação

Sirva a API atrás de um proxy HTTPS e configure nele o limite de tamanho das requisições e timeouts. Defina `PORT`, `NODE_ENV=production`, `CORS_ORIGIN` e as variáveis de banco e JWT no gerenciador de segredos da hospedagem. O CORS bloqueia origens que não estejam na lista.

O cadastro é público e não inclui confirmação de e-mail nem recuperação de senha. Antes de operar com usuários reais, decida se esses fluxos são requisitos do produto. Em produção, `CORS_ORIGIN` é obrigatório e deve listar a origem exata do frontend, mesmo quando frontend e API compartilham a origem.

Sirva o frontend e a API pela mesma origem com proxy reverso ou configure `window.TASK_MANAGER_API_URL` em `js/config.js` quando forem domínios separados. As páginas aplicam CSP; nesse caso, adicione somente a origem HTTPS da API a `connect-src` nas seis páginas HTML. No desenvolvimento, CORS fica aberto somente quando nenhuma origem foi configurada; configure uma allowlist para produção.

O frontend guarda o token em `sessionStorage` e obtém as tarefas da API. Dados antigos de tarefas são migrados por conta quando o titular faz login; tarefas locais inválidas são descartadas durante a migração. Faça os usuários antigos entrarem uma vez para migrar os próprios dados. Tokens e perfis antigos em `localStorage` são movidos para a sessão e removidos.

## Sugestões e contato

O envio autenticado grava a mensagem junto ao ID, nome e e-mail obtidos pelo servidor; o formulário não pede dados pessoais. A cópia de identificação fica retida na mensagem se a conta for removida, para preservar a autoria. Em banco já existente, aplique `sql/feedback.sql` antes de iniciar esse fluxo. Para consultar a inbox, gere e configure `FEEDBACK_ADMIN_TOKEN` com ao menos 32 caracteres no gerenciador de segredos e use `GET /feedback/inbox` com o cabeçalho `x-feedback-admin-token`. A consulta é limitada a 100 mensagens por chamada. O token de administração é separado do JWT dos usuários e nunca deve ser colocado no frontend.

Para enviar cópia por Gmail a `taskmanagercontato@gmail.com`, ative a verificação em duas etapas dessa conta, crie uma senha de app no Google e configure diretamente no `backend/.env`: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=taskmanagercontato@gmail.com` e `SMTP_APP_PASSWORD` com a senha de app. Não use a senha normal da conta Google nem compartilhe a senha de app no chat/Git. Sem SMTP configurado, a mensagem continua salva no banco e a interface informa que o e-mail não foi enviado; com SMTP configurado, ela só mostra confirmação de envio após o servidor aceitar a mensagem.