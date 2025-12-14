#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_step "Bringing down the network..."
docker compose down --volumes --remove-orphans

print_step "Cleaning up Docker volumes..."
docker volume prune -f 2>/dev/null || true

print_step "Removing generated crypto materials..."
rm -rf organizations/ordererOrganizations
rm -rf organizations/peerOrganizations
rm -rf organizations/fabric-ca

print_step "Removing channel artifacts..."
rm -rf channel-artifacts/*

print_step "Removing gateway wallet..."
rm -rf gateway/wallet

print_step "Removing chaincode packages..."
find chaincode -name "*.tar.gz" -type f -delete 2>/dev/null || true

print_step "Removing any root-owned files..."
# The genesis block and chaincode packages may be owned by root
sudo rm -f channel-artifacts/genesis.block 2>/dev/null || rm -f channel-artifacts/genesis.block 2>/dev/null || true
sudo rm -f channel-artifacts/*.tar.gz 2>/dev/null || rm -f channel-artifacts/*.tar.gz 2>/dev/null || true

echo ""
print_step "Network is down and cleaned up!"