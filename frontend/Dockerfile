# ══════════════════════════════════════════════════════
# STAGE 1 — Build (Node.js)
# ══════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ══════════════════════════════════════════════════════
# STAGE 2 — Production (nginx)
# nginx.conf: serve SPA + proxy /api → http://backend:8000
# ══════════════════════════════════════════════════════
FROM nginx:1.27-alpine AS production

LABEL org.opencontainers.image.title="Portal TradeHub — Frontend" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.description="React SPA servida por nginx — Portal TradeHub"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
