# Backend Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Only copy package metadata to install dependencies first
COPY package*.json ./
RUN npm ci --only=production

# Copy rest of the source
COPY . .

# expose port (should match backend/src/server.js default or env)
EXPOSE 4001

CMD ["node", "src/server.js"]
