# Bot de Missões do Discord

Bot Discord para criar, listar, desativar e concluir missões com provas em imagem.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplica o schema Drizzle ao PostgreSQL configurado
- Required env: `DATABASE_URL` — string de conexão do PostgreSQL
- Discord: `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID` e `DISCORD_GUILD_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/commands/` — comandos slash do Discord
- `lib/db/src/schema/` — schema fonte das tabelas do banco
- `lib/api-spec/` — contrato OpenAPI da API HTTP

### Tabelas do banco

- `missions` — missões criadas pelos moderadores
- `completions` — provas de conclusão enviadas pelos membros
- `guild_config` — canal de conclusões configurado por servidor

## Architecture decisions

- O processo pode rodar como Web Service com HTTP ou como Background Worker do Render; sem `PORT`, ele funciona somente como worker do Discord.
- Em produção, uma falha ao conectar o bot encerra o processo para que o Render reinicie e exiba o erro real.
- Missões são desativadas com `is_active = false` em vez de apagadas, preservando o histórico de conclusões.
- O banco é sincronizado pelo schema Drizzle com `pnpm --filter @workspace/db run push`.

## Product

- Moderadores criam e desativam missões.
- Membros visualizam missões ativas e enviam uma imagem como prova.
- Conclusões podem ser publicadas automaticamente em um canal configurado do servidor.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- O `DATABASE_URL` precisa apontar para o mesmo PostgreSQL usado pelo bot hospedado no Render antes de executar o comando `push`.
- O bot precisa ter acesso ao servidor e ao canal configurado para publicar conclusões.
- Para manter o bot sempre online no Render, prefira um Background Worker; Web Services gratuitos podem dormir sem tráfego HTTP.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
