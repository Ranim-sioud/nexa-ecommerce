# ─── Stage 1 : builder ────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Si tu as un build step (tsc, etc.)
# RUN npm run build

# ─── Stage 2 : production (léger) ─────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app /app
RUN npm ci --omit=dev --ignore-scripts --prefer-offline

# Create logs directory and give ownership to the node user
RUN mkdir -p /app/logs && chown -R node:node /app/logs

# Permissions + sécurité minimale
USER node

# Lancement migrations + serveur
CMD ["sh", "-c", "npx sequelize-cli db:migrate --debug && npm start"]