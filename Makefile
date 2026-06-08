# Vista — developer shortcuts. Run `make` (or `make help`) to list everything.
# The local stack: Supabase (Docker) + edge functions (Deno) + the Vite web app.

SHELL := /bin/bash
DB_URL := postgresql://postgres:postgres@127.0.0.1:54322/postgres
FUNCTIONS_ENV := supabase/functions/.env

.DEFAULT_GOAL := help

# ─── Dev environment ──────────────────────────────────────────────

.PHONY: dev
dev: supabase ## Start the FULL stack in one command (Supabase + functions + web)
	@echo ""
	@echo "  Studio  http://127.0.0.1:54323   ·   Mail  http://127.0.0.1:54324   ·   API  http://127.0.0.1:54321"
	@echo "  Vite prints the app URL below. Ctrl-C stops functions + web (Supabase keeps running; 'make stop' to halt it)."
	@echo ""
	@trap 'kill 0' INT TERM EXIT; \
	npx supabase functions serve --env-file $(FUNCTIONS_ENV) --no-verify-jwt & \
	npm run dev & \
	wait

.PHONY: web
web: ## Run the Vite dev server only
	npm run dev

.PHONY: functions
functions: ## Serve the Supabase edge functions only (watch mode)
	npx supabase functions serve --env-file $(FUNCTIONS_ENV) --no-verify-jwt

.PHONY: supabase
supabase: ## Start the local Supabase stack (db, api, studio, mail)
	npx supabase start

.PHONY: stop
stop: ## Stop the local Supabase stack
	npx supabase stop

.PHONY: status
status: ## Show local Supabase status + service URLs
	npx supabase status

# ─── Database ─────────────────────────────────────────────────────

.PHONY: migrate
migrate: ## Apply pending migrations (additive — keeps your local data)
	npx supabase migration up --local

.PHONY: types
types: ## Regenerate src/types/database.types.ts from the local DB
	npx supabase gen types typescript --local > src/types/database.types.ts
	@sed -i '/^Connecting to /d' src/types/database.types.ts
	@echo "✓ database.types.ts regenerated"

.PHONY: psql
psql: ## Open a psql shell on the local DB
	psql "$(DB_URL)"

.PHONY: db-test
db-test: ## Run the pgTAP policy tests (transactional, non-destructive)
	npx supabase test db

.PHONY: db-reset
db-reset: ## DESTRUCTIVE: drop + rebuild the local DB from migrations (erases local data)
	@read -p "This ERASES your local data. Continue? [y/N] " ok; \
	if [ "$$ok" = "y" ] || [ "$$ok" = "Y" ]; then npx supabase db reset; else echo "aborted"; fi

# ─── Quality gates ────────────────────────────────────────────────

.PHONY: lint
lint: ## ESLint
	npm run lint

.PHONY: typecheck
typecheck: ## TypeScript type-check
	npx tsc -b

.PHONY: test
test: ## Unit + integration tests (vitest)
	npm test

.PHONY: format
format: ## Prettier (write)
	npm run format

.PHONY: check
check: lint typecheck test db-test ## Run every gate: lint + typecheck + test + pgTAP
	@echo "✓ all checks passed"

# ─── Setup ────────────────────────────────────────────────────────

.PHONY: install
install: ## Install npm dependencies
	npm install

.PHONY: help
help: ## Show this help
	@echo "Vista — make targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-11s\033[0m %s\n", $$1, $$2}'
