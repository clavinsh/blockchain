FROM golang:1.22-alpine AS builder

WORKDIR /chaincode

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o vehicle-chaincode .


FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /chaincode/vehicle-chaincode .

EXPOSE 9999

ENV CHAINCODE_ID=""
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999

CMD ["./vehicle-chaincode"]
