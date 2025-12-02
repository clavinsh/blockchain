#!/bin/sh

set -e

echo "Starting Fabric Gateway..."

echo "Waiting for Fabric network..."
sleep 5

if [ ! -d "/fabric-network/organizations" ]; then
    echo "❌ Fabric organizations not found!"
    echo "   Make sure the network is started and organizations are generated"
    exit 1
fi

echo "Setting up wallet..."
CERT_PATH="/fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/cert.pem"
KEY_DIR="/fabric-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"

if [ ! -f "$CERT_PATH" ]; then
    echo "Admin certificate not found at: $CERT_PATH"
    exit 1
fi

echo "Found certificates"

echo "Generating connection profile..."
cat > config/connection-org1.yaml << 'EOF'
name: fabric-network
version: 1.0.0

client:
  organization: Org1
  connection:
    timeout:
      peer:
        endorser: '300'

organizations:
  Org1:
    mspid: Org1MSP
    peers:
      - peer0.org1.example.com
      - peer0.org2.example.com

peers:
  peer0.org1.example.com:
    url: grpcs://peer0.org1.example.com:7051
    tlsCACerts:
      path: /fabric-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    grpcOptions:
      ssl-target-name-override: peer0.org1.example.com
      hostnameOverride: peer0.org1.example.com

  peer0.org2.example.com:
    url: grpcs://peer0.org2.example.com:9051
    tlsCACerts:
      path: /fabric-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    grpcOptions:
      ssl-target-name-override: peer0.org2.example.com
      hostnameOverride: peer0.org2.example.com
EOF

echo "Connection profile created"
echo "Starting gateway server..."

exec ./fabric-gateway
