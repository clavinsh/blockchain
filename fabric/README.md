# UBI Fabric - Dockerized Hyperledger Fabric Network

A fully dockerized Hyperledger Fabric network for Usage-Based Insurance (UBI) with vehicle telemetry tracking.

## Prerequisites

Only **Docker** and **Docker Compose** are required on your host machine. Nothing else needs to be installed.

```bash
# Check Docker is installed
docker --version
docker-compose --version
```

## Project Structure

```
ubi-fabric/
├── docker-compose.yml          # Main orchestration file
├── configtx/
│   ├── configtx.yaml           # Channel configuration
│   └── crypto-config.yaml      # Crypto material generation config
├── chaincode/
│   └── vehicle-contract/       # Your chaincode (runs as external service)
│       ├── Dockerfile
│       ├── go.mod
│       ├── main.go
│       ├── models.go
│       └── vehicleContract.go
├── gateway/                    # Go REST API
│   ├── Dockerfile
│   ├── go.mod
│   ├── main.go
│   ├── config/
│   │   └── connection-org1.yaml
│   ├── fabric/
│   │   └── client.go
│   ├── handlers/
│   │   ├── access.go
│   │   ├── telemetry.go
│   │   └── vehicle.go
│   ├── models/
│   │   └── requests.go
│   └── wallet/                 # Created by setup script
├── scripts/
│   ├── network-up.sh           # Start network + create channel
│   ├── deploy-chaincode.sh     # Deploy chaincode
│   ├── setup-gateway.sh        # Setup wallet + start gateway
│   ├── network-down.sh         # Tear down everything
│   └── test-api.sh             # Test the API endpoints
├── organizations/              # Generated crypto materials
└── channel-artifacts/          # Generated channel artifacts
```

## Quick Start

### 1. Start the Network

```bash
./scripts/network-up.sh
```

This will:
- Generate crypto materials (certificates, keys)
- Create the genesis block
- Start CA, Orderer, Peer, CouchDB containers
- Create and join the channel

### 2. Deploy Chaincode

```bash
./scripts/deploy-chaincode.sh
```

This will:
- Build the chaincode container
- Package it as external chaincode
- Install, approve, and commit to the channel
- Start the chaincode service

### 3. Setup and Start Gateway

```bash
./scripts/setup-gateway.sh
```

This will:
- Create admin wallet identity from generated certs
- Start the gateway API container

### 4. Test the API

```bash
./scripts/test-api.sh
```

Or manually:

```bash
# Health check
curl http://localhost:3001/health

# Register a vehicle
curl -X POST http://localhost:3001/api/vehicles/register \
  -H "Content-Type: application/json" \
  -d '{"onChainId": "v1", "vin": "ABC123", "ownerUserId": "user1"}'

# Read vehicle
curl http://localhost:3001/api/vehicles/v1
```

## Containers

| Container | Port | Description |
|-----------|------|-------------|
| ca_org1 | 7054 | Certificate Authority |
| orderer.example.com | 7050, 7053 | Ordering service |
| peer0.org1.example.com | 7051 | Peer node |
| couchdb0 | 5984 | State database (rich queries) |
| cli | - | Admin operations |
| chaincode-vehicle | 9999 | External chaincode service |
| gateway | 3001 | REST API |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/vehicles/register | Register a new vehicle |
| GET | /api/vehicles/:onChainId | Get vehicle details |
| POST | /api/telemetry/hash | Submit telemetry data hash |
| POST | /api/access/grant | Grant access to insurance company |
| GET | /api/access/:onChainId/:companyId | Check access grant |

## Shutdown

```bash
./scripts/network-down.sh
```

## Troubleshooting

### Check container logs
```bash
docker-compose logs -f peer0.org1.example.com
docker-compose logs -f gateway
docker-compose logs -f chaincode-vehicle
```

### Restart gateway
```bash
docker-compose restart gateway
```

### Full reset
```bash
./scripts/network-down.sh
rm -rf organizations/ channel-artifacts/ gateway/wallet/
./scripts/network-up.sh
./scripts/deploy-chaincode.sh
./scripts/setup-gateway.sh
```

## Development

To modify the chaincode:
1. Edit files in `chaincode/vehicle-contract/`
2. Increment version in `deploy-chaincode.sh`
3. Run `./scripts/deploy-chaincode.sh` again

To modify the gateway:
1. Edit files in `gateway/`
2. Run `docker-compose build gateway && docker-compose up -d gateway`
