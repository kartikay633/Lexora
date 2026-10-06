FROM node:24-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    flex bison gcc libc6-dev libfl-dev coreutils bash \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY examples/ /app/examples/
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000
USER node
EXPOSE 10000
CMD ["node", "server.js"]
