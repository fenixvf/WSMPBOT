# Requisitos do projeto

Este projeto é um workspace TypeScript/Node.js. As dependências instaláveis
ficam definidas nos arquivos `package.json` e fixadas pelo `pnpm-lock.yaml`.

## Ambiente

- Node.js 24
- pnpm
- PostgreSQL ou outro banco compatível com `node-postgres`

## Instalação

```bash
pnpm install
```

## Variáveis de ambiente

Configure as seguintes variáveis antes de executar o servidor:

- `DATABASE_URL` — string de conexão com o PostgreSQL
- `PORT` — porta HTTP positiva em que o servidor deve escutar

### Bot do Discord (opcional)

O servidor HTTP continua disponível sem o bot. Para habilitar a integração do
Discord e registrar os comandos, configure todas as variáveis abaixo:

- `DISCORD_BOT_TOKEN` — token do bot
- `DISCORD_CLIENT_ID` — ID da aplicação Discord
- `DISCORD_GUILD_ID` — ID do servidor onde os comandos serão registrados

## Comandos principais

```bash
pnpm run typecheck
PORT=5173 BASE_PATH=/ pnpm run build
PORT=5000 pnpm --filter @workspace/api-server run dev
```

O `BASE_PATH` só é necessário para compilar o `mockup-sandbox`. No Render,
use `BASE_PATH=/` se decidir publicar esse preview como um site estático.

## Publicação no Render

Para publicar a API como um Web Service:

- **Build Command:** `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build`
- **Start Command:** `pnpm --filter @workspace/api-server run start`
- **Health Check Path:** `/api/healthz`
- **Environment:** `NODE_ENV=production`, `DATABASE_URL` e `PORT` (o Render normalmente fornece `PORT` automaticamente)

Se o bot do Discord for usado, adicione também `DISCORD_BOT_TOKEN`,
`DISCORD_CLIENT_ID` e `DISCORD_GUILD_ID` como variáveis secretas no Render.