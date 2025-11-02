# Multi-stage build for Go backend
FROM golang:1.23-alpine AS build
WORKDIR /app

# Copy backend module and source
COPY backend/ ./backend/

# Download dependencies
RUN cd backend && go mod download

# Build static binary
RUN cd backend && CGO_ENABLED=0 GOOS=linux go build -o /app/achieving-backend .

# keep the production deploy
# FROM alpine:3.19
# WORKDIR /app
# RUN apk add --no-cache ca-certificates && update-ca-certificates
# COPY --from=build /app/achieving-backend /usr/local/bin/achieving-backend

# EXPOSE 8080
# ENV PORT=8080
# CMD ["achieving-backend"]