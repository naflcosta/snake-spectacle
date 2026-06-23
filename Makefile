.PHONY: install backend frontend backend-tests frontend-tests test

install:
	cd backend && uv sync
	cd frontend && npm install

backend:
	cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

frontend:
	cd frontend && npm run dev

backend-tests:
	cd backend && uv run pytest

frontend-tests:
	cd frontend && npm run test

test: backend-tests frontend-tests
