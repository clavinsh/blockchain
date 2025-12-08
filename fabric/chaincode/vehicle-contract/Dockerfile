FROM golang:1.21-alpine AS builder

WORKDIR /chaincode

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the chaincode
RUN CGO_ENABLED=0 GOOS=linux go build -o chaincode .

# Production image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /chaincode

COPY --from=builder /chaincode/chaincode /chaincode/chaincode

EXPOSE 9999

CMD ["/chaincode/chaincode"]
