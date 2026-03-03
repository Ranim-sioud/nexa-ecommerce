FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Optional: run build if backend has one

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
RUN npm ci --omit=dev --production

# Run migrations + start (simple way)
#CMD npx sequelize-cli db:migrate --env production && npm start
CMD ["tail", "-f", "/dev/null"]   # or sleep infinity