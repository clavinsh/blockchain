#!/bin/bash

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3001"

echo -e "${GREEN}Testing Fabric Gateway Telemetry API${NC}"
echo "=================================="

echo -e "\n${GREEN}1. Health check...${NC}"
curl -s "$API_URL/health" | jq .

echo -e "\n${GREEN}2. Submitting telemetry for car 1...${NC}"
curl -s -X POST "$API_URL/api/telemetry/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "carId": "1",
        "carData": "{\"speed\": 65, \"rpm\": 3000, \"fuel\": 75}"
    }' | jq .

echo -e "\n${GREEN}3. Submitting telemetry for car 2...${NC}"
curl -s -X POST "$API_URL/api/telemetry/submit" \
    -H "Content-Type: application/json" \
    -d '{
        "carId": "2",
        "carData": "{\"speed\": 45, \"rpm\": 2200, \"fuel\": 50}"
    }' | jq .

echo -e "\n${GREEN}4. Getting telemetry for car 1...${NC}"
curl -s "$API_URL/api/telemetry/vehicle/1" | jq .

echo -e "\n${GREEN}5. Getting all telemetry...${NC}"
curl -s "$API_URL/api/telemetry/all" | jq .

echo -e "\n${GREEN}6. Getting telemetry after timestamp...${NC}"
curl -s "$API_URL/api/telemetry/after?timestamp=2024-01-01T00:00:00Z" | jq .

echo -e "\n${GREEN}7. Getting telemetry by range for car 1...${NC}"
curl -s "$API_URL/api/telemetry/range?carId=1&startTime=2024-01-01T00:00:00Z&endTime=2030-12-31T23:59:59Z" | jq .

echo -e "\n${GREEN}All tests completed!${NC}"
