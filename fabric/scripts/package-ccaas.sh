#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

CHAINCODE_NAME="vehicle"
CHAINCODE_VERSION="1.0"
CHAINCODE_LABEL="${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
CHAINCODE_DIR="$(cd "$(dirname "$0")/../chaincode/vehicle-contract" && pwd)"
PACKAGE_DIR="$(cd "$(dirname "$0")/../channel-artifacts" && pwd)"
PACKAGE_FILE="${PACKAGE_DIR}/${CHAINCODE_NAME}.tar.gz"

print_step "Creating ccaas package for ${CHAINCODE_LABEL}..."

# Create temporary directory for package contents
TMP_DIR=$(mktemp -d)
CODE_DIR="${TMP_DIR}/code"
mkdir -p "${CODE_DIR}"

# Copy connection.json to code directory
cp "${CHAINCODE_DIR}/connection.json" "${CODE_DIR}/connection.json"

print_step "Creating metadata.json..."
cat > "${TMP_DIR}/metadata.json" << EOF
{
    "type": "ccaas",
    "label": "${CHAINCODE_LABEL}"
}
EOF

print_step "Packaging code.tar.gz..."
cd "${CODE_DIR}"
tar -czf "${TMP_DIR}/code.tar.gz" connection.json

print_step "Creating final chaincode package..."
cd "${TMP_DIR}"
tar -czf "${PACKAGE_FILE}" metadata.json code.tar.gz

print_step "Cleaning up temporary files..."
rm -rf "${TMP_DIR}"

print_step "Chaincode package created: ${PACKAGE_FILE}"

# Calculate and display package ID
PACKAGE_ID="${CHAINCODE_LABEL}:$(sha256sum "${PACKAGE_FILE}" | awk '{print $1}')"
echo -e "${GREEN}Package ID will be: ${PACKAGE_ID}${NC}"
