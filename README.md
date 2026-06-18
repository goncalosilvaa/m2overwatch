# M2Overwatch — SaaS (Next.js + TypeScript + Prisma)

Plataforma **multi-tenant** de anti-cheat para Metin2: site comercial + painel central
+ API de ingestao. Cada servidor de jogo cliente reporta deteções com a sua **API key**;
cada cliente vê **só o seu servidor**; o **ADMIN** gere a plataforma toda.

```
servidor de jogo  ──(agente le bot_suspicion_log)──>  POST /api/ingest (x-api-key)  ──>  Postgres (Neon)  ──>  Painel
```

## Níveis de acesso
- **ADMIN** — vê todos os servidores, gere servidores (`/servers`) e utilizadores (`/users`).
- **CLIENT** — login próprio; vê e gere apenas o **servidor que lhe foi atribuído**
  (deteções, analytics, bans e listas só do seu servidor).

## Páginas
- `/` — site comercial (PT/EN). `/login` — entrada.
- `/dashboard` — deteções (stats, gráfico, filtros, stream ao vivo, export CSV/JSON, ações Ban/WL/BL).
- `/analytics` — tendências (14 dias), severidade, top jogadores, hacks mais frequentes.
- `/bans` — bans manuais. `/lists` — whitelist/blacklist.
- `/servers` *(admin)* — tenants + API keys. `/users` *(admin)* — contas e papéis.
- `/api/ingest` — ingestão (auth por `x-api-key`). `/api/export` — CSV/JSON (com sessão, por tenant).

## Auth
Login **na base de dados** com password em **hash scrypt** (nativo do Node, sem dependências).
No **1.º login**, se a DB ainda não tiver utilizadores, é criado o admin a partir de
`ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env` (bootstrap). Depois cria-se tudo em `/users`.

## Setup (local)
```bash
# 1. .env  (Windows: copy .env.example .env) -> preenche DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
cp .env.example .env

# 2. Instalar + criar/atualizar tabelas (regenera o Prisma Client)
npm install
npm run db:push

# 3. Arrancar -> http://localhost:3000
npm run dev
```
> O **schema mudou** (User com papéis, Listing, campos do Ban). Tens de correr `npm run db:push`.
> Isto também **regenera o Prisma Client** (necessário após as alterações).
> O `.env` só é lido no arranque — se o editares, reinicia o `npm run dev`.

Criar admin/utilizadores pela linha de comandos (alternativa ao `/users`):
```bash
npm run admin:create -- admin@dominio.com password ADMIN
npm run admin:create -- cliente@dominio.com password CLIENT <serverId>
```

## Ligar um servidor de jogo ao painel
1. `/servers` → cria o servidor → copia a **API key**.
2. `/users` → cria a conta do cliente (CLIENT) e atribui-lhe esse servidor.
3. No servidor de jogo, corre o **agente** (`agent/`): lê a `bot_suspicion_log` (MySQL) e faz
   POST a `/api/ingest` com a key. Ver `agent/README.md`.

Teste rápido de ingestão:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "x-api-key: A_TUA_API_KEY" -H "content-type: application/json" \
  -d '{"player":"BotZe","reason":"SPEEDHACK","score":130,"detail":"...","sessionSeconds":1800}'
```

## Produção (Vercel + Neon)
Ver **`DEPLOY.md`**. Resumo: `db push` para a Neon → push do repo → importar na Vercel →
env vars (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) → 1.º login cria o admin.

## Segurança
- Passwords em hash scrypt; sessão por cookie httpOnly assinado (jose), `Secure` em produção.
- Acesso por papel: `/servers` e `/users` só ADMIN; dados filtrados por tenant em todas as páginas e no export.
- Headers de segurança no `next.config.mjs`. `.env` no `.gitignore`.
