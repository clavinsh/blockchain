#!/bin/bash

set -e

GREEN='\033[0;32m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

print_step "Setting up gateway wallet..."

# Create wallet directory
mkdir -p gateway/wallet

# Get the admin credentials from the generated crypto materials
ADMIN_CERT=$(cat organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem)
ADMIN_KEY=$(cat organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*)

# Create the wallet identity JSON
cat > gateway/wallet/admin.id << EOF
{
    "credentials": {
        "certificate": "$(echo "$ADMIN_CERT" | awk '{printf "%s\\n", $0}')",
        "privateKey": "$(echo "$ADMIN_KEY" | awk '{printf "%s\\n", $0}')"
    },
    "mspId": "Org1MSP",
    "type": "X.509",
    "version": 1
}
EOF

print_step "Gateway wallet created with admin identity."

print_step "Starting gateway service..."
docker-compose up -d gateway

sleep 5

print_step "Testing gateway health..."
curl -s http://localhost:3001/health || echo "Gateway may still be starting..."

echo ""
print_step "Gateway is running at http://localhost:3001"
echo "Try: curl http://localhost:3001/health"
