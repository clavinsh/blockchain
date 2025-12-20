# Blockchain Car Monitoring System

## Development reqs and setup
- **Docker Desktop**
- **.NET SDK 8.0+**
- **Node.js 18+**

## Project Setup

### 1. Clone the Repository
```bash
git clone <repo-url>
cd blockchain
```

### 2. Database Setup (MySQL)
Start the MySQL database using Docker:
```bash
docker-compose up -d
```
mysql-blockchain container running on port 3306

### 3. Backend Setup (.NET)
Navigate to backend directory and run:
```bash
cd backend
dotnet restore
dotnet run
```
Backend: `http://localhost:5000`

### 4. Frontend Setup (React/TypeScript)
Navigate to frontend directory and install dependencies:
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173`

### 5. Fabric Blockchain Setup
Navigate to fabric directory and start the network:
```bash
cd fabric

# Start Fabric network (CA, Orderer, Peer, CouchDB)
sudo ./scripts/network-up.sh

# Deploy chaincode (vehicle telemetry smart contract)
sudo ./scripts/deploy-chaincode.sh

# Setup and start Gateway API
./scripts/setup-gateway.sh
```
Gateway API: `http://localhost:3001`

**Components:**
- **Chaincode:** Go smart contract for vehicle telemetry (runs as external service)
- **Gateway:** Go REST API that bridges .NET backend to Fabric network
- **Peer/Orderer:** Fabric network nodes for consensus and ledger management
- **CouchDB:** Rich query state database

To shut down:
```bash
./scripts/network-down.sh
```

### 6. Using process
1. Open browser `http://localhost:5173`
2. Register / Login
3. Access dashboard

## Project tech

### Database:
- **Docker**
- **MySQL 8.0**

### Backend:
- **.NET 8**
- **Entity Framework Core**
- **MySQL**
- **JWT Authentication**
- **BCrypt**

### Frontend:
- **React 19**
- **TypeScript**
- **Vite**
- **TailwindCSS v4**
- **shadcn/ui**
- **React Router**

### Blockchain:
- **Hyperledger Fabric 2.5** (Peer, Orderer, CA)
- **Go 1.21** (Chaincode & Gateway)
- **CouchDB 3.3** (State database for complex queries)