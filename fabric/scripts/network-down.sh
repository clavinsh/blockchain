#!/bin/bash

set -e

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}===> Bringing down the network...${NC}"

docker-compose down --volumes --remove-orphans

echo -e "${GREEN}===> Cleaning up...${NC}"
docker volume prune -f 2>/dev/null || true

echo -e "${GREEN}===> Network is down.${NC}"
