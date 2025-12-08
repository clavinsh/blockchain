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

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

CHANNEL_NAME="mychannel"
CHAINCODE_NAME="vehicle"
CHAINCODE_VERSION="1.0"
CHAINCODE_LABEL="${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
SEQUENCE=1
CHAINCODE_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/vehicle-contract"

print_step "Downloading chaincode dependencies..."
docker exec cli sh -c "cd ${CHAINCODE_PATH} && go mod tidy && go mod vendor"

print_step "Packaging chaincode..."
docker exec cli peer lifecycle chaincode package \
    /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHAINCODE_NAME}.tar.gz \
    --path ${CHAINCODE_PATH} \
    --lang golang \
    --label ${CHAINCODE_LABEL}

print_step "Installing chaincode on peer..."
docker exec cli peer lifecycle chaincode install \
    /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHAINCODE_NAME}.tar.gz 2>&1 || echo "Chaincode may already be installed, continuing..."

print_step "Getting package ID..."
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r ".installed_chaincodes[] | select(.label==\"${CHAINCODE_LABEL}\") | .package_id")
echo "Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
    print_error "Failed to get package ID"
    exit 1
fi

print_step "Approving chaincode for Org1..."
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

print_step "Committing chaincode definition..."
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
docker exec cli peer lifecycle chaincode querycommitted \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME

print_step "Testing chaincode with a sample invoke..."
docker exec cli peer chaincode invoke \
    -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    -c '{"function":"RegisterVehicle","Args":["test-vehicle-001","VIN123TEST","owner-001"]}' \
    --waitForEvent

sleep 2

print_step "Querying test vehicle..."
docker exec cli peer chaincode query \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    -c '{"function":"ReadVehicle","Args":["test-vehicle-001"]}'

echo ""
print_step "Chaincode deployed successfully!"
echo "Run './scripts/setup-gateway.sh' to start the gateway API."
