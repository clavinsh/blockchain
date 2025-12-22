#!/bin/bash

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_step "Setting up gateway wallet..."

# Create wallet directory
mkdir -p gateway/wallet

# Find the private key file (it may have different names)
KEYSTORE_DIR="organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"
CERT_FILE="organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem"

# Check if files exist
if [ ! -f "$CERT_FILE" ]; then
    print_error "Certificate file not found at $CERT_FILE"
    print_error "Make sure you ran network-up.sh first"
    exit 1
fi

# Find the private key (filename varies)
PRIV_KEY=$(find "$KEYSTORE_DIR" -type f -name "*_sk" 2>/dev/null | head -1)
if [ -z "$PRIV_KEY" ]; then
    PRIV_KEY=$(find "$KEYSTORE_DIR" -type f 2>/dev/null | head -1)
fi

if [ -z "$PRIV_KEY" ] || [ ! -f "$PRIV_KEY" ]; then
    print_error "Private key not found in $KEYSTORE_DIR"
    exit 1
fi

echo "Found certificate: $CERT_FILE"
echo "Found private key: $PRIV_KEY"

# Read and escape the certificates for JSON
ADMIN_CERT=$(cat "$CERT_FILE" | awk '{printf "%s\\n", $0}')
ADMIN_KEY=$(cat "$PRIV_KEY" | awk '{printf "%s\\n", $0}')

# Create the wallet identity JSON
cat > gateway/wallet/admin.id << EOF
{
    "credentials": {
        "certificate": "${ADMIN_CERT}",
        "privateKey": "${ADMIN_KEY}"
    },
    "mspId": "Org1MSP",
    "type": "X.509",
    "version": 1
}
EOF

print_step "Gateway wallet created with admin identity."

print_step "Starting gateway service..."
docker compose up -d gateway

print_step "Waiting for gateway to be ready..."
MAX_RETRY=30
RETRY=0
while [ $RETRY -lt $MAX_RETRY ]; do
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        echo "Gateway is ready!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Waiting for gateway... attempt $RETRY/$MAX_RETRY"
    sleep 1
done

if [ $RETRY -eq $MAX_RETRY ]; then
    print_error "Gateway failed to start"
    exit 1
fi

print_step "Testing gateway health..."
curl -s http://localhost:3001/health

echo ""
print_step "Gateway is running at http://localhost:3001"
echo "Try: curl http://localhost:3001/health"
