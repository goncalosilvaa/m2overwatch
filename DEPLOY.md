# Deploy — Vercel + Neon (produção)

## 0. Antes de tudo
- O `.env` está no `.gitignore` (não vai para o Git). As credenciais de produção
  metem-se nas **Environment Variables da Vercel**, não no repositório.
- Gera um segredo forte: `openssl rand -hex 32` → usa em `AUTH_SECRET`.

## 1. Criar as tabelas na Neon (uma vez)
Localmente, com o `.env` preenchido a apontar para a Neon:
```bash
npm install
npm run db:push        # cria/atualiza as tabelas E regenera o Prisma Client
```
> O schema mudou (User com papéis, Listing, campos do Ban). Tens mesmo de correr isto.

## 2. Pôr o código no GitHub
```bash
git init && git add . && git commit -m "M2Overwatch SaaS"
git branch -M main && git remote add origin <o-teu-repo> && git push -u origin main
```

## 3. Importar na Vercel
1. vercel.com → **Add New… → Project** → importa o repo.
2. Framework: **Next.js** (deteção automática). Build: `npm run build` (já faz `prisma generate`).
3. **Environment Variables** (Production):
   - `DATABASE_URL` → a connection string **pooled** da Neon
   - `AUTH_SECRET` → o segredo gerado
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` → o teu admin de arranque
4. **Deploy.**

## 4. Primeiro acesso
1. Abre `https://<projeto>.vercel.app/login`.
2. Entra com `ADMIN_EMAIL` / `ADMIN_PASSWORD` → fica criado o teu **ADMIN** na DB.
3. Em **/servers** cria cada servidor cliente (gera a API key).
4. Em **/users** cria as contas dos clientes (papel **CLIENT** + servidor atribuído).
   Cada cliente entra e vê **só** o servidor dele; tu (ADMIN) vês tudo.

## 5. Ligar os servidores de jogo
Em cada servidor de jogo corre o **agente** (`agent/`), apontando
`M2OW_API_URL` para `https://<projeto>.vercel.app/api/ingest` e a `M2OW_API_KEY`
para a key desse servidor. Ver `agent/README.md`.

## 6. Domínio próprio (opcional)
Vercel → Project → **Domains** → adiciona o teu domínio e aponta o DNS.

## Segurança (produção)
- HTTPS é automático na Vercel; o cookie de sessão fica `Secure` em produção.
- Muda `ADMIN_PASSWORD` depois do 1.º login (cria um novo admin em /users e usa esse).
- Passwords guardadas com hash **scrypt** (nativo do Node) — nunca em texto.
- Headers de segurança aplicados no `next.config.mjs`.
- Mantém `AUTH_SECRET` secreto; se o rodares, todas as sessões caem (re-login).

## Migrações (opcional, em vez de db push)
Para um histórico versionado do schema:
```bash
npm run db:migrate:dev -- --name init   # cria a migração (local, com DB acessível)
npm run db:migrate                       # aplica em produção (prisma migrate deploy)
```
