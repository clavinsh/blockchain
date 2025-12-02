# Fabric Network & Gateway

Self-contained Hyperledger Fabric network with REST API gateway in Go.

## Prerequisites

- Docker & Docker Compose
- Fabric binaries (cryptogen, configtxgen) - for first-time setup only

## Quick Start
```bash
# Start everything
./start.sh

# Stop
./stop.sh

# Clean and reset
./clean.sh
```

## What's Included

- **Network**: Fabric network
- **Chaincode**: Insurance smart contracts
- **Gateway**: Go REST API (port 3001)

## API Endpoints

- POST `/api/vehicles/register` - Register vehicle
- GET `/api/vehicles/:id` - Get vehicle
- POST `/api/telemetry/hash` - Submit data hash
- POST `/api/access/grant` - Grant access
- GET `/api/access/:vehicleId/:companyId` - Check access

## Development
```bash
# View gateway logs
docker-compose logs -f fabric-gateway

# Access CLI container
docker exec -it cli bash

# Test chaincode directly
docker exec cli peer chaincode query -C mychannel -n insurance -c '{"Args":["ReadVehicle","VEH_001"]}'
```

