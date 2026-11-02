import asyncio
import hashlib
import hmac
import json
import os
import random
import time
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import parse_qsl

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import BotCommand, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp, Message, Update, WebAppInfo
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import ensure_user, init_db, state_from_db, transaction
from game_data import NUMBER_CASES, PHONE_CASES, PHONES, RARITY_MULTIPLIERS, TOPICS

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()


def detect_base_url():
    explicit = (os.getenv("WEBAPP_URL") or os.getenv("RENDER_EXTERNAL_URL") or "").strip()
    if explicit:
        return explicit.rstrip("/")
    render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip()
    if render_host:
        return f"https://{render_host}".rstrip("/")
    return "http://localhost:8000"


BASE_URL = detect_base_url()
WEBHOOK_SECRET = hashlib.sha256(BOT_TOKEN.encode()).hexdigest()[:32] if BOT_TOKEN else "dev"
PUBLIC = Path(__file__).parent / "public"

bot = Bot(BOT_TOKEN) if BOT_TOKEN else None
dp = Dispatcher()
router = Router()
dp.include_router(router)


@router.message(CommandStart())
@router.message(Command("play"))
@router.message(F.text.regexp(r"(?i)^start$"))
async def start_message(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🎮 Играть в Viral Life", web_app=WebAppInfo(url=BASE_URL))
    ]])
    await message.answer(
        "Viral Life — снимай видео, собирай смартфоны, устанавливай редкие номера и развивай свой канал.",
        reply_markup=keyboard,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    polling_task = None
    if bot:
        await bot.set_my_commands([BotCommand(command="start", description="Открыть Viral Life")])
        await bot.set_chat_menu_button(menu_button=MenuButtonWebApp(text="Играть", web_app=WebAppInfo(url=BASE_URL)))
        if BASE_URL.startswith("https://"):
            try:
                await bot.set_webhook(f"{BASE_URL}/telegram/webhook", secret_token=WEBHOOK_SECRET, allowed_updates=["message"])
                print(f"Telegram webhook active: {BASE_URL}/telegram/webhook")
            except Exception as exc:
                print(f"Webhook setup failed, switching to polling: {exc}")
                await bot.delete_webhook(drop_pending_updates=False)
                polling_task = asyncio.create_task(dp.start_polling(bot))
        else:
            await bot.delete_webhook(drop_pending_updates=False)
            polling_task = asyncio.create_task(dp.start_polling(bot))
            print("Telegram polling active (public WEBAPP_URL is not configured)")
    yield
    if bot:
        if polling_task:
            await dp.stop_polling()
            polling_task.cancel()
        await bot.session.close()


app = FastAPI(title="Viral Life", lifespan=lifespan)


def validate_telegram(init_data: str) -> dict:
    if not BOT_TOKEN:
        return {"id": 1, "first_name": "Demo"}
    if not init_data:
        raise HTTPException(401, "Открой игру через кнопку Telegram-бота")
    values = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = values.pop("hash", "")
    if not received_hash:
        raise HTTPException(401, "Некорректные данные Telegram")
    data_check = "\n".join(f"{key}={values[key]}" for key in sorted(values))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret_key, data_check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        raise HTTPException(401, "Подпись Telegram не прошла проверку")
    try:
        auth_date = int(values.get("auth_date", "0"))
        if abs(time.time() - auth_date) > 86_400:
            raise HTTPException(401, "Сессия Telegram устарела — открой игру заново")
        user = json.loads(values.get("user", "{}"))
        if not user.get("id"):
            raise ValueError
        return user
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(401, "Не удалось определить игрока")


def current_user(x_telegram_init_data: str = Header(default="", alias="X-Telegram-Init-Data")):
    return validate_telegram(x_telegram_init_data)


ADMIN_ID = 1181838335


def require_admin(user: dict):
    if int(user["id"]) != ADMIN_ID:
        fail("Нет доступа", 403)


def audit(con, admin_id: int, action: str, target_id=None, details=""):
    con.execute("INSERT INTO admin_audit(admin_id,target_id,action,details,created_at) VALUES(?,?,?,?,?)", (admin_id, target_id, action, str(details)[:500], time.time()))


class ActionRequest(BaseModel):
    action: str = Field(min_length=1, max_length=40)
    payload: dict = Field(default_factory=dict)


def fail(message: str, status: int = 400):
    raise HTTPException(status, message)


def choose_phone(con, user_id: int, brand: str):
    owned = {r[0] for r in con.execute("SELECT model_id FROM phones WHERE user_id=?", (user_id,))}
    available = [(mid, data) for mid, data in PHONES.items() if data["brand"] == brand and mid not in owned]
    if not available:
        fail("Все модели этого бренда уже в коллекции")
    roll = random.random() * 100
    target = 0 if roll < 54 else 1 if roll < 79 else 2 if roll < 93 else 3 if roll < 99 else 4
    distance = min(abs(data["rarity"] - target) for _, data in available)
    pool = [(mid, data) for mid, data in available if abs(data["rarity"] - target) == distance]
    return random.choice(pool)


def number_rarity(case_key: str):
    weights = {"simple": [79, 20, 1, 0, 0], "pretty": [0, 50, 38, 11, 1], "business": [0, 0, 70, 25, 5]}
    return random.choices(range(5), weights=weights[case_key], k=1)[0]


def make_digits(rarity: int):
    digits = [str(random.randrange(10)) for _ in range(10)]
    if rarity >= 2:
        same = 6 if rarity == 4 else 5 if rarity == 3 else 3
        digits[-same:] = [str(random.randrange(10))] * same
    return "".join(digits)


@app.get("/api/state")
def get_state(user=Depends(current_user)):
    uid = int(user["id"])
    with transaction() as con:
        ensure_user(con, uid, user.get("first_name", ""))
        if con.execute("SELECT blocked FROM users WHERE telegram_id=?", (uid,)).fetchone()[0]:
            fail("Аккаунт заблокирован администратором", 403)
        return {"state": state_from_db(con, uid)}


@app.get("/api/catalog")
def get_catalog():
    phones = []
    for model_id, data in PHONES.items():
        phones.append({"id": model_id, **data})
    return {"phones": phones, "phone_cases": PHONE_CASES, "number_cases": NUMBER_CASES}


@app.get("/api/admin")
def admin_stats(user=Depends(current_user)):
    require_admin(user)
    with transaction() as con:
        users=con.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        new_today=con.execute("SELECT COUNT(*) FROM users WHERE created_at>=?", (int(time.time()//86400)*86400,)).fetchone()[0]
        active_today=con.execute("SELECT COUNT(*) FROM users WHERE last_seen>=?", (time.time()-86400,)).fetchone()[0]
        videos=con.execute("SELECT COUNT(*) FROM videos").fetchone()[0]
        phones=con.execute("SELECT COUNT(*) FROM phones").fetchone()[0]
        numbers=con.execute("SELECT COUNT(*) FROM numbers WHERE user_id IS NOT NULL").fetchone()[0]
        balance=con.execute("SELECT COALESCE(SUM(balance),0) FROM users").fetchone()[0]
        settings={r["key"]:r["value"] for r in con.execute("SELECT * FROM game_settings")}
        recent=[dict(r) for r in con.execute("SELECT target_id,action,details,created_at FROM admin_audit ORDER BY id DESC LIMIT 20")]
        return {"users":users,"newToday":new_today,"activeToday":active_today,"videos":videos,"phones":phones,"numbers":numbers,"balance":balance,"settings":settings,"audit":recent}

@app.get("/api/admin/player/{target_id}")
def admin_player(target_id: int, user=Depends(current_user)):
    require_admin(user)
    with transaction() as con:
        r = con.execute("SELECT telegram_id,telegram_name,nickname,balance,subscribers,likes,xp,blocked,created_at,last_seen FROM users WHERE telegram_id=?", (target_id,)).fetchone()
        if not r:
            fail("Игрок не найден", 404)
        return {"id":r["telegram_id"],"telegramName":r["telegram_name"],"name":r["nickname"],"balance":r["balance"],"subscribers":r["subscribers"],"likes":r["likes"],"xp":r["xp"],"blocked":bool(r["blocked"]),"createdAt":r["created_at"],"lastSeen":r["last_seen"],
                "phones":con.execute("SELECT COUNT(*) FROM phones WHERE user_id=?",(target_id,)).fetchone()[0],
                "numbers":con.execute("SELECT COUNT(*) FROM numbers WHERE user_id=?",(target_id,)).fetchone()[0],
                "videos":con.execute("SELECT COUNT(*) FROM videos WHERE user_id=?",(target_id,)).fetchone()[0]}


@app.post("/api/action")
def do_action(body: ActionRequest, user=Depends(current_user)):
    uid = int(user["id"])
    action, p = body.action, body.payload
    result = None
    with transaction() as con:
        ensure_user(con, uid, user.get("first_name", ""))
        u = con.execute("SELECT * FROM users WHERE telegram_id=?", (uid,)).fetchone()
        if u["blocked"] and uid != ADMIN_ID:
            fail("Аккаунт заблокирован администратором", 403)

        if action == "claim_starter":
            if con.execute("SELECT COUNT(*) FROM phones WHERE user_id=?", (uid,)).fetchone()[0]:
                fail("Телефон уже получен")
            con.execute("INSERT INTO phones(user_id,model_id,broken,created_at) VALUES(?,?,1,?)", (uid, "iphone5", time.time()))
            con.execute("UPDATE users SET active_phone='iphone5', tutorial=1 WHERE telegram_id=?", (uid,))

        elif action == "repair":
            model_id = str(p.get("phone_id", ""))
            row = con.execute("SELECT * FROM phones WHERE user_id=? AND model_id=?", (uid, model_id)).fetchone()
            if not row or not row["broken"]:
                fail("Этот телефон не требует ремонта")
            if u["balance"] < 20_000:
                fail("Не хватает рублей")
            con.execute("UPDATE users SET balance=balance-20000, tutorial=CASE WHEN tutorial=1 THEN 2 ELSE tutorial END WHERE telegram_id=?", (uid,))
            con.execute("UPDATE phones SET broken=0 WHERE id=?", (row["id"],))

        elif action == "save_name":
            name = str(p.get("name", "")).strip()[:18]
            if len(name) < 3:
                fail("Никнейм должен содержать минимум 3 символа")
            con.execute("UPDATE users SET nickname=?, tutorial=CASE WHEN tutorial=2 THEN 3 ELSE tutorial END WHERE telegram_id=?", (name, uid))

        elif action == "select_phone":
            model_id = str(p.get("phone_id", ""))
            if not con.execute("SELECT 1 FROM phones WHERE user_id=? AND model_id=?", (uid, model_id)).fetchone():
                fail("Телефон не найден")
            con.execute("UPDATE users SET active_phone=?, tutorial=CASE WHEN tutorial=3 THEN 4 ELSE tutorial END WHERE telegram_id=?", (model_id, uid))

        elif action == "set_topic":
            topic = int(p.get("topic", 0))
            if not 0 <= topic < len(TOPICS):
                fail("Неизвестная тема")
            con.execute("UPDATE users SET topic=? WHERE telegram_id=?", (topic, uid))

        elif action == "claim_income":
            state_from_db(con, uid)
            pool = con.execute("SELECT income_pool FROM users WHERE telegram_id=?", (uid,)).fetchone()[0]
            if pool < 1:
                fail("Пока нечего забирать")
            amount = int(pool)
            con.execute("UPDATE users SET balance=balance+?, income_pool=income_pool-? WHERE telegram_id=?", (amount, amount, uid))
            result = {"amount": amount}

        elif action == "open_phone_case":
            brand = str(p.get("brand", ""))
            case = PHONE_CASES.get(brand)
            if not case:
                fail("Неизвестный кейс")
            if con.execute("SELECT COUNT(*) FROM phones WHERE user_id=?", (uid,)).fetchone()[0] >= 3:
                fail("Все 3 слота телефонов заняты")
            if u["balance"] < case["price"]:
                fail("Не хватает рублей")
            model_id, model = choose_phone(con, uid, brand)
            con.execute("UPDATE users SET balance=balance-?, active_phone=? WHERE telegram_id=?", (case["price"], model_id, uid))
            con.execute("INSERT INTO phones(user_id,model_id,broken,created_at) VALUES(?,?,0,?)", (uid, model_id, time.time()))
            result = {"phone_id": model_id, "name": model["name"], "rarity": model["rarity"]}

        elif action == "generate_number":
            key = str(p.get("case", ""))
            case = NUMBER_CASES.get(key)
            if not case:
                fail("Неизвестный кейс")
            if con.execute("SELECT COUNT(*) FROM numbers WHERE user_id=?", (uid,)).fetchone()[0] >= 5:
                fail("Лимит: 5 номеров")
            if u["balance"] < case["price"]:
                fail("Не хватает рублей")
            rarity = number_rarity(key)
            boost = round(random.uniform(*case["boost"]), 1)
            # Strict non-overlapping resale value tiers: a higher rarity always costs more.
            sale_bands = ((4_000,30_000),(30_001,55_000),(55_001,345_000),(345_001,900_000),(900_001,2_500_000))
            lo, hi = sale_bands[rarity]
            # Target 30% profitability per case, respecting rarity-price ordering.
            if key == "business":
                profitable = rarity >= 3
            elif key == "pretty":
                profitable = rarity >= 3 or (rarity == 2 and random.random() < 18/38)
            else:
                # Rare and epic always cover a simple case (21%); common numbers fill the remaining 9%.
                profitable = rarity >= 1 or random.random() < 9/79
            if profitable:
                lo = max(lo, case["price"] + 1)
            else:
                hi = min(hi, case["price"] - 1)
            if lo > hi:
                # For simple cases, the rare/epic tier necessarily exceeds the case price.
                lo, hi = sale_bands[rarity]
            multiplier = con.execute("SELECT value FROM game_settings WHERE key='case_payout_multiplier'").fetchone()[0]
            # Value and sale price scale together; clamp to protect rarity boundaries.
            base_sale = random.randint(lo, hi)
            low_limit, high_limit = sale_bands[rarity]
            sale_price = max(low_limit, min(high_limit, round(base_sale * multiplier)))
            value = int(sale_price * 2.5)
            for _ in range(60):
                digits = make_digits(rarity)
                try:
                    cur = con.execute("INSERT INTO numbers(digits,rarity,boost,value,user_id,created_at) VALUES(?,?,?,?,?,?)", (digits,rarity,boost,value,uid,time.time()))
                    number_id = cur.lastrowid
                    break
                except Exception as exc:
                    if "UNIQUE" not in str(exc):
                        raise
            else:
                fail("Не удалось подобрать свободный номер", 503)
            con.execute("UPDATE users SET balance=balance-? WHERE telegram_id=?", (case["price"],uid))
            result = {"number_id":str(number_id),"digits":digits,"rarity":rarity,"boost":boost,"value":value,"sell_amount":round(value*.4), "case_price":case["price"]}

        elif action == "attach_number":
            number_id = int(p.get("number_id", 0))
            model_id = str(p.get("phone_id", ""))
            if not con.execute("SELECT 1 FROM phones WHERE user_id=? AND model_id=?", (uid, model_id)).fetchone():
                fail("Телефон не найден")
            if not con.execute("SELECT 1 FROM numbers WHERE user_id=? AND id=?", (uid, number_id)).fetchone():
                fail("Номер не найден")
            con.execute("UPDATE numbers SET phone_model_id=NULL WHERE user_id=? AND phone_model_id=?", (uid, model_id))
            con.execute("UPDATE numbers SET phone_model_id=? WHERE user_id=? AND id=?", (model_id, uid, number_id))
            con.execute("UPDATE users SET active_phone=? WHERE telegram_id=?", (model_id, uid))

        elif action == "sell_phone":
            model_id = str(p.get("phone_id", ""))
            row = con.execute("SELECT id FROM phones WHERE user_id=? AND model_id=?", (uid, model_id)).fetchone()
            model = PHONES.get(model_id)
            if not row or not model:
                fail("Телефон не найден")
            amount = round(model["value"] * .42)
            con.execute("UPDATE numbers SET phone_model_id=NULL WHERE user_id=? AND phone_model_id=?", (uid, model_id))
            con.execute("DELETE FROM phones WHERE id=?", (row["id"],))
            next_phone = con.execute("SELECT model_id FROM phones WHERE user_id=? ORDER BY id LIMIT 1", (uid,)).fetchone()
            con.execute("UPDATE users SET balance=balance+?, active_phone=? WHERE telegram_id=?", (amount, next_phone[0] if next_phone else None, uid))
            result = {"amount": amount}

        elif action == "sell_number":
            number_id = int(p.get("number_id", 0))
            row = con.execute("SELECT value FROM numbers WHERE user_id=? AND id=?", (uid, number_id)).fetchone()
            if not row:
                fail("Номер не найден")
            amount = round(row["value"] * .4)
            con.execute("UPDATE numbers SET user_id=NULL, phone_model_id=NULL WHERE id=?", (number_id,))
            con.execute("UPDATE users SET balance=balance+? WHERE telegram_id=?", (amount, uid))
            result = {"amount": amount}

        elif action == "shoot":
            u = con.execute("SELECT * FROM users WHERE telegram_id=?", (uid,)).fetchone()
            model_id = u["active_phone"]
            model = PHONES.get(model_id or "")
            row = con.execute("SELECT * FROM phones WHERE user_id=? AND model_id=?", (uid, model_id)).fetchone()
            if not row or not model:
                fail("Сначала выбери телефон")
            if row["broken"]:
                fail("Сначала почини телефон")
            cutoff = time.time() - 600
            uses = [float(x) for x in json.loads(row["uses_json"] or "[]") if float(x) > cutoff]
            if len(uses) >= 3:
                fail("На этом телефоне использованы все 3 попытки")
            uses.append(time.time())
            con.execute("UPDATE phones SET uses_json=? WHERE id=?", (json.dumps(uses), row["id"]))
            topic_idx = u["topic"]
            topic_name, topic_mult = TOPICS[topic_idx]
            num = con.execute("SELECT boost FROM numbers WHERE user_id=? AND phone_model_id=?", (uid, model_id)).fetchone()
            number_bonus = float(num["boost"]) if num else 0.0
            quality = (model["cam"] * .62 + model["perf"] * .38) / 100
            audience = 45 + u["subscribers"] * .048 + (max(0, u["likes"]) ** .5) * 1.15
            viral = random.random() < (.035 + quality * .07 + number_bonus / 800)
            views = round(audience * (.55 + quality * 2.0) * topic_mult * random.uniform(.76, 1.36) * (1 + number_bonus / 100) * (6.5 if viral else 1))
            likes = max(1, round(views * (.075 + quality * .07)))
            subscribers = max(0, round(views * (.008 + quality * .018)))
            earning_mult = con.execute("SELECT value FROM game_settings WHERE key='income_multiplier'").fetchone()[0]
            income = max(5, round(likes * (.6 + quality * .9) * earning_mult))
            title = f"{topic_name} • {model['name']}"
            con.execute("INSERT INTO videos(user_id,phone_model_id,title,likes,subscribers,income_per_hour,viral,created_at) VALUES(?,?,?,?,?,?,?,?)", (uid, model_id, title, likes, subscribers, income, int(viral), time.time()))
            con.execute("UPDATE users SET likes=likes+?, subscribers=subscribers+?, income_pool=income_pool+?, tutorial=CASE WHEN tutorial=4 THEN 5 ELSE tutorial END WHERE telegram_id=?", (likes, subscribers, income, uid))
            con.execute("UPDATE users SET xp=xp+? WHERE telegram_id=?", (35 + (30 if viral else 0),uid))
            result = {"likes": likes, "subs": subscribers, "income": income, "viral": viral, "xp":35 + (30 if viral else 0)}

        elif action == "admin_adjust":
            if uid != ADMIN_ID:fail("Нет доступа",403)
            target=int(p.get("user_id",0));field=str(p.get("field",""));amount=int(p.get("amount",0));allowed={"balance":"balance","subscribers":"subscribers","likes":"likes","xp":"xp"}
            if field not in allowed or not -100_000_000<=amount<=100_000_000 or amount == 0:fail("Недопустимое изменение")
            if not con.execute("SELECT 1 FROM users WHERE telegram_id=?",(target,)).fetchone():fail("Игрок не найден")
            column=allowed[field];con.execute(f"UPDATE users SET {column}=MAX(0,{column}+?) WHERE telegram_id=?",(amount,target));audit(con,uid,"adjust",target,f"{field}: {amount:+d}");result={"amount":amount,"field":field,"user_id":target}

        elif action == "admin_block":
            if uid != ADMIN_ID:fail("Нет доступа",403)
            target=int(p.get("user_id",0));blocked=1 if p.get("blocked") else 0
            if target == ADMIN_ID:fail("Нельзя заблокировать владельца")
            if not con.execute("SELECT 1 FROM users WHERE telegram_id=?",(target,)).fetchone():fail("Игрок не найден")
            con.execute("UPDATE users SET blocked=? WHERE telegram_id=?",(blocked,target));audit(con,uid,"block" if blocked else "unblock",target);result={"blocked":bool(blocked),"user_id":target}

        elif action == "admin_reset_attempts":
            if uid != ADMIN_ID:fail("Нет доступа",403)
            target=int(p.get("user_id",0));con.execute("UPDATE phones SET uses_json='[]' WHERE user_id=?",(target,));audit(con,uid,"reset_attempts",target);result={"user_id":target}

        elif action == "admin_setting":
            if uid != ADMIN_ID:fail("Нет доступа",403)
            key=str(p.get("key","")); value=float(p.get("value",0))
            ranges={"income_multiplier":(.25,3),"case_payout_multiplier":(.25,3),"income_cap_hours":(1,24)}
            if key not in ranges or not ranges[key][0]<=value<=ranges[key][1]:fail("Недопустимое значение")
            con.execute("UPDATE game_settings SET value=? WHERE key=?",(value,key))
            audit(con,uid,"setting",None,f"{key}={value}")
            result={"key":key,"value":value}

        elif action == "claim_daily":
            today = time.strftime("%Y-%m-%d",time.gmtime())
            task = str(p.get("task", ""))
            count = con.execute("SELECT COUNT(*) FROM videos WHERE user_id=? AND created_at>=?",(uid,int(time.time()//86400)*86400)).fetchone()[0]
            tasks = {"login":(True,4000,15),"video1":(count>=1,7000,25),"video3":(count>=3,15000,55)}
            if task not in tasks or not tasks[task][0]:fail("Задание пока не выполнено")
            if con.execute("SELECT 1 FROM daily_claims WHERE user_id=? AND day=? AND task=?",(uid,today,task)).fetchone():fail("Награда уже получена")
            reward,xp_reward=tasks[task][1:]
            con.execute("INSERT INTO daily_claims VALUES (?,?,?)",(uid,today,task))
            con.execute("UPDATE users SET balance=balance+?, xp=xp+? WHERE telegram_id=?",(reward,xp_reward,uid))
            result={"amount":reward,"xp":xp_reward}

        elif action == "claim_level":
            level=int(p.get("level",0))
            xp=u["xp"]
            actual=1+int((xp/120)**.6)
            last=con.execute("SELECT last_daily FROM users WHERE telegram_id=?",(uid,)).fetchone()[0]
            previous=int(last.split(':')[1]) if last.startswith('level:') else 1
            if level!=previous+1 or level>actual:fail("Награда уровня пока недоступна")
            reward=level*5000
            con.execute("UPDATE users SET balance=balance+?,last_daily=? WHERE telegram_id=?",(reward,f"level:{level}",uid))
            result={"amount":reward}

        elif action == "finish_tutorial":
            con.execute("UPDATE users SET tutorial=-1 WHERE telegram_id=?", (uid,))

        elif action == "reset":
            con.execute("DELETE FROM users WHERE telegram_id=?", (uid,))
            ensure_user(con, uid, user.get("first_name", ""))

        else:
            fail("Неизвестное действие")

        state = state_from_db(con, uid)
        return {"ok": True, "state": state, "result": result}


@app.post("/telegram/webhook")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: str = Header(default="")):
    if not bot or x_telegram_bot_api_secret_token != WEBHOOK_SECRET:
        raise HTTPException(403, "Forbidden")
    update = Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"ok": True}


@app.get("/health")
def health():
    return {"ok": True, "bot_configured": bool(BOT_TOKEN), "webapp_url": BASE_URL, "runtime": "python"}


@app.exception_handler(HTTPException)
async def api_error(_request: Request, exc: HTTPException):
    return JSONResponse({"ok": False, "detail": exc.detail}, status_code=exc.status_code)


app.mount("/assets", StaticFiles(directory=PUBLIC), name="assets")


@app.get("/{path:path}")
def frontend(path: str):
    target = PUBLIC / path
    if path and target.is_file() and PUBLIC in target.resolve().parents:
        return FileResponse(target)
    return FileResponse(PUBLIC / "index.html")
