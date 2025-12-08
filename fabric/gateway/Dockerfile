FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git gcc musl-dev

# Copy go mod file first
COPY go.mod ./
RUN go mod download || true

# Copy source code
COPY . .

# Download dependencies and build
RUN go mod tidy && go build -o gateway .

# Production image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/gateway /app/gateway

# Config and wallet directories will be mounted
RUN mkdir -p /app/config /app/wallet /app/organizations

EXPOSE 3001

CMD ["/app/gateway"]
