#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

CHANNEL_NAME="mychannel"
CHAINCODE_NAME="vehicle"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_step "Bringing down any existing network..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true

print_step "Removing old crypto materials..."
rm -rf organizations/ordererOrganizations
rm -rf organizations/peerOrganizations
rm -rf channel-artifacts/*

print_step "Generating crypto materials using cryptogen..."
docker run --rm \
    -v "$(pwd)/configtx:/configtx" \
    -v "$(pwd)/organizations:/organizations" \
    hyperledger/fabric-tools:2.5 \
    cryptogen generate --config=/configtx/crypto-config.yaml --output=/organizations

print_step "Generating genesis block..."
docker run --rm \
    -v "$(pwd)/configtx:/configtx" \
    -v "$(pwd)/organizations:/organizations" \
    -v "$(pwd)/channel-artifacts:/channel-artifacts" \
    -e FABRIC_CFG_PATH=/configtx \
    hyperledger/fabric-tools:2.5 \
    configtxgen -profile TwoOrgsApplicationGenesis -outputBlock /channel-artifacts/genesis.block -channelID $CHANNEL_NAME

print_step "Starting the network..."
docker-compose up -d ca_org1 orderer.example.com couchdb0 peer0.org1.example.com cli

print_step "Waiting for containers to be ready..."
sleep 10

print_step "Joining orderer to channel..."
docker exec cli osnadmin channel join \
    --channelID $CHANNEL_NAME \
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/genesis.block \
    -o orderer.example.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

print_step "Joining peer to channel..."
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/genesis.block

print_step "Setting anchor peer..."
docker exec cli peer channel update \
    -o orderer.example.com:7050 \
    -c $CHANNEL_NAME \
    -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org1MSPanchors.tx \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    2>/dev/null || print_warning "Anchor peer update skipped (may already be set)"

echo ""
print_step "Network is up! Run './scripts/deploy-chaincode.sh' to deploy chaincode."
