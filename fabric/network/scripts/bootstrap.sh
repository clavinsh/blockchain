#!/bin/bash

# This script generates the crypto material and channel artifacts
# It mimics what fabric-samples/test-network does

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FABRIC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Bootstrapping Fabric Network"
echo "================================"

# Check if cryptogen and configtxgen are available
if ! command -v cryptogen &> /dev/null; then
    echo "cryptogen not found. Please install Fabric binaries."
    echo "Download from: https://github.com/hyperledger/fabric/releases"
    exit 1
fi

cd "$FABRIC_DIR"

# Clean old artifacts
echo "Cleaning old artifacts..."
rm -rf organizations system-genesis-block channel-artifacts

# Generate crypto material
echo "Generating crypto material..."
mkdir -p organizations
cryptogen generate --config=./configtx/crypto-config.yaml --output="organizations"

# Generate genesis block
echo "Generating genesis block..."
mkdir -p system-genesis-block
configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block -configPath ./configtx

# Generate channel transaction
echo "Generating channel transaction..."
mkdir -p channel-artifacts
configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/mychannel.tx -channelID mychannel -configPath ./configtx

echo "Bootstrap complete!"
