# AI Infra - Backend

Backend корпоративной платформы ИИ-агентов на **FastAPI, SQLAlchemy и PostgreSQL**.

## Назначение

- Регистрация пользователей, JWT-аутентификация и защита API.
- CRUD агентов и ресурсов Model, RAG, MCP.
- Проверка владельца при изменении и удалении агентов.
- Хранение чатов и обращение к настроенной LLM-модели.

RAG и MCP пока представлены конфигурациями без выполнения поиска и инструментов.

## Структура

- `app/main.py` - инициализация FastAPI, CORS и маршрутов.
- `app/routes/` - роуты.
- `app/dependencies/auth.py` - получение текущего пользователя.
- `app/models.py`, `app/schemas.py` - ORM-модели и Pydantic-схемы.
- `app/database.py` - подключение к БД и сессии.
- `app/security.py` - пароли и JWT.
- `app/chat_service.py` - запросы к LLM-провайдеру.

## Запуск

Рекомендуемый способ - из корня проекта:

```bash
docker compose up --build
```

Для локального запуска backend установите зависимости из `backend/requirements.txt`, настройте переменные окружения и выполните из `backend/`:

```bash
uvicorn app.main:app --reload
```

Основные переменные окружения: `DATABASE_URL`, `JWT_SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `FRONTEND_ORIGIN`. Значения и общая инструкция - в корневом README.

## Документация API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Полный список endpoints, схемы запросов и ответов поддерживаются автоматически через OpenAPI и здесь не дублируются.
