FROM golang:1.22-alpine AS builder

WORKDIR /chaincode

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the chaincode
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o vehicle-chaincode .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /chaincode/vehicle-chaincode .

# Expose chaincode port
EXPOSE 9999

# Set environment variable for chaincode ID (will be set at runtime)
ENV CHAINCODE_ID=""
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999

# Run the chaincode
CMD ["./vehicle-chaincode"]
