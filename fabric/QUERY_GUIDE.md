# Complex Blockchain Query Guide

This guide explains how to perform complex queries on the Hyperledger Fabric blockchain across all three layers: Chaincode (Go), Gateway API (Go), and .NET Backend.

## Overview

The query system supports:
- **Rich queries** using CouchDB JSON selectors
- **Range queries** for efficient key-based searches
- **Composite key queries** for hierarchical data
- **Pagination** for large result sets
- **History queries** for transaction audit trails
- **Multiple criteria searches**

---

## Layer 1: Chaincode (Smart Contract)

### Available Query Functions

#### 1. Get All Vehicles
```go
GetAllVehicles() → []*Vehicle
```
Returns all vehicles using state range query.

#### 2. Get Vehicles by Owner
```go
GetVehiclesByOwner(ownerUserID string) → []*Vehicle
```
Uses CouchDB rich query:
```json
{
  "selector": {
    "ownerUserId": "user-123"
  }
}
```

#### 3. Get Vehicles by VIN Prefix
```go
GetVehiclesByVINPrefix(vinPrefix string) → []*Vehicle
```
Useful for filtering by manufacturer (e.g., all Honda vehicles):
```json
{
  "selector": {
    "vin": {
      "$regex": "^1HGBH"
    }
  }
}
```

#### 4. Get Vehicles Registered After Date
```go
GetVehiclesRegisteredAfter(timestamp string) → []*Vehicle
```
Returns vehicles registered after a specific date, sorted by registration time:
```json
{
  "selector": {
    "registeredAt": {
      "$gt": "2024-01-01T00:00:00Z"
    }
  },
  "sort": [{"registeredAt": "desc"}]
}
```

#### 5. Search by Multiple Criteria
```go
GetVehiclesByMultipleCriteria(ownerUserID, vinPrefix, afterDate string) → []*Vehicle
```
Combines multiple filters in a single query.

#### 6. Paginated Query
```go
QueryVehiclesWithPagination(queryString string, pageSize int32, bookmark string) → *PaginatedQueryResult
```
Supports large result sets with bookmarks for next page.

#### 7. Get Vehicle History
```go
GetVehicleHistory(onChainID string) → []HistoryQueryResult
```
Returns complete transaction history for a vehicle.

#### 8. Get Access Grants by Vehicle
```go
GetAccessGrantsByVehicle(onChainID string) → []*AccessGrant
```
Uses partial composite key to find all grants for a vehicle.

---

## Layer 2: Go Gateway API

### Endpoints

#### Get All Vehicles
```bash
GET /api/query/vehicles
```
**Response:**
```json
{
  "success": true,
  "vehicles": "[{...}, {...}]"
}
```

#### Get Vehicles by Owner
```bash
GET /api/query/vehicles/owner/:ownerUserId
```
**Example:**
```bash
curl http://localhost:3001/api/query/vehicles/owner/user-123
```

#### Get Vehicles by VIN Prefix
```bash
GET /api/query/vehicles/vin?prefix={prefix}
```
**Example:**
```bash
curl "http://localhost:3001/api/query/vehicles/vin?prefix=1HGBH"
```

#### Get Vehicles Registered After Date
```bash
GET /api/query/vehicles/registered-after?after={timestamp}
```
**Example:**
```bash
curl "http://localhost:3001/api/query/vehicles/registered-after?after=2024-01-01T00:00:00Z"
```

#### Search with Multiple Criteria
```bash
GET /api/query/vehicles/search?owner={owner}&vinPrefix={prefix}&after={date}
```
**Example:**
```bash
curl "http://localhost:3001/api/query/vehicles/search?owner=user-123&vinPrefix=1HGBH&after=2024-01-01T00:00:00Z"
```

#### Paginated Query
```bash
GET /api/query/vehicles/paginated?query={json}&pageSize={size}&bookmark={bookmark}
```
**Example:**
```bash
curl "http://localhost:3001/api/query/vehicles/paginated?pageSize=10"
```

#### Get Vehicle History
```bash
GET /api/query/vehicles/:onChainId/history
```
**Example:**
```bash
curl http://localhost:3001/api/query/vehicles/vehicle-001/history
```

#### Get Access Grants by Vehicle
```bash
GET /api/access/vehicle/:onChainId/grants
```
**Example:**
```bash
curl http://localhost:3001/api/access/vehicle/vehicle-001/grants
```

---

## Layer 3: .NET Backend

### Service Interface

```csharp
public interface IVehicleQueryService
{
    Task<List<BlockchainVehicle>> GetAllVehiclesAsync();
    Task<List<BlockchainVehicle>> GetVehiclesByOwnerAsync(string ownerUserId);
    Task<List<BlockchainVehicle>> GetVehiclesByVINPrefixAsync(string vinPrefix);
    Task<List<BlockchainVehicle>> GetVehiclesRegisteredAfterAsync(DateTime afterDate);
    Task<List<BlockchainVehicle>> SearchVehiclesAsync(VehicleSearchCriteria criteria);
    Task<PaginatedVehicleResult> QueryVehiclesPaginatedAsync(string? queryJson, int pageSize, string? bookmark);
    Task<List<VehicleHistoryRecord>> GetVehicleHistoryAsync(string onChainId);
    Task<List<BlockchainAccessGrant>> GetAccessGrantsByVehicleAsync(string onChainId);
}
```

### Usage Examples

#### 1. Get All Vehicles
```csharp
var vehicles = await _queryService.GetAllVehiclesAsync();
```

#### 2. Get Vehicles by Owner
```csharp
var vehicles = await _queryService.GetVehiclesByOwnerAsync("user-123");
```

#### 3. Filter by Manufacturer (VIN Prefix)
```csharp
// Get all Honda vehicles (VIN starts with 1HGBH)
var hondaVehicles = await _queryService.GetVehiclesByVINPrefixAsync("1HGBH");

// Get all Toyota vehicles (VIN starts with 4T1)
var toyotaVehicles = await _queryService.GetVehiclesByVINPrefixAsync("4T1");
```

#### 4. Get Recently Registered Vehicles
```csharp
var recentVehicles = await _queryService.GetVehiclesRegisteredAfterAsync(
    DateTime.UtcNow.AddDays(-30)
);
```

#### 5. Complex Search
```csharp
var criteria = new VehicleSearchCriteria
{
    OwnerUserId = "user-123",
    VinPrefix = "1HGBH",
    RegisteredAfter = new DateTime(2024, 1, 1)
};

var vehicles = await _queryService.SearchVehiclesAsync(criteria);
```

#### 6. Paginated Query
```csharp
// First page
var page1 = await _queryService.QueryVehiclesPaginatedAsync(
    queryJson: null,
    pageSize: 10,
    bookmark: null
);

// Next page using bookmark
if (page1.HasMore)
{
    var page2 = await _queryService.QueryVehiclesPaginatedAsync(
        queryJson: null,
        pageSize: 10,
        bookmark: page1.Bookmark
    );
}
```

#### 7. Get Vehicle History
```csharp
var history = await _queryService.GetVehicleHistoryAsync("vehicle-001");

foreach (var record in history)
{
    Console.WriteLine($"TxID: {record.TxId}");
    Console.WriteLine($"Timestamp: {record.Timestamp}");
    Console.WriteLine($"Deleted: {record.IsDelete}");
    if (record.Vehicle != null)
    {
        Console.WriteLine($"Owner: {record.Vehicle.OwnerUserId}");
    }
}
```

#### 8. Get All Access Grants for a Vehicle
```csharp
var grants = await _queryService.GetAccessGrantsByVehicleAsync("vehicle-001");

foreach (var grant in grants)
{
    Console.WriteLine($"Company: {grant.GrantedTo}");
    Console.WriteLine($"Granted: {grant.GrantedAt}");
    Console.WriteLine($"Expires: {grant.ExpiresAt}");
}
```

### Controller Endpoints

The .NET backend exposes these as REST endpoints:

```
GET /api/blockchain/query/vehiclequery/all
GET /api/blockchain/query/vehiclequery/owner/{ownerUserId}
GET /api/blockchain/query/vehiclequery/vin?prefix={prefix}
GET /api/blockchain/query/vehiclequery/registered-after?date={date}
GET /api/blockchain/query/vehiclequery/search?ownerUserId=...&vinPrefix=...&registeredAfter=...
GET /api/blockchain/query/vehiclequery/paginated?pageSize={size}&bookmark={bookmark}
GET /api/blockchain/query/vehiclequery/{onChainId}/history
GET /api/blockchain/query/vehiclequery/{onChainId}/access-grants
```

---

## CouchDB Query Syntax Reference

### Basic Selectors

```json
{
  "selector": {
    "field": "value"
  }
}
```

### Comparison Operators

```json
{
  "selector": {
    "registeredAt": {
      "$gt": "2024-01-01T00:00:00Z",
      "$lt": "2024-12-31T23:59:59Z"
    }
  }
}
```

Operators: `$gt`, `$gte`, `$lt`, `$lte`, `$eq`, `$ne`

### Regex Matching

```json
{
  "selector": {
    "vin": {
      "$regex": "^1HGBH"
    }
  }
}
```

### $in Operator (Match Any)

```json
{
  "selector": {
    "ownerUserId": {
      "$in": ["user-1", "user-2", "user-3"]
    }
  }
}
```

### Combining Conditions ($and)

```json
{
  "selector": {
    "$and": [
      {"ownerUserId": "user-123"},
      {"registeredAt": {"$gt": "2024-01-01T00:00:00Z"}}
    ]
  }
}
```

### Sorting

```json
{
  "selector": {...},
  "sort": [
    {"registeredAt": "desc"}
  ]
}
```

### Limiting Results

```json
{
  "selector": {...},
  "limit": 10,
  "skip": 0
}
```

---

## Performance Tips

1. **Create CouchDB Indexes**
   - Index frequently queried fields
   - Improves rich query performance significantly

2. **Use Pagination**
   - Don't fetch all records at once
   - Use bookmarks for efficient pagination

3. **Prefer Specific Queries**
   - Query by key/composite key when possible
   - Rich queries are more expensive

4. **Limit Result Sets**
   - Always use reasonable page sizes
   - Default to 10-50 items per page

5. **Cache Results**
   - Cache frequently accessed data in your application
   - Reduce blockchain queries

---

## Common Use Cases

### 1. Fleet Management Dashboard
```csharp
// Get all vehicles for a fleet owner
var fleetVehicles = await _queryService.GetVehiclesByOwnerAsync("fleet-owner-id");

// Get recently added vehicles
var newVehicles = await _queryService.GetVehiclesRegisteredAfterAsync(
    DateTime.UtcNow.AddDays(-7)
);
```

### 2. Manufacturer Recall Lookup
```csharp
// Find all affected vehicles by VIN prefix
var affectedVehicles = await _queryService.GetVehiclesByVINPrefixAsync("1HGBH41");
```

### 3. Insurance Access Audit
```csharp
// Get all companies with access to a vehicle
var accessGrants = await _queryService.GetAccessGrantsByVehicleAsync("vehicle-001");

// Check vehicle modification history
var history = await _queryService.GetVehicleHistoryAsync("vehicle-001");
```

### 4. Analytics/Reporting
```csharp
// Paginated export of all vehicles
var bookmark = "";
var allVehicles = new List<BlockchainVehicle>();

do
{
    var page = await _queryService.QueryVehiclesPaginatedAsync(
        pageSize: 100,
        bookmark: bookmark
    );

    allVehicles.AddRange(page.Vehicles);
    bookmark = page.Bookmark;

} while (!string.IsNullOrEmpty(bookmark));
```

---

## Testing Queries

### Using curl

```bash
# Test all vehicles
curl http://localhost:3001/api/query/vehicles

# Test owner filter
curl http://localhost:3001/api/query/vehicles/owner/user-123

# Test VIN prefix
curl "http://localhost:3001/api/query/vehicles/vin?prefix=1HGBH"

# Test date filter
curl "http://localhost:3001/api/query/vehicles/registered-after?after=2024-01-01T00:00:00Z"

# Test pagination
curl "http://localhost:3001/api/query/vehicles/paginated?pageSize=5"

# Test history
curl http://localhost:3001/api/query/vehicles/vehicle-001/history
```

### From .NET Backend

```bash
curl http://localhost:5000/api/blockchain/query/vehiclequery/all
curl http://localhost:5000/api/blockchain/query/vehiclequery/owner/user-123
curl "http://localhost:5000/api/blockchain/query/vehiclequery/vin?prefix=1HGBH"
```

---

## Deployment Considerations

1. **Deploy Updated Chaincode**
   ```bash
   cd fabric
   ./scripts/deploy-chaincode.sh
   ```

2. **Rebuild Gateway**
   ```bash
   cd gateway
   docker-compose up -d --build gateway
   ```

3. **Update .NET Backend**
   ```bash
   cd backend
   dotnet build
   dotnet run
   ```

4. **Create CouchDB Indexes** (Optional but recommended)
   - Index on `ownerUserId`
   - Index on `vin`
   - Index on `registeredAt`

---

This comprehensive query system allows you to efficiently search and filter blockchain data at scale!
