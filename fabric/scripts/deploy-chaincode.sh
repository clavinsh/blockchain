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

print_step "Deploying chaincode using Chaincode as a Service (ccaas)..."

# Step 1: Package the chaincode using ccaas format
print_step "Packaging chaincode for ccaas..."
./scripts/package-ccaas.sh

# Step 2: Build and start the chaincode container
print_step "Building chaincode Docker image..."
docker compose build vehicle-chaincode

print_step "Starting chaincode container..."
docker compose up -d vehicle-chaincode

# Wait for chaincode to be ready
print_step "Waiting for chaincode service to be ready..."
MAX_RETRY=30
RETRY=0
while [ $RETRY -lt $MAX_RETRY ]; do
    if docker exec vehicle-chaincode sh -c "command -v nc >/dev/null && nc -z localhost 9999" 2>/dev/null; then
        echo "Chaincode service is ready!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Waiting for chaincode service... attempt $RETRY/$MAX_RETRY"
    sleep 1
done

if [ $RETRY -eq $MAX_RETRY ]; then
    print_warning "Could not verify chaincode service with netcat, continuing anyway..."
fi

# Step 3: Install chaincode package on peer
print_step "Installing chaincode package on peer..."
docker exec cli peer lifecycle chaincode install \
    /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHAINCODE_NAME}.tar.gz

# Step 4: Get package ID
print_step "Getting package ID..."
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r ".installed_chaincodes[] | select(.label==\"${CHAINCODE_LABEL}\") | .package_id")
echo "Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
    print_error "Failed to get package ID"
    exit 1
fi

# Step 5: Update chaincode container with correct package ID
print_step "Updating chaincode container with package ID..."
docker compose stop vehicle-chaincode
docker compose rm -f vehicle-chaincode

# Update docker compose to use the correct package ID
sed -i "s/CORE_CHAINCODE_ID_NAME=vehicle_1.0:.*/CORE_CHAINCODE_ID_NAME=${PACKAGE_ID}/" docker-compose.yml

docker compose up -d vehicle-chaincode

# Wait for chaincode to restart
print_step "Waiting for chaincode service to restart..."
sleep 3

# Step 6: Approve chaincode for Org1
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

# Step 7: Check commit readiness
print_step "Checking commit readiness..."
docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence $SEQUENCE \
    --output json

# Step 8: Commit chaincode definition
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

# Step 9: Verify deployment
print_step "Verifying chaincode is committed..."
docker exec cli peer lifecycle chaincode querycommitted \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME

# Step 10: Test chaincode
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
print_step "Chaincode deployed successfully using ccaas!"
echo "Chaincode is running in container: vehicle-chaincode"
echo "Run './scripts/setup-gateway.sh' to start the gateway API."
