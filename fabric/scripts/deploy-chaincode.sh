#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

CHANNEL_NAME="mychannel"
CHAINCODE_NAME="vehicle"
CHAINCODE_VERSION="1.0"
SEQUENCE=1
CHAINCODE_ADDRESS="chaincode-vehicle:9999"

print_step "Building chaincode container..."
docker-compose build chaincode-vehicle

print_step "Creating chaincode package for external service..."

# Create connection.json for external chaincode
cat > /tmp/connection.json << EOF
{
    "address": "${CHAINCODE_ADDRESS}",
    "dial_timeout": "10s",
    "tls_required": false
}
EOF

# Create metadata.json
cat > /tmp/metadata.json << EOF
{
    "type": "external",
    "label": "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
}
EOF

# Package it
cd /tmp
tar cfz code.tar.gz connection.json
tar cfz ${CHAINCODE_NAME}.tar.gz metadata.json code.tar.gz
cd -

# Copy to channel-artifacts for CLI access
cp /tmp/${CHAINCODE_NAME}.tar.gz channel-artifacts/

print_step "Installing chaincode on peer..."
docker exec cli peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHAINCODE_NAME}.tar.gz

print_step "Getting package ID..."
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
echo "Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
    print_error "Failed to get package ID"
    exit 1
fi

# Update docker-compose with correct CHAINCODE_ID
print_step "Updating chaincode container environment..."
export CHAINCODE_ID=$PACKAGE_ID

print_step "Starting chaincode container..."
docker-compose up -d chaincode-vehicle

sleep 5

print_step "Approving chaincode for org..."
docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --package-id $PACKAGE_ID \
    --sequence $SEQUENCE \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

print_step "Checking commit readiness..."
docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence $SEQUENCE \
    --output json

print_step "Committing chaincode..."
docker exec cli peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence $SEQUENCE \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

print_step "Verifying chaincode is committed..."
docker exec cli peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME

echo ""
print_step "Chaincode deployed! Run './scripts/setup-gateway.sh' to setup the gateway."
