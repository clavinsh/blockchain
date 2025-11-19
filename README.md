# Blockchain Car Monitoring System

## Development reqs and setup
- **Docker Desktop**
- **.NET SDK 8.0+**
- **Node.js 18+**
- **Hyperledger Fabric**

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

### 5. Using process
1. Open browser `http://localhost:5173`
2. Register / Login
3. Access dashboard

## Blockchain Setup

### Hyperledger Fabric Test Network Setup
Clone and set up Hyperledger Fabric test network:
```bash
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples/test-network

# Download prerequisites and start network
./network.sh prereq
./network.sh up createChannel -ca
```

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
