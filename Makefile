.PHONY: help build build-prod up up-prod down down-prod restart ps ps-prod logs logs-prod logs-backend logs-frontend clean rebuild shell-backend shell-frontend

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Variables
COMPOSE_FILE_DEV := compose.dev.yml
COMPOSE_FILE_PROD := compose.prod.yml
BACKEND_SERVICE := backend
FRONTEND_SERVICE := frontend

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

build: ## Build all container images
	@echo "$(BLUE)Building containers...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) build

build-prod: ## Pull production images (no local build)
	@echo "$(BLUE)Pulling production images...$(NC)"
	docker compose -f $(COMPOSE_FILE_PROD) pull

up: ## Start all services in detached mode
	@echo "$(BLUE)Starting services...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:8282$(NC)"
	@echo "$(YELLOW)Backend API: http://localhost:8000/api$(NC)"

up-prod: ## Start production stack (pull + up -d)
	@echo "$(BLUE)Starting production stack...$(NC)"
	docker compose -f $(COMPOSE_FILE_PROD) pull
	docker compose -f $(COMPOSE_FILE_PROD) up -d --remove-orphans

down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping services...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) down

down-prod: ## Stop production stack
	@echo "$(YELLOW)Stopping production stack...$(NC)"
	docker compose -f $(COMPOSE_FILE_PROD) down

restart: ## Restart all services
	@echo "$(BLUE)Restarting services...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) restart

ps: ## Show status of all containers
	docker compose -f $(COMPOSE_FILE_DEV) ps

ps-prod: ## Show status of production stack
	docker compose -f $(COMPOSE_FILE_PROD) ps

logs: ## Show logs from all services
	docker compose -f $(COMPOSE_FILE_DEV) logs -f

logs-prod: ## Show logs from production stack
	docker compose -f $(COMPOSE_FILE_PROD) logs -f

logs-backend: ## Show logs from backend service only
	docker compose -f $(COMPOSE_FILE_DEV) logs -f $(BACKEND_SERVICE)

logs-frontend: ## Show logs from frontend service only
	docker compose -f $(COMPOSE_FILE_DEV) logs -f $(FRONTEND_SERVICE)

shell-backend: ## Open shell in backend container
	docker compose -f $(COMPOSE_FILE_DEV) exec $(BACKEND_SERVICE) /bin/bash || docker compose -f $(COMPOSE_FILE_DEV) exec $(BACKEND_SERVICE) /bin/sh

shell-frontend: ## Open shell in frontend container
	docker compose -f $(COMPOSE_FILE_DEV) exec $(FRONTEND_SERVICE) /bin/sh

clean: ## Remove containers and volumes
	@echo "$(YELLOW)Removing containers and volumes...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) down -v

rebuild: ## Rebuild containers without cache
	@echo "$(BLUE)Rebuilding containers without cache...$(NC)"
	docker compose -f $(COMPOSE_FILE_DEV) build --no-cache

