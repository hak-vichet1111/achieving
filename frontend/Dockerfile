# Multi-stage build for Vite React frontend
FROM node:22-alpine AS build
WORKDIR /app

# Build-time API base (optional)
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# keep the production deploy
# FROM nginx:alpine
# COPY --from=build /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx","-g","daemon off;"]