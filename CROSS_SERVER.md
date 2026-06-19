# Cruzamento entre servidores (Cross-Server Intelligence)

Quando um jogador **banido** num servidor aparece (deteção ou login) noutro servidor que use o M2Overwatch, o painel gera um **alerta** em `/alerts`. Match por **IP, nome, conta ou email**.

## O que foi adicionado
- **Schema**: `email` em `Detection` e `Ban`; novo modelo `CrossAlert`; índices por `ip`/`account`/`email`.
- **Motor** (`lib/cross.ts`): `checkCrossServerSeen` (identidade vista → procura bans noutros servidores) e `checkCrossServerOnBan` (ao criar um ban, procura deteções recentes da mesma identidade noutros servidores).
- **Gatilhos**:
  - `POST /api/ingest` — cada deteção cruza automaticamente.
  - `POST /api/event` — **novo**: logins/registos cruzam sem criar deteção.
  - Criar ban no painel — cruzamento retroativo (últimos 30 dias).
- **Página** `/alerts` — lista os alertas (com "marcar visto"); link no nav; contagem de "por rever".
- Scoping: ADMIN vê tudo; CLIENT vê alertas onde o **seu** servidor viu o jogador ou tem o ban.

## Passos de deploy (obrigatório)
O schema mudou, por isso:
```bash
cd m2overwatch-saas
npm run db:push      # cria coluna email + tabela CrossAlert + índices, e regenera o Prisma Client
```
Depois faz redeploy na Vercel (o build corre `prisma generate`).

## Endpoint de login/registo (gatilho no login)
Para avisar **logo no login/registo** (não só em deteções), o servidor de jogo deve enviar um evento por jogador que entra. Mesmo `x-api-key` do ingest:
```
POST https://<painel>/api/event
Headers: x-api-key: <key do servidor>, content-type: application/json
Body: { "type": "login", "player": "Nick", "account": "login123", "ip": "1.2.3.4", "email": "x@y.com" }
```
Resposta: `{ ok: true, crossAlerts: N }`. (Qualquer um dos campos é opcional, mas é preciso pelo menos um.)

> Como ligar isto no servidor: o mais simples é o jogo escrever os logins numa tabela (ex.: `login_log` com name/login/ip/email) e o **agente** fazer POST a `/api/event` por cada linha nova (igual ao que já faz para deteções). Em alternativa, um pequeno hook no `input_login.cpp`/`input_auth.cpp`.

## Email — nota importante
- **IP, nome e conta** cruzam já com os dados que existem (deteções via agente + bans no painel).
- **Email** só cruza se for fornecido: nos **bans criados no painel** (campo novo no formulário), nos **eventos `/api/event`**, ou quando a `bot_suspicion_log` passar a ter coluna `email` (o agente já a reencaminha se existir — procura `email` ou `mail`).

## Como testar
1. `npm run db:push` e entra no painel.
2. Em `/bans`, cria um ban com um IP (ex.: `1.2.3.4`) **no Servidor A**.
3. Simula uma deteção desse IP **no Servidor B**:
   ```bash
   curl -X POST https://<painel>/api/ingest -H "content-type: application/json" \
     -H "x-api-key: <KEY_DO_SERVIDOR_B>" \
     -d '{"player":"Teste","ip":"1.2.3.4","reason":"TEST"}'
   ```
4. Abre `/alerts` → deve aparecer "Teste · IP 1.2.3.4 · Banido em Servidor A · Visto em Servidor B".
5. O mesmo com `/api/event` (type login) em vez do ingest.
