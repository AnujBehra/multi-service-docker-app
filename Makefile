# ===========================================
# Multi-Service Docker Application
# Makefile for Common Operations
# ===========================================

.PHONY: help build up down restart logs clean dev prod monitoring admin backup test lint

# Default target
help:
	@echo "=========================================="
	@echo "Multi-Service Docker Application"
	@echo "=========================================="
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  dev          Start development environment with hot reload"
	@echo "  dev-down     Stop development environment"
	@echo "  dev-logs     View development logs"
	@echo ""
	@echo "Production:"
	@echo "  build        Build all production images"
	@echo "  up           Start production services"
	@echo "  down         Stop all services"
	@echo "  restart      Restart all services"
	@echo "  logs         View production logs"
	@echo ""
	@echo "Profiles:"
	@echo "  monitoring   Start with monitoring stack (Prometheus, Grafana, Loki)"
	@echo "  admin        Start with admin tools (pgAdmin, Redis Commander)"
	@echo "  full         Start with all profiles"
	@echo ""
	@echo "Maintenance:"
	@echo "  backup       Run database backup"
	@echo "  restore      Restore from backup (requires BACKUP_FILE)"
	@echo "  clean        Remove all containers, volumes, and images"
	@echo "  prune        Docker system prune"
	@echo ""
	@echo "Quality:"
	@echo "  test         Run tests"
	@echo "  lint         Run linting"
	@echo "  ssl          Generate SSL certificates"
	@echo ""
	@echo "=========================================="

# ===========================================
# Development
# ===========================================

dev:
	@echo "Starting development environment..."
	@cp -n .env.development .env 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml up --build

dev-detached:
	@echo "Starting development environment (detached)..."
	@cp -n .env.development .env 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml up -d --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-clean:
	docker-compose -f docker-compose.dev.yml down -v --rmi local

# ===========================================
# Production
# ===========================================

build:
	@echo "Building production images..."
	docker-compose -f docker-compose.prod.yml build

up:
	@echo "Starting production services..."
	@cp -n .env.production .env 2>/dev/null || true
	docker-compose -f docker-compose.prod.yml up -d

down:
	docker-compose -f docker-compose.prod.yml down

restart:
	docker-compose -f docker-compose.prod.yml restart

logs:
	docker-compose -f docker-compose.prod.yml logs -f

status:
	docker-compose -f docker-compose.prod.yml ps

# ===========================================
# Profiles
# ===========================================

monitoring:
	@echo "Starting with monitoring stack..."
	docker-compose -f docker-compose.prod.yml --profile monitoring up -d

admin:
	@echo "Starting with admin tools..."
	docker-compose -f docker-compose.prod.yml --profile admin up -d

full:
	@echo "Starting all services with all profiles..."
	docker-compose -f docker-compose.prod.yml --profile monitoring --profile admin up -d

# ===========================================
# Backup & Restore
# ===========================================

backup:
	@echo "Running database backup..."
	docker-compose -f docker-compose.prod.yml --profile backup run --rm backup

restore:
ifndef BACKUP_FILE
	@echo "Error: BACKUP_FILE is required"
	@echo "Usage: make restore BACKUP_FILE=backup_20231225_120000.sql.gz"
	@exit 1
endif
	@echo "Restoring from $(BACKUP_FILE)..."
	docker-compose -f docker-compose.prod.yml exec -T postgres \
		sh -c 'gunzip -c /backups/$(BACKUP_FILE) | psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

# ===========================================
# Maintenance
# ===========================================

clean:
	@echo "Cleaning up everything..."
	docker-compose -f docker-compose.prod.yml down -v --rmi all
	docker-compose -f docker-compose.dev.yml down -v --rmi all

prune:
	@echo "Pruning Docker system..."
	docker system prune -af --volumes

ssl:
	@echo "Generating SSL certificates..."
	chmod +x ./scripts/generate-ssl.sh
	./scripts/generate-ssl.sh

# ===========================================
# Quality
# ===========================================

test:
	@echo "Running tests..."
	cd backend && npm test
	cd frontend && npm test -- --watchAll=false

lint:
	@echo "Running linters..."
	cd backend && npm run lint
	cd frontend && npm run lint 2>/dev/null || true

# ===========================================
# Database
# ===========================================

db-shell:
	docker-compose -f docker-compose.prod.yml exec postgres psql -U appuser -d appdb

redis-shell:
	docker-compose -f docker-compose.prod.yml exec redis redis-cli

# ===========================================
# Health
# ===========================================

health:
	@echo "Checking service health..."
	@curl -s http://localhost/health | python3 -m json.tool 2>/dev/null || echo "Services not available"

# ===========================================
# Quick shortcuts
# ===========================================

start: up
stop: down
