# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Integration Hub

Веб-платформа для онбординга сотрудников: просмотр курсов, отслеживание прогресса, управление уроками и задачами, а также админ‑панель для наставников. Фронтенд написан на React + Vite, бэкенд — Django REST Framework с JWT-аутентификацией.

## Основные возможности

- регистрация и вход с JWT (access + refresh);
- каталог курсов с модулями, уроками, заданиями и квизами;
- личный кабинет с прогрессом, ежедневной целью и достижениями;
- конструктор курсов и админ-панель для наставников;
- контекстный UI на русском языке (тёмно/светлая тема, анимации);
- единый API клиент с автообновлением access токена.

## Технологии

- **Frontend**: React 18, Vite, React Router, Axios;
- **Backend**: Django 4, Django REST Framework, SimpleJWT;
- **UI**: кастомные стили (CSS), Inter с кириллицей;
- **БД**: SQLite (по умолчанию, легко заменить).

## Быстрый старт

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # создайте администратора
python manage.py runserver
```

Сервер поднимется на `http://localhost:8000`. Все API лежат под `/api/…`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

По умолчанию фронт общается с `http://localhost:8000/api`. Чтобы переопределить URL, создайте `.env` в папке `frontend`:

```
VITE_API_URL=https://ngrok-туннель/api
```

### 3. Роли и доступ

- **Администратор / наставник** — пользователь с флагом `is_staff=True` (выдаётся через Django Admin). Видит конструктор курсов, админ-панель и может изменять уроки.
- **Ученик** — обычный пользователь. Регистрируется на странице `/register`. В профиле можно выбрать одну из ролей каталога (Сварщик/Менеджер/Продавец) — это влияет на рекомендации курсов.

JWT access хранится в `localStorage` как `token`, refresh — `refreshToken`. Клиент автоматически обновляет access при первом `401`.

## Скрипты

- `npm run dev` — фронтенд dev сервер (`http://localhost:5173`);
- `npm run build` — production сборка фронта;
- `python manage.py runserver` — запуск Django;
- `python manage.py test` — прогон юнит-тестов (по необходимости добавляйте свои).

## Структура

```
backend/                Django проект (accounts, courses)
frontend/               React приложение (страницы, компоненты)
README.md               этот файл
NGROK.md                заметки по демонстрации через ngrok
```

Если появятся вопросы или идеи по улучшению, загляните в `frontend/src/pages` и `backend/courses` — большинство бизнес-логики именно там. Удачной учёбы! 🚀
