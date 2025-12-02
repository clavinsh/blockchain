#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Cleaning Fabric Network"

docker-compose down -v

rm -rf network/organizations
rm -rf network/system-genesis-block
rm -rf network/channel-artifacts

echo "Cleaned"
