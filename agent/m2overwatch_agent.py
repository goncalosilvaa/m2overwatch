#!/usr/bin/env python3
"""
M2Overwatch — agente do servidor.

1) INGESTAO: le linhas novas de `bot_suspicion_log` (DB de log) e faz POST a /api/ingest.
2) BANS: puxa bans pendentes do painel (/api/agent/bans) e aplica-os na DB de CONTAS
   (account.status = 'BLOCK' pelo login), com o utilizador MySQL do anti-cheat; depois
   confirma em /api/agent/bans/ack.

Config por variaveis de ambiente ou por um ficheiro .env ao lado deste script.
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error

try:
    import pymysql
except ImportError:
    print("Falta o PyMySQL. Instala com:  pip install pymysql", file=sys.stderr)
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))


def load_env():
    path = os.path.join(HERE, ".env")
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k.strip(), v)


load_env()

# --- DB de LOG do jogo (origem das detecoes) ---
DB_HOST = os.environ.get("M2OW_DB_HOST", "127.0.0.1")
DB_PORT = int(os.environ.get("M2OW_DB_PORT", "3306"))
DB_USER = os.environ.get("M2OW_DB_USER", "metin2")
DB_PASS = os.environ.get("M2OW_DB_PASS", "")
DB_NAME = os.environ.get("M2OW_DB_NAME", "log")
TABLE = os.environ.get("M2OW_TABLE", "bot_suspicion_log")
ID_COL = os.environ.get("M2OW_ID_COLUMN", "id")

# --- Painel ---
API_URL = os.environ.get("M2OW_API_URL", "").strip()   # .../api/ingest
API_KEY = os.environ.get("M2OW_API_KEY", "").strip()
POLL = int(os.environ.get("M2OW_POLL_SECONDS", "60"))
BATCH = int(os.environ.get("M2OW_BATCH", "200"))
STATE_FILE = os.environ.get("M2OW_STATE_FILE", os.path.join(HERE, "m2ow_agent_state.json"))

# Base do painel (para os endpoints de bans). Derivada do API_URL se nao for dada.
API_BASE = os.environ.get("M2OW_API_BASE", "").strip()
if not API_BASE and API_URL:
    API_BASE = API_URL[:-len("/api/ingest")] if API_URL.endswith("/api/ingest") else API_URL.rsplit("/api/", 1)[0]
BANS_URL = API_BASE + "/api/agent/bans"
ACK_URL = API_BASE + "/api/agent/bans/ack"

# --- DB de CONTAS do jogo (para aplicar os bans) ---
BANS_ENABLE = os.environ.get("M2OW_BANS_ENABLE", "1").strip() not in ("0", "false", "no", "")
ACC_DB_HOST = os.environ.get("M2OW_ACC_DB_HOST", DB_HOST)
ACC_DB_PORT = int(os.environ.get("M2OW_ACC_DB_PORT", "3306"))
ACC_DB_USER = os.environ.get("M2OW_ACC_DB_USER", DB_USER).strip()
ACC_DB_PASS = os.environ.get("M2OW_ACC_DB_PASS", DB_PASS)
ACC_DB_NAME = os.environ.get("M2OW_ACC_DB_NAME", "account")
BAN_SQL = os.environ.get("M2OW_BAN_SQL", "UPDATE account.account SET status='BLOCK' WHERE login=%s")

if not API_URL or not API_KEY:
    print("Configura M2OW_API_URL e M2OW_API_KEY (no .env ou no ambiente).", file=sys.stderr)
    sys.exit(1)


# =========================== INGESTAO ===========================
def load_last_id():
    try:
        with open(STATE_FILE) as f:
            return int(json.load(f).get("last_id", 0))
    except Exception:
        return 0


def save_last_id(v):
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump({"last_id": v}, f)
    os.replace(tmp, STATE_FILE)


def to_payload(row):
    reason = row.get("reason") or row.get("vector") or "REVIEW"
    player = row.get("name") or row.get("player") or ""
    if not player:
        return None
    p = {
        "player": str(player)[:64],
        "reason": str(reason)[:64],
        "score": float(row.get("score") or 0),
        "sessionSeconds": int(row.get("session_seconds") or row.get("sessionSeconds") or 0),
    }
    if row.get("login"):
        p["account"] = str(row["login"])[:64]
    if row.get("ip"):
        p["ip"] = str(row["ip"])[:64]
    if row.get("email") or row.get("mail"):
        p["email"] = str(row.get("email") or row.get("mail"))[:128]
    if row.get("server"):
        p["channel"] = str(row["server"])[:64]
    if row.get("detail"):
        p["detail"] = str(row["detail"])[:512]
    return p


def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"content-type": "application/json", "x-api-key": API_KEY},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")
    except Exception as e:
        return 0, str(e)


def get_json(url):
    req = urllib.request.Request(url, headers={"x-api-key": API_KEY})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, json.loads(r.read().decode("utf-8", "ignore") or "{}")


def run_once():
    last = load_last_id()
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS,
        database=DB_NAME, charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
    )
    sent = 0
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM `%s` WHERE `%s` > %%s ORDER BY `%s` ASC LIMIT %%s"
                % (TABLE, ID_COL, ID_COL),
                (last, BATCH),
            )
            rows = cur.fetchall()
        for row in rows:
            rid = int(row[ID_COL])
            payload = to_payload(row)
            if payload is None:
                last = rid
                save_last_id(last)
                continue
            status, body = post_json(API_URL, payload)
            if status == 200:
                sent += 1
                last = rid
                save_last_id(last)
            elif status == 400:
                print("[skip id=%s] payload invalido: %s" % (rid, body), file=sys.stderr)
                last = rid
                save_last_id(last)
            elif status == 401:
                print("[stop] API key invalida (401). Verifica M2OW_API_KEY.", file=sys.stderr)
                break
            else:
                print("[retry] id=%s status=%s %s" % (rid, status, body), file=sys.stderr)
                break
    finally:
        conn.close()
    return sent


# =========================== BANS ===========================
def ack_ban(ban_id, ok, error=None):
    status, body = post_json(ACK_URL, {"id": ban_id, "ok": bool(ok), "error": error})
    if status != 200:
        print("[ban ack] falhou id=%s status=%s %s" % (ban_id, status, body), file=sys.stderr)


def process_bans():
    if not BANS_ENABLE or not ACC_DB_USER:
        return 0
    try:
        status, data = get_json(BANS_URL)
    except Exception as e:
        print("[bans] nao consegui obter pendentes:", e, file=sys.stderr)
        return 0
    if status != 200:
        print("[bans] GET status %s" % status, file=sys.stderr)
        return 0
    bans = (data or {}).get("bans") or []
    if not bans:
        return 0

    try:
        conn = pymysql.connect(
            host=ACC_DB_HOST, port=ACC_DB_PORT, user=ACC_DB_USER, password=ACC_DB_PASS,
            database=ACC_DB_NAME, charset="utf8mb4", autocommit=True,
        )
    except Exception as e:
        print("[bans] sem ligacao a DB de contas (fica pendente):", e, file=sys.stderr)
        return 0

    applied = 0
    try:
        with conn.cursor() as cur:
            for b in bans:
                bid = b.get("id")
                account = (b.get("account") or "").strip()
                if not account:
                    ack_ban(bid, False, "sem conta/login para aplicar o ban")
                    continue
                try:
                    cur.execute(BAN_SQL, (account,))
                    ack_ban(bid, True)
                    applied += 1
                except Exception as e:
                    ack_ban(bid, False, "SQL: %s" % e)
    finally:
        conn.close()
    return applied


def cycle():
    try:
        n = run_once()
        if n:
            print("Enviadas %s deteccoes (last_id=%s)" % (n, load_last_id()))
    except Exception as e:
        print("Erro ingestao:", e, file=sys.stderr)
    try:
        m = process_bans()
        if m:
            print("Aplicados %s bans no jogo" % m)
    except Exception as e:
        print("Erro bans:", e, file=sys.stderr)


def main():
    print("M2Overwatch agent -> %s (ingest tabela %s; bans %s)"
          % (API_URL, TABLE, "ON" if (BANS_ENABLE and ACC_DB_USER) else "OFF"))
    if POLL <= 0:
        cycle()
        return
    while True:
        cycle()
        time.sleep(POLL)


if __name__ == "__main__":
    main()
