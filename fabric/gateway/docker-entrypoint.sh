#!/bin/sh
set -e

echo "Starting Fabric Gateway..."

# Check crypto material exists
if [ ! -d "/crypto/peerOrganizations/org1.example.com" ]; then
    echo "Crypto material not found at /crypto"
    echo "Did you run the bootstrap script?"
    exit 1
fi

echo "Found crypto material"

# Generate connection profile
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

peers:
  peer0.org1.example.com:
    url: grpcs://peer0.org1.example.com:7051
    tlsCACerts:
      path: /crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    grpcOptions:
      ssl-target-name-override: peer0.org1.example.com
      hostnameOverride: peer0.org1.example.com
EOF

echo "Connection profile created"

# Wait for peer to be truly ready using health check
echo "Waiting for peer to be ready..."
until wget -q --spider http://peer0.org1.example.com:9444/healthz 2>/dev/null; do
    echo "Peer not ready yet, waiting..."
    sleep 2
done
echo "Peer is ready"

# Setup wallet programmatically (reusing your setup-wallet.go logic)
# But inline in Go here...

echo "Starting gateway server..."
exec ./fabric-gateway
