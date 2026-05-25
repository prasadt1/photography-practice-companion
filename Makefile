.PHONY: verify-phase1 playground agent-import frontend-build bootstrap-mongodb api-dev api-stop api-status frontend-dev seed-demo deploy-api deploy-hosting

verify-phase1:
	@bash scripts/verify-phase1-gate.sh

playground:
	@if [ -f gcp-service-account.json ]; then \
	  export GOOGLE_APPLICATION_CREDENTIALS="$(CURDIR)/gcp-service-account.json"; \
	fi; \
	cd app && uvx google-agents-cli playground

agent-import:
	@cd app && uv run python -c "from orchestrator.agent import root_agent; print(root_agent.name); print('tools:', len(root_agent.tools))"

frontend-build:
	@cd frontend && npm run build

bootstrap-mongodb:
	@python3 scripts/bootstrap-mongodb.py

vertex-check:
	@python3 test_vertex_ai.py

# ADK playground uses 8080 — Coach API uses 8081 to avoid conflict
API_PORT ?= 8081

api-status:
	@curl -sf "http://127.0.0.1:$(API_PORT)/health" && echo || echo "Coach API not responding on port $(API_PORT)"

api-stop:
	@pids=$$(lsof -ti :$(API_PORT) 2>/dev/null); \
	if [ -n "$$pids" ]; then kill $$pids && echo "Stopped process(es) on port $(API_PORT)"; \
	else echo "Nothing listening on port $(API_PORT)"; fi

api-dev:
	@if curl -sf "http://127.0.0.1:$(API_PORT)/health" 2>/dev/null | grep -q orchestratorChat; then \
		echo "Coach API already running at http://127.0.0.1:$(API_PORT) (use make api-stop to restart)"; \
		exit 0; \
	fi; \
	cd app && uv sync && uv run uvicorn api.server:app --reload --host 127.0.0.1 --port $(API_PORT)

frontend-dev:
	@cd frontend && npm run dev

seed-demo:
	@python3 scripts/seed-demo-data.py

# Production deploy — see docs/deploy.md
API_URL ?=

deploy-api:
	@bash scripts/deploy-coach-api.sh

deploy-hosting: frontend-build-prod
	@bash scripts/ensure-firebase-hosting.sh
	@firebase deploy --only hosting

frontend-build-prod:
	@bash scripts/frontend-build-prod.sh
