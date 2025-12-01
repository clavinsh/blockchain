#!/bin/bash

set -e

FABRIC_SAMPLES="${1}"
TEST_NETWORK="$FABRIC_SAMPLES/test-network"

usage() {
    echo "Usage: $0 [FABRIC_SAMPLES_PATH]"
    echo ""
    echo "Sets up Hyperledger Fabric wallet and admin identity"
    echo ""
    echo "Arguments:"
    echo "  FABRIC_SAMPLES_PATH   Path to fabric-samples directory (e.g. \$HOME/fabric-samples)"
}

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    usage
    exit 0
fi

if [ -z "$FABRIC_SAMPLES" ]; then
    echo "Error: FABRIC_SAMPLES_PATH is required"
    usage
    exit 1
fi

if [ ! -d "$FABRIC_SAMPLES" ]; then
    echo "Error: fabric-samples directory not found at: $FABRIC_SAMPLES"
    exit 1
fi

if [ ! -d "$TEST_NETWORK" ]; then
    echo "Error: test-network directory not found at: $TEST_NETWORK"
    echo "Make sure you're pointing to the correct fabric-samples directory"
    exit 1
fi

echo "🔧 Setting up Fabric wallet..."
echo "Using fabric-samples at: $FABRIC_SAMPLES"
echo ""

ADMIN_CERT_PATH="$TEST_NETWORK/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem"
ADMIN_KEY_DIR="$TEST_NETWORK/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"

if [ ! -f "$ADMIN_CERT_PATH" ]; then
    echo "Admin certificate not found at: $ADMIN_CERT_PATH"
    echo ""
    echo "Make sure the Fabric network is running with:"
    echo "  cd $TEST_NETWORK"
    echo "  ./network.sh up createChannel -ca"
    exit 1
fi

ADMIN_KEY=$(find "$ADMIN_KEY_DIR" -name "*_sk" 2>/dev/null | head -1)

if [ -z "$ADMIN_KEY" ]; then
    echo "Admin private key not found in: $ADMIN_KEY_DIR"
    exit 1
fi

echo "Found certificate: $(basename "$ADMIN_CERT_PATH")"
echo "Found private key: $(basename "$ADMIN_KEY")"
echo ""

if [ -d "wallet" ]; then
    echo "Removing existing wallet..."
    rm -rf wallet
fi

mkdir -p wallet/admin

cp "$ADMIN_CERT_PATH" wallet/admin/Org1MSP-cert.pem

cp "$ADMIN_KEY" wallet/admin/Org1MSP-priv-key.pem

chmod 600 wallet/admin/Org1MSP-priv-key.pem

echo "Wallet created successfully!"
echo ""
echo "Wallet location: $(pwd)/wallet"
echo "Identity files:"
echo "  - Certificate: wallet/admin/Org1MSP-cert.pem"
echo "  - Private key: wallet/admin/Org1MSP-priv-key.pem"
echo ""
echo "You can now run:"
echo "  go run main.go"
echo ""

