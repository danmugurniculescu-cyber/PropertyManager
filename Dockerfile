# Stage 1: build React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + frontend dist
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY data/ data/
COPY --from=frontend-builder /app/frontend/dist frontend/dist

EXPOSE 8000
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
