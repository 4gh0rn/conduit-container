.PHONY: help build up down restart ps logs logs-backend logs-frontend clean rebuild shell-backend shell-frontend

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

# Variables
COMPOSE_FILE := compose.yml
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
	docker compose -f $(COMPOSE_FILE) build

up: ## Start all services in detached mode
	@echo "$(BLUE)Starting services...$(NC)"
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:8282$(NC)"
	@echo "$(YELLOW)Backend API: http://localhost:8000/api$(NC)"

down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping services...$(NC)"
	docker compose -f $(COMPOSE_FILE) down

restart: ## Restart all services
	@echo "$(BLUE)Restarting services...$(NC)"
	docker compose -f $(COMPOSE_FILE) restart

ps: ## Show status of all containers
	docker compose -f $(COMPOSE_FILE) ps

logs: ## Show logs from all services
	docker compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Show logs from backend service only
	docker compose -f $(COMPOSE_FILE) logs -f $(BACKEND_SERVICE)

logs-frontend: ## Show logs from frontend service only
	docker compose -f $(COMPOSE_FILE) logs -f $(FRONTEND_SERVICE)

shell-backend: ## Open shell in backend container
	docker compose -f $(COMPOSE_FILE) exec $(BACKEND_SERVICE) /bin/bash || docker compose -f $(COMPOSE_FILE) exec $(BACKEND_SERVICE) /bin/sh

shell-frontend: ## Open shell in frontend container
	docker compose -f $(COMPOSE_FILE) exec $(FRONTEND_SERVICE) /bin/sh

clean: ## Remove containers and volumes
	@echo "$(YELLOW)Removing containers and volumes...$(NC)"
	docker compose -f $(COMPOSE_FILE) down -v

rebuild: ## Rebuild containers without cache
	@echo "$(BLUE)Rebuilding containers without cache...$(NC)"
	docker compose -f $(COMPOSE_FILE) build --no-cache

