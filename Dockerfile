# ==============================================================================
# Multi-stage Dockerfile for LLM-Prop (FastAPI + React Frontend)
# ==============================================================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python Backend & Package Application
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install curl for health checks / downloads
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with CPU-optimized PyTorch
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Copy source code and datasets
COPY backend ./backend
COPY config ./config
COPY data ./data
COPY models ./models
COPY scripts ./scripts

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Start uvicorn with environment PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
