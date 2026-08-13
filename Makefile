SHELL := /bin/bash

# Загружаем переменные из deploy/.env
include deploy/.env
export

COMPOSE := docker compose
BACKEND_DIR := backend
DEPLOY_DIR := deploy

# Локальная база данных
DATABASE_URL_LOCAL := postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(POSTGRES_PORT)/$(POSTGRES_DB)?sslmode=disable

.PHONY: help
help: ## Показать справку
	@echo "svarg_net make targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: up
up: ## Запустить все сервисы
	cd $(DEPLOY_DIR) && $(COMPOSE) up -d

.PHONY: down
down: ## Остановить все сервисы
	cd $(DEPLOY_DIR) && $(COMPOSE) down

.PHONY: restart
restart: ## Перезапустить все сервисы
	cd $(DEPLOY_DIR) && $(COMPOSE) restart

.PHONY: logs
logs: ## Смотреть логи всех сервисов
	cd $(DEPLOY_DIR) && $(COMPOSE) logs -f

.PHONY: logs-backend
logs-backend: ## Смотреть логи backend
	cd $(DEPLOY_DIR) && $(COMPOSE) logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Смотреть логи frontend
	cd $(DEPLOY_DIR) && $(COMPOSE) logs -f frontend

.PHONY: build
build: ## Собрать все образы
	cd $(DEPLOY_DIR) && $(COMPOSE) build

.PHONY: psql
psql: ## Подключиться к PostgreSQL
	cd $(DEPLOY_DIR) && $(COMPOSE) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

.PHONY: migrate-up
migrate-up: ## Применить все миграции
	cd $(BACKEND_DIR) && goose -dir migrations postgres "$(DATABASE_URL_LOCAL)" up

.PHONY: migrate-down
migrate-down: ## Откатить последнюю миграцию
	cd $(BACKEND_DIR) && goose -dir migrations postgres "$(DATABASE_URL_LOCAL)" down

.PHONY: migrate-status
migrate-status: ## Показать статус миграций
	cd $(BACKEND_DIR) && goose -dir migrations postgres "$(DATABASE_URL_LOCAL)" status

.PHONY: migrate-create
migrate-create: ## Создать новую миграцию (используй: make migrate-create NAME=add_tags)
	cd $(BACKEND_DIR) && goose -dir migrations create $(NAME) sql

.PHONY: backend-dev
backend-dev: ## Запустить backend с hot-reload (Air)
	cd $(BACKEND_DIR) && air

.PHONY: frontend-dev
frontend-dev: ## Запустить frontend с hot-reload
	cd frontend && npm run dev

.PHONY: test
test: ## Запустить тесты backend
	cd $(BACKEND_DIR) && go test ./...

.PHONY: clean
clean: ## Остановить сервисы и удалить тома с данными
	cd $(DEPLOY_DIR) && $(COMPOSE) down -v