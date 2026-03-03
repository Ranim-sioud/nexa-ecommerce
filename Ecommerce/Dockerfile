# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage (nginx serves static)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html  
# Optional custom nginx.conf
EXPOSE 80