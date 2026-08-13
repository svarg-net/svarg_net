# SVARG_NET — Блог

Блог на Go + Next.js + PostgreSQL.

## Технологии

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Backend | Go | 1.25 |
| Frontend | Next.js | 16.2.12 |
| База данных | PostgreSQL | 18 |
| Оркестрация | Docker Compose | - |
| Миграции | Goose | - |
| Hot-reload (backend) | Air | - |

## Структура проекта

```text
svarg_net/
├── backend/          # Go API
│   ├── cmd/api/      # точка входа
│   ├── internal/     # внутренние пакеты
│   │   ├── config/   # конфигурация
│   │   ├── handler/  # HTTP обработчики
│   │   ├── logger/   # логирование
│   │   ├── middleware/# middleware
│   │   ├── model/    # модели данных
│   │   ├── repository/# работа с БД
│   │   ├── router/   # роутинг
│   │   └── service/  # бизнес-логика
│   ├── migrations/   # SQL миграции
│   ├── .air.toml     # конфиг Air (hot-reload)
│   └── Dockerfile
├── frontend/         # Next.js приложение
│   ├── app/          # App Router страницы
│   ├── lib/          # утилиты и API клиент
│   ├── public/       # статические файлы
│   └── Dockerfile
├── deploy/           # инфраструктура
│   ├── docker-compose.yml
│   ├── .env.example
│   └── .env.production.example
├── Makefile          # команды для управления проектом
└── README.md