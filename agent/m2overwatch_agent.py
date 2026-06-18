#!/usr/bin/env python3
"""
M2Overwatch — agente de ingestao.
Le linhas novas da tabela MySQL `bot_suspicion_log` (DB de log do jogo) e faz
POST ao /api/ingest do painel, com a API key do servidor (header x-api-key).
Estado guardado num ficheiro (high-water mark do id) para nao reenviar.

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

DB_HOST = os.environ.get("M2OW_DB_HOST", "localhost")
DB_PORT = int(os.environ.get("M2OW_DB_PORT", "3306"))
DB_USER = os.environ.get("M2OW_DB_USER", "metin2")
DB_PASS = os.environ.get("M2OW_DB_PASS", "")
DB_NAME = os.environ.get("M2OW_DB_NAME", "log")
TABLE = os.environ.get("M2OW_TABLE", "bot_suspicion_log")
ID_COL = os.environ.get("M2OW_ID_COLUMN", "id")
API_URL = os.environ.get("M2OW_API_URL", "").strip()
API_KEY = os.environ.get("M2OW_API_KEY", "").strip()
POLL = int(os.environ.get("M2OW_POLL_SECONDS", "60"))
BATCH = int(os.environ.get("M2OW_BATCH", "200"))
STATE_FILE = os.environ.get("M2OW_STATE_FILE", os.path.join(HERE, "m2ow_agent_state.json"))

if not API_URL or not API_KEY:
    print("Configura M2OW_API_URL e M2OW_API_KEY (no .env ou no ambiente).", file=sys.stderr)
    sys.exit(1)


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
    if row.get("server"):
        p["channel"] = str(row["server"])[:64]
    if row.get("detail"):
        p["detail"] = str(row["detail"])[:512]
    return p


def post(payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL, data=data, method="POST",
        headers={"content-type": "application/json", "x-api-key": API_KEY},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "ignore")
    except Exception as e:
        return 0, str(e)


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
            status, body = post(payload)
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


def main():
    print("M2Overwatch agent -> %s (tabela %s, a partir do id %s)" % (API_URL, TABLE, load_last_id()))
    if POLL <= 0:
        print("Enviadas %s deteccoes." % run_once())
        return
    while True:
        try:
            n = run_once()
            if n:
                print("Enviadas %s deteccoes (last_id=%s)" % (n, load_last_id()))
        except Exception as e:
            print("Erro:", e, file=sys.stderr)
        time.sleep(POLL)


if __name__ == "__main__":
    main()
