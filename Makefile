# --------------------------------------
# 📦 Vonova - Makefile
# Common developer commands
# --------------------------------------

# ⚡️ General Docker Compose Commands
up:
	docker-compose up --build

down:
	docker-compose down

restart: down up

logs:
	docker-compose logs -f

ps:
	docker-compose ps

build:
	docker-compose build

stop:
	docker-compose stop

# ⚡️ Cleanup
prune:
	docker system prune -f

clean-volumes:
	docker volume prune -f

clean-images:
	docker image prune -a -f

# ⚡️ Lint Commands
lint-node:
	find services apps -name package.json -execdir npm run lint \;

lint-python:
	find services -name requirements.txt -execdir black --check . \;

lint:
	@echo "Running linters for all languages..."
	make lint-node
	make lint-python

# ⚡️ Test Commands
test-node:
	find services apps -name package.json -execdir npm test \;

test-python:
	find services -name requirements.txt -execdir pytest \;

test:
	@echo "Running tests for all languages..."
	make test-node
	make test-python

# ⚡️ Utilities
status:
	@echo "Git status for all services and apps:"
	@git status

# ⚡️ Help
help:
	@echo "Usage: make [target]"
	@echo "----------------------------------------------------"
	@echo "Docker Compose:"
	@echo "  up             Start all services (with build)"
	@echo "  down           Stop all services"
	@echo "  restart        Restart all services"
	@echo "  logs           Follow logs"
	@echo "  ps             Show running containers"
	@echo "  build          Build images"
	@echo "  stop           Stop containers"
	@echo "----------------------------------------------------"
	@echo "Cleanup:"
	@echo "  prune          Docker system prune"
	@echo "  clean-volumes  Remove dangling volumes"
	@echo "  clean-images   Remove unused images"
	@echo "----------------------------------------------------"
	@echo "Code Quality:"
	@echo "  lint           Run all linters"
	@echo "  lint-node      Lint Node.js projects"
	@echo "  lint-python    Lint Python services"
	@echo "----------------------------------------------------"
	@echo "Testing:"
	@echo "  test           Run all tests"
	@echo "  test-node      Test Node.js services/apps"
	@echo "  test-python    Test Python services"
	@echo "----------------------------------------------------"
	@echo "Utilities:"
	@echo "  status         Show Git status"
