# Viral Life 4.0 — Python Telegram Mini App

Полная Python-сборка для Render:

- FastAPI — API и раздача Mini App;
- aiogram 3 — Telegram-бот и webhook;
- SQLite3 — игроки, телефоны, номера, ролики и экономика;
- HTML/CSS/JavaScript — игровой интерфейс.

В этой версии восстановлен интерфейс из исходного архива: оригинальное жидкое стекло, объёмная SIM-карта, барабанная генерация цифр, частицы редкости и плавный ползунок нижней навигации. Обучение работает поверх этого дизайна и подсвечивает реальные координаты элементов.

## Запуск на Render

1. Загрузите содержимое этой папки в GitHub.
2. Render → **New → Blueprint** → выберите репозиторий с `render.yaml`.
3. Добавьте секретную переменную `BOT_TOKEN` — токен от BotFather.
4. Добавьте `WEBAPP_URL` — полный адрес сервиса, например `https://viral-life.onrender.com`.
5. Запустите Deploy.

Команды уже записаны в `render.yaml`:

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

После запуска приложение автоматически:

- создаст SQLite-базу `data/viral_life.db`;
- установит Telegram webhook;
- добавит команду `/start`;
- добавит кнопку меню «Играть»;
- будет проверять подпись Telegram Mini App.

Пользователь пишет боту `/start`, получает сообщение с кнопкой **«🎮 Играть в Viral Life»** и открывает Mini App внутри Telegram.

Обычное сообщение `start` без слеша тоже поддерживается.

## Если вы обновляете старый Node-сервис

`render.yaml` не всегда меняет настройки уже существующего Web Service. Откройте **Render → Settings** и вручную замените старые команды:

```text
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Удалите старую команду `npm start`. Затем выполните **Manual Deploy → Clear build cache & deploy**.

После развёртывания откройте:

```text
https://ВАШ-СЕРВИС.onrender.com/health
```

Правильный ответ содержит:

```json
{"ok":true,"bot_configured":true,"webapp_url":"https://ВАШ-СЕРВИС.onrender.com","runtime":"python"}
```

Если `runtime` не равен `python`, Render всё ещё запускает старую Node-сборку.

## Локальный запуск

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Без `BOT_TOKEN` включается локальный демонстрационный пользователь с ID `1`. На Render с токеном API принимает только корректно подписанные данные Telegram.

## SQLite на Render

На бесплатном Render локальные файлы могут исчезнуть после пересборки или перезапуска сервиса. Для постоянной SQLite-базы подключите Persistent Disk и задайте:

```text
DATABASE_PATH=/var/data/viral_life.db
```

Для большого онлайна позже лучше перейти на PostgreSQL. Структура API уже отделена от интерфейса, поэтому миграцию можно выполнить без переделки дизайна.

## Viral Life v7 changes
- Four fixed bottom tabs: Главная / Студия / Кейсы / Меню.
- Меню contains collection of numbers, profile, help, support placeholder, market maintenance placeholder and server-verified admin panel.
- Главная displays hourly income, subscribers, likes, earnings, compact phone cards. Tap a phone for a detailed view and server-confirmed sale.
- Студия includes video topic controls and phone-dependent 3 attempts per 30 minutes.
- Updated tutorial hint transitions and dimming, while preserving the original UI palette.
- Number valuations use disjoint rarity-specific resale value bands; at default multiplier the intended profitability is ~30%, though realized samples fluctuate.
- Admin panel can look up a player, grant currency and adjust earnings or case value multipliers.
- The market and support integration are placeholders: connect a real support address and market implementation before advertising those features as live.
- Deployment: keep your existing DATABASE_PATH/database file and environment variables. Never overwrite the live DB with an empty one.
