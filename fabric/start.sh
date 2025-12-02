#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Fabric Network & Gateway"
echo "====================================="
echo ""

if [ ! -d "network/organizations" ]; then
    echo "First time setup - generating network artifacts..."
    ./network/scripts/bootstrap.sh
fi

echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for network to be ready..."
sleep 10

echo "Deploying chaincode..."
./network/scripts/deploy-chaincode.sh

echo ""
echo "Fabric Network & Gateway started successfully!"
echo ""
echo "Services:"
echo "  - Fabric Gateway: http://localhost:3001"
echo "  - Fabric Network: Peers on 7051, 9051"
echo ""
echo "To view logs: docker-compose logs -f fabric-gateway"
echo "To stop: ./stop.sh"
