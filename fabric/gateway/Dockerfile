FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git gcc musl-dev

# Copy go mod files first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the gateway
RUN CGO_ENABLED=0 GOOS=linux go build -o gateway .

# Production image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/gateway /app/gateway

# Config and wallet directories will be mounted
RUN mkdir -p /app/config /app/wallet /app/organizations

EXPOSE 3001

CMD ["/app/gateway"]
