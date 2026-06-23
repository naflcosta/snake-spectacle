.PHONY: install dev backend frontend backend-tests frontend-tests test

dev:
	trap 'kill 0' INT; \
	(cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) & \
	(cd frontend && npm run dev) & \
	wait

install:
	cd backend && uv sync
	cd frontend && npm install

backend:
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm run dev

backend-tests:
	cd backend && uv run pytest

frontend-tests:
	cd frontend && npm run test

test: backend-tests frontend-tests

test-integration:
	cd backend && uv run pytest tests_integration/
