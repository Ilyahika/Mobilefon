import json
import os
import sqlite3
import time
from contextlib import contextmanager

DB_PATH = os.getenv("DATABASE_PATH", "data/viral_life.db")


def _connect():
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    con = sqlite3.connect(DB_PATH, timeout=20)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    con.execute("PRAGMA journal_mode=WAL")
    return con


@contextmanager
def transaction():
    con = _connect()
    try:
        con.execute("BEGIN IMMEDIATE")
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def init_db():
    with transaction() as con:
        con.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                telegram_name TEXT NOT NULL DEFAULT '',
                nickname TEXT NOT NULL DEFAULT '',
                balance INTEGER NOT NULL DEFAULT 50000 CHECK(balance >= 0),
                subscribers INTEGER NOT NULL DEFAULT 0,
                likes INTEGER NOT NULL DEFAULT 0,
                income_pool REAL NOT NULL DEFAULT 0,
                active_phone TEXT,
                topic INTEGER NOT NULL DEFAULT 0,
                tutorial INTEGER NOT NULL DEFAULT 0,
                last_income_at REAL NOT NULL,
                created_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS phones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
                model_id TEXT NOT NULL,
                broken INTEGER NOT NULL DEFAULT 0,
                uses_json TEXT NOT NULL DEFAULT '[]',
                created_at REAL NOT NULL,
                UNIQUE(user_id, model_id)
            );
            CREATE TABLE IF NOT EXISTS numbers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                digits TEXT NOT NULL UNIQUE,
                rarity INTEGER NOT NULL,
                boost REAL NOT NULL,
                value INTEGER NOT NULL,
                user_id INTEGER REFERENCES users(telegram_id) ON DELETE SET NULL,
                phone_model_id TEXT,
                created_at REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_numbers_owner ON numbers(user_id);
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
                phone_model_id TEXT NOT NULL,
                title TEXT NOT NULL,
                likes INTEGER NOT NULL,
                subscribers INTEGER NOT NULL,
                income_per_hour INTEGER NOT NULL,
                viral INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL
            );
            """
        )
        existing = {r[1] for r in con.execute("PRAGMA table_info(users)")}
        for column, ddl in {"xp":"INTEGER NOT NULL DEFAULT 0", "last_daily":"TEXT NOT NULL DEFAULT ''"}.items():
            if column not in existing:
                con.execute(f"ALTER TABLE users ADD COLUMN {column} {ddl}")
        con.execute("CREATE TABLE IF NOT EXISTS daily_claims (user_id INTEGER NOT NULL, day TEXT NOT NULL, task TEXT NOT NULL, PRIMARY KEY(user_id,day,task))")
        con.execute("CREATE TABLE IF NOT EXISTS game_settings (key TEXT PRIMARY KEY, value REAL NOT NULL)")
        con.execute("INSERT OR IGNORE INTO game_settings(key,value) VALUES ('income_multiplier',1.0)")
        con.execute("INSERT OR IGNORE INTO game_settings(key,value) VALUES ('case_payout_multiplier',1.0)")


def ensure_user(con, telegram_id: int, telegram_name: str = ""):
    ts = time.time()
    con.execute(
        "INSERT OR IGNORE INTO users(telegram_id, telegram_name, last_income_at, created_at) VALUES(?,?,?,?)",
        (telegram_id, telegram_name[:64], ts, ts),
    )
    if telegram_name:
        con.execute("UPDATE users SET telegram_name=? WHERE telegram_id=?", (telegram_name[:64], telegram_id))


def settle_income(con, telegram_id: int):
    row = con.execute("SELECT last_income_at FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    if not row:
        return
    ts = time.time()
    seconds = max(0.0, min(ts - row["last_income_at"], 7 * 86400))
    hourly = con.execute("SELECT COALESCE(SUM(income_per_hour),0) total FROM videos WHERE user_id=?", (telegram_id,)).fetchone()["total"]
    con.execute(
        "UPDATE users SET income_pool=income_pool+?, last_income_at=? WHERE telegram_id=?",
        (hourly * seconds / 3600, ts, telegram_id),
    )


def state_from_db(con, telegram_id: int):
    settle_income(con, telegram_id)
    u = con.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    phones = []
    for p in con.execute("SELECT * FROM phones WHERE user_id=? ORDER BY id", (telegram_id,)):
        phones.append({"id": p["model_id"], "broken": bool(p["broken"]), "uses": [int(float(x) * 1000) for x in json.loads(p["uses_json"] or "[]")]})
    numbers = [
        {"id": str(n["id"]), "digits": n["digits"], "rarity": n["rarity"], "boost": n["boost"], "value": n["value"], "phoneId": n["phone_model_id"]}
        for n in con.execute("SELECT * FROM numbers WHERE user_id=? ORDER BY id", (telegram_id,))
    ]
    videos = [
        {"title": v["title"], "likes": v["likes"], "subs": v["subscribers"], "income": v["income_per_hour"], "viral": bool(v["viral"]), "at": int(v["created_at"] * 1000)}
        for v in con.execute("SELECT * FROM (SELECT * FROM videos WHERE user_id=? ORDER BY id DESC LIMIT 40) ORDER BY id ASC", (telegram_id,))
    ]
    xp = u["xp"]
    level = 1 + int((xp / 120) ** .6)
    today = time.strftime("%Y-%m-%d", time.gmtime())
    claimed = [r[0] for r in con.execute("SELECT task FROM daily_claims WHERE user_id=? AND day=?", (telegram_id,today))]
    made_today = con.execute("SELECT COUNT(*) FROM videos WHERE user_id=? AND created_at>=?", (telegram_id, int(time.time()//86400)*86400)).fetchone()[0]
    return {
        "level": level, "xp": xp, "nextXp": round(120 * level ** (1/.6)), "daily": {"claimed":claimed,"videos":made_today,"day":today},
        "isAdmin":telegram_id == 1181838335, "claimedLevel": int(u["last_daily"].split(":")[1]) if u["last_daily"].startswith("level:") else 1,
        "version": 4,
        "cash": u["balance"], "name": u["nickname"], "subs": u["subscribers"], "likes": u["likes"],
        "pool": round(u["income_pool"], 2), "videos": videos, "phones": phones,
        "activePhone": u["active_phone"], "numbers": numbers, "topic": u["topic"], "tutorial": u["tutorial"],
    }
