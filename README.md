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
4. Запустите Deploy.

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
