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
docker compose down --volumes --remove-orphans 2>/dev/null || true

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

# Fix permissions so non-root user can read the files
print_step "Fixing permissions on generated files..."
sudo chown -R $(id -u):$(id -g) organizations/ 2>/dev/null || chmod -R a+r organizations/

print_step "Generating genesis block..."
docker run --rm \
    -v "$(pwd)/configtx:/configtx" \
    -v "$(pwd)/organizations:/organizations" \
    -v "$(pwd)/channel-artifacts:/channel-artifacts" \
    -e FABRIC_CFG_PATH=/configtx \
    hyperledger/fabric-tools:2.5 \
    configtxgen -profile TwoOrgsApplicationGenesis -outputBlock /channel-artifacts/genesis.block -channelID $CHANNEL_NAME

print_step "Starting the network..."
docker compose up -d ca_org1 orderer.example.com couchdb0 peer0.org1.example.com cli

# Wait for CouchDB to be ready
print_step "Waiting for CouchDB to be ready..."
MAX_RETRY=30
RETRY=0
while [ $RETRY -lt $MAX_RETRY ]; do
    if docker exec couchdb0 curl -sf http://localhost:5984/_up > /dev/null 2>&1; then
        echo "CouchDB is ready!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Waiting for CouchDB... attempt $RETRY/$MAX_RETRY"
    sleep 1
done

if [ $RETRY -eq $MAX_RETRY ]; then
    print_error "CouchDB failed to start"
    exit 1
fi

# Wait for peer to be ready
print_step "Waiting for peer to be ready..."
MAX_RETRY=30
RETRY=0
while [ $RETRY -lt $MAX_RETRY ]; do
    # Check if peer is responding to lifecycle chaincode queryinstalled command
    # This will fail gracefully if peer is not ready but succeed once it is
    if docker exec cli peer lifecycle chaincode queryinstalled > /dev/null 2>&1; then
        echo "Peer is ready!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Waiting for peer... attempt $RETRY/$MAX_RETRY"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRY ]; then
    print_error "Peer failed to start"
    exit 1
fi

# Wait for orderer to be ready
print_step "Waiting for orderer to be ready..."
MAX_RETRY=30
RETRY=0
while [ $RETRY -lt $MAX_RETRY ]; do
    if docker exec cli osnadmin channel list \
        -o orderer.example.com:7053 \
        --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
        --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt \
        --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key \
        > /dev/null 2>&1; then
        echo "Orderer is ready!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Waiting for orderer... attempt $RETRY/$MAX_RETRY"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRY ]; then
    print_error "Orderer failed to start"
    exit 1
fi

print_step "Joining orderer to channel..."
docker exec cli osnadmin channel join \
    --channelID $CHANNEL_NAME \
    --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/genesis.block \
    -o orderer.example.com:7053 \
    --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt \
    --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

# Verify orderer joined
print_step "Verifying orderer channel membership..."
MAX_RETRY=10
RETRY=0
while [ $RETRY -lt $MAX_RETRY ]; do
    if docker exec cli osnadmin channel list \
        -o orderer.example.com:7053 \
        --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
        --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt \
        --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key \
        | grep -q "$CHANNEL_NAME"; then
        echo "Orderer successfully joined channel!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Verifying orderer joined channel... attempt $RETRY/$MAX_RETRY"
    sleep 1
done

if [ $RETRY -eq $MAX_RETRY ]; then
    print_error "Failed to verify orderer joined channel"
    exit 1
fi

print_step "Joining peer to channel..."
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/genesis.block

# Verify peer joined  
print_step "Verifying peer channel membership..."
docker exec cli peer channel list

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
