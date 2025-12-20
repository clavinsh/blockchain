#!/bin/bash

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3001"

echo -e "${GREEN}Testing UBI Fabric Gateway API${NC}"
echo "=================================="

echo -e "\n${GREEN}1. Health check...${NC}"
curl -s "$API_URL/health" | jq .

echo -e "\n${GREEN}2. Registering a test vehicle...${NC}"
curl -s -X POST "$API_URL/api/vehicles/register" \
    -H "Content-Type: application/json" \
    -d '{
        "onChainId": "vehicle-001",
        "vin": "1HGBH41JXMN109186",
        "ownerUserId": "user-123"
    }' | jq .

echo -e "\n${GREEN}3. Reading the vehicle...${NC}"
curl -s "$API_URL/api/vehicles/vehicle-001" | jq .

echo -e "\n${GREEN}4. Submitting telemetry hash...${NC}"
curl -s -X POST "$API_URL/api/telemetry/hash" \
    -H "Content-Type: application/json" \
    -d '{
        "onChainId": "vehicle-001",
        "dataHash": "abc123hash456"
    }' | jq .

echo -e "\n${GREEN}5. Granting access to insurance company...${NC}"
curl -s -X POST "$API_URL/api/access/grant" \
    -H "Content-Type: application/json" \
    -d '{
        "onChainId": "vehicle-001",
        "insuranceCompanyId": "insurance-co-1",
        "durationDays": 30
    }' | jq .

echo -e "\n${GREEN}6. Reading access grant...${NC}"
curl -s "$API_URL/api/access/vehicle-001/insurance-co-1" | jq .

echo -e "\n${GREEN}All tests completed!${NC}"
