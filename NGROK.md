# Публикация проекта через ngrok

Ниже быстрый чек-лист, чтобы показать Django + Vite‑фронтенд куратору без деплоя.

## 1. Установите ngrok

Скачайте архив с <https://ngrok.com/download>, распакуйте и
добавьте исполняемый файл в `PATH`, либо положите рядом с репозиторием.

Залогиньтесь (одноразово):

```bash
ngrok config add-authtoken ТВОЙ_ТОКЕН
```

## 2. Поднимите backend и frontend

```bash
# backend
cd backend
..\ .venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

Во второй вкладке:

```bash
cd frontend
set VITE_API_URL=http://localhost:8000/api
npm run dev -- --host 0.0.0.0 --port 5173
```

## 3. Пробросьте туннели

Откройте ещё два терминала:

```bash
ngrok http 8000    # Django API
ngrok http 5173    # Vite dev server
```

В выводе будут публичные URL вида `https://abc123.ngrok-free.app`.
Скопируйте адрес бэкенда и замените им `VITE_API_URL` перед стартом фронта,
чтобы React обращался к удалённому API:

```bash
set VITE_API_URL=https://abc123.ngrok-free.app/api
npm run dev -- --host 0.0.0.0 --port 5173
```

После этого открывайте публичный URL от второго туннеля — куратор увидит фронтенд,
а все запросы «уйдут» через первый туннель на локальный Django.
