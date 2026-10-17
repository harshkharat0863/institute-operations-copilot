# Multi-stage Dockerfile for Institute Operations Copilot (Single Unified Deployment)

# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve Frontend & Backend via FastAPI + Uvicorn
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend ./backend

# Copy compiled frontend from Stage 1 into /app/dist
COPY --from=frontend-builder /app/dist ./dist

# Expose port (Render, Railway, Fly.io, Cloud Run inject PORT env var)
ENV PORT=8000
EXPOSE 8000

# Start unified FastAPI server
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
