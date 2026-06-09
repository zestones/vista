# Vista — developer shortcuts. Run `make` (or `make help`) to list everything.
# The local stack: Supabase (Docker) + edge functions (Deno) + the Vite web app.

SHELL := /bin/bash
DB_URL := postgresql://postgres:postgres@127.0.0.1:54322/postgres
FUNCTIONS_ENV := supabase/functions/.env
WEBHOOK_TARGET := http://localhost:54321/functions/v1/github-webhook

.DEFAULT_GOAL := help

# ─── Dev environment ──────────────────────────────────────────────

.PHONY: dev
dev: supabase ## Start the FULL stack in one command (Supabase + functions + web + webhook tunnel)
	@echo ""
	@echo "  Studio  http://127.0.0.1:54323   ·   Mail  http://127.0.0.1:54324   ·   API  http://127.0.0.1:54321"
	@echo "  Vite prints the app URL below. Ctrl-C stops everything except Supabase ('make stop' to halt it)."
	@echo ""
	@trap 'kill 0' INT TERM EXIT; \
	npx supabase functions serve --env-file $(FUNCTIONS_ENV) --no-verify-jwt & \
	npm run dev & \
	url=$$(grep -E '^SMEE_URL=' $(FUNCTIONS_ENV) 2>/dev/null | sed -E 's/^SMEE_URL=//; s/^"//; s/"$$//'); \
	if [ -n "$$url" ]; then echo "  webhooks: relaying $$url -> github-webhook"; npx --yes smee-client --url "$$url" --target $(WEBHOOK_TARGET) & \
	else echo "  webhooks: SMEE_URL not set in $(FUNCTIONS_ENV) — live webhooks off (manual 'make migrate'/sync still work)"; fi; \
	wait

.PHONY: web
web: ## Run the Vite dev server only
	npm run dev

.PHONY: functions
functions: ## Serve the Supabase edge functions only (watch mode)
	npx supabase functions serve --env-file $(FUNCTIONS_ENV) --no-verify-jwt

.PHONY: webhooks
webhooks: ## Relay GitHub webhooks to the local function (needs SMEE_URL in supabase/functions/.env)
	@url=$$(grep -E '^SMEE_URL=' $(FUNCTIONS_ENV) 2>/dev/null | sed -E 's/^SMEE_URL=//; s/^"//; s/"$$//'); \
	if [ -z "$$url" ]; then echo "Set SMEE_URL=https://smee.io/<channel> in $(FUNCTIONS_ENV) (and as the GitHub App webhook URL)."; exit 1; fi; \
	npx --yes smee-client --url "$$url" --target $(WEBHOOK_TARGET)

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
	./node_modules/.bin/tsc -b

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
