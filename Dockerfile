FROM node:20-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM golang:1.24-alpine AS backend
WORKDIR /build/backend
COPY backend/go.mod backend/go.sum .
RUN go mod download
COPY backend/ .
COPY --from=frontend /build/backend/static ./static
RUN go build -o server .

FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend /build/backend/server .
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]
