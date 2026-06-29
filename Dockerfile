# Stage 1: Build the React client static assets
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Serve using the Node/Express backend
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN npm ci --prefix server --only=production
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server/server.js"]
