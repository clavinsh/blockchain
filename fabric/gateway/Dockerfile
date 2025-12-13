FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git gcc musl-dev

COPY go.mod ./
RUN go mod download || true

COPY . .

RUN go mod tidy && go build -o gateway .


FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/gateway /app/gateway

RUN mkdir -p /app/config /app/wallet /app/organizations

EXPOSE 3001

CMD ["/app/gateway"]
