# Stage 1: Compile tiny static Go binary (zero external dependencies)
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /file-storage main.go

# Stage 2: Minimal Alpine runtime (~10MB image, ~6-8MB RAM usage!)
FROM alpine:3.20
WORKDIR /app
RUN mkdir -p /storage/pofology /storage/bio-link
COPY --from=builder /file-storage /app/file-storage

ENV PORT=3010
ENV STORAGE_DIR=/storage
EXPOSE 3010

CMD ["/app/file-storage"]
