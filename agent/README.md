# M2Overwatch — Agente de ingestao

Lê as deteções novas da tabela MySQL `bot_suspicion_log` (a DB de **log** do teu
servidor de jogo) e envia-as para o painel via `POST /api/ingest`, autenticando
com a **API key** do servidor (header `x-api-key`). Guarda o último `id` enviado
num ficheiro de estado, por isso nunca reenvia.

```
bot_suspicion_log (MySQL)  ──>  agente (este script)  ──>  /api/ingest  ──>  Painel (Neon)
```

## 1. Requisitos
- Python 3.8+
- `pip install -r requirements.txt`  (instala o PyMySQL)

## 2. Configurar
1. No painel, em **/servers**, cria o teu servidor e copia a **API key**.
2. Copia `.env.example` para `.env` e preenche:
   - dados da DB de log do jogo (`M2OW_DB_*`)
   - `M2OW_API_URL` = `https://<o-teu-painel>/api/ingest`
   - `M2OW_API_KEY` = a key copiada

## 3. Correr
```bash
# daemon (a cada 60s, M2OW_POLL_SECONDS=60)
python3 m2overwatch_agent.py

# uma vez (para cron); mete M2OW_POLL_SECONDS=0
python3 m2overwatch_agent.py
```

## 4. Deixar a correr sempre

**Linux (systemd)** — `/etc/systemd/system/m2ow-agent.service`:
```ini
[Unit]
Description=M2Overwatch agent
After=network.target mariadb.service

[Service]
WorkingDirectory=/caminho/para/agent
ExecStart=/usr/bin/python3 /caminho/para/agent/m2overwatch_agent.py
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now m2ow-agent
journalctl -u m2ow-agent -f
```

**cron (one-shot, M2OW_POLL_SECONDS=0)** — a cada minuto:
```
* * * * * cd /caminho/para/agent && /usr/bin/python3 m2overwatch_agent.py >> agent.log 2>&1
```

**Windows** — Agendador de Tarefas: ação `python.exe m2overwatch_agent.py`,
repetir a cada 1 min (com `M2OW_POLL_SECONDS=0`), ou correr o daemon ao arranque.

## Notas
- Mapa de colunas: `name`→jogador, `login`→conta, `ip`, `server`→canal, `score`,
  `reason`/`vector`→motivo, `detail`, `session_seconds`→duração. Ajusta no script
  se a tua tabela usar nomes diferentes.
- Se a key estiver errada recebes 401 e o agente pára (corrige a `M2OW_API_KEY`).
- O estado fica em `m2ow_agent_state.json`. Apaga-o para reenviar tudo de novo.

## Aplicar bans no jogo (account.status = BLOCK)

O painel só **marca** os bans; o agente é que os **aplica** na DB de contas do teu
servidor, com o utilizador MySQL do anti-cheat. Fluxo:

```
Painel /bans  ── marca ban (executeInGame) ──>  /api/agent/bans (x-api-key)
agente  ── UPDATE account.account SET status='BLOCK' WHERE login=? ──>  DB de contas
agente  ── confirma ──>  /api/agent/bans/ack
```

### 1. Dar permissões ao utilizador do anti-cheat (uma vez)
No MySQL do jogo:
```sql
GRANT UPDATE ON account.account TO 'anticheat'@'localhost';
FLUSH PRIVILEGES;
```
(Se o teu utilizador já existe, basta o GRANT. Ajusta o host se não for `localhost`.)

### 2. Configurar o `.env` do agente
Preenche o bloco **DB de CONTAS** no `.env` (`M2OW_ACC_DB_*`). O `M2OW_BAN_SQL`
por defeito bloqueia a conta pelo **login**; muda-o se o teu método for outro
(ex.: tabela de bans própria, ou outra coluna/estado).

### 3. Usar no painel
Em **/bans**, cria o ban com a **conta/login** preenchida e "Aplicar no jogo"
marcado (ou clica **Aplicar no jogo** numa linha existente). O agente aplica no
próximo ciclo e a linha passa a **Aplicado ✓**. Se falhar, mostra **Erro** (passa
o rato por cima para ver o motivo) e podes clicar **Repetir**.

> Importante: o ban é por **login da conta**. Bans sem conta/login ficam com erro
> "sem conta/login". Nas deteções, a conta vem do log; em bans manuais, preenche-a.
