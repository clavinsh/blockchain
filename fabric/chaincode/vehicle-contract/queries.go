package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// QueryResult structure for returning query results
type QueryResult struct {
	Key    string  `json:"key"`
	Record *Vehicle `json:"record"`
}

// GetAllVehicles returns all vehicles from world state
// This uses GetStateByRange which is less efficient for large datasets
func (c *VehicleContract) GetAllVehicles(ctx contractapi.TransactionContextInterface) ([]*Vehicle, error) {
	// Range query with empty string for startKey and endKey does an open-ended query of all vehicles
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var vehicles []*Vehicle
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var vehicle Vehicle
		err = json.Unmarshal(queryResponse.Value, &vehicle)
		if err != nil {
			continue // Skip non-vehicle entries
		}
		vehicles = append(vehicles, &vehicle)
	}

	return vehicles, nil
}

// GetVehiclesByOwner returns all vehicles owned by a specific user
// This uses a rich query (CouchDB only)
func (c *VehicleContract) GetVehiclesByOwner(
	ctx contractapi.TransactionContextInterface,
	ownerUserID string,
) ([]*Vehicle, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"ownerUserId": "%s"
		}
	}`, ownerUserID)

	return c.getQueryResultForQueryString(ctx, queryString)
}

// GetVehiclesByVINPrefix returns all vehicles with VIN starting with prefix
// Useful for finding all vehicles from a specific manufacturer
func (c *VehicleContract) GetVehiclesByVINPrefix(
	ctx contractapi.TransactionContextInterface,
	vinPrefix string,
) ([]*Vehicle, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"vin": {
				"$regex": "^%s"
			}
		}
	}`, vinPrefix)

	return c.getQueryResultForQueryString(ctx, queryString)
}

// GetVehiclesRegisteredAfter returns vehicles registered after a specific date
// timestamp should be in RFC3339 format: "2024-01-01T00:00:00Z"
func (c *VehicleContract) GetVehiclesRegisteredAfter(
	ctx contractapi.TransactionContextInterface,
	timestamp string,
) ([]*Vehicle, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"registeredAt": {
				"$gt": "%s"
			}
		},
		"sort": [{"registeredAt": "desc"}]
	}`, timestamp)

	return c.getQueryResultForQueryString(ctx, queryString)
}

// GetVehiclesByOwnerList returns vehicles owned by any user in the list
func (c *VehicleContract) GetVehiclesByOwnerList(
	ctx contractapi.TransactionContextInterface,
	ownerUserIDs string, // Comma-separated list: "user1,user2,user3"
) ([]*Vehicle, error) {
	// Parse the comma-separated list
	var owners []interface{}
	var ownerArray []string
	err := json.Unmarshal([]byte("[\""+ownerUserIDs+"\"]"), &ownerArray)
	if err != nil {
		// Fallback: simple split by comma
		queryString := fmt.Sprintf(`{
			"selector": {
				"ownerUserId": {
					"$in": ["%s"]
				}
			}
		}`, ownerUserIDs)
		return c.getQueryResultForQueryString(ctx, queryString)
	}

	for _, owner := range ownerArray {
		owners = append(owners, owner)
	}

	queryMap := map[string]interface{}{
		"selector": map[string]interface{}{
			"ownerUserId": map[string]interface{}{
				"$in": owners,
			},
		},
	}

	queryBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}

	return c.getQueryResultForQueryString(ctx, string(queryBytes))
}

// QueryVehiclesWithPagination demonstrates pagination for large result sets
func (c *VehicleContract) QueryVehiclesWithPagination(
	ctx contractapi.TransactionContextInterface,
	queryString string,
	pageSize int32,
	bookmark string,
) (*PaginatedQueryResult, error) {
	resultsIterator, responseMetadata, err := ctx.GetStub().GetQueryResultWithPagination(queryString, pageSize, bookmark)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var vehicles []*Vehicle
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var vehicle Vehicle
		err = json.Unmarshal(queryResponse.Value, &vehicle)
		if err != nil {
			return nil, err
		}
		vehicles = append(vehicles, &vehicle)
	}

	return &PaginatedQueryResult{
		Records:             vehicles,
		FetchedRecordsCount: responseMetadata.FetchedRecordsCount,
		Bookmark:            responseMetadata.Bookmark,
	}, nil
}

// GetVehiclesByMultipleCriteria demonstrates complex queries with multiple conditions
func (c *VehicleContract) GetVehiclesByMultipleCriteria(
	ctx contractapi.TransactionContextInterface,
	ownerUserID string,
	vinPrefix string,
	afterDate string,
) ([]*Vehicle, error) {
	selector := map[string]interface{}{}

	if ownerUserID != "" {
		selector["ownerUserId"] = ownerUserID
	}

	if vinPrefix != "" {
		selector["vin"] = map[string]interface{}{
			"$regex": "^" + vinPrefix,
		}
	}

	if afterDate != "" {
		selector["registeredAt"] = map[string]interface{}{
			"$gt": afterDate,
		}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
		"sort":     []map[string]string{{"registeredAt": "desc"}},
	}

	queryBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}

	return c.getQueryResultForQueryString(ctx, string(queryBytes))
}

// GetVehicleHistory returns the history of changes for a specific vehicle
func (c *VehicleContract) GetVehicleHistory(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
) ([]HistoryQueryResult, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(onChainID)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var vehicle Vehicle
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &vehicle)
			if err != nil {
				return nil, err
			}
		}

		// Convert protobuf timestamp to time.Time
		timestamp := time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos))

		record := HistoryQueryResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			IsDelete:  response.IsDelete,
			Vehicle:   &vehicle,
		}
		records = append(records, record)
	}

	return records, nil
}

// Helper function to execute rich queries
func (c *VehicleContract) getQueryResultForQueryString(
	ctx contractapi.TransactionContextInterface,
	queryString string,
) ([]*Vehicle, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var vehicles []*Vehicle
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var vehicle Vehicle
		err = json.Unmarshal(queryResponse.Value, &vehicle)
		if err != nil {
			return nil, err
		}
		vehicles = append(vehicles, &vehicle)
	}

	return vehicles, nil
}

// GetAccessGrantsByVehicle returns all access grants for a specific vehicle
func (c *VehicleContract) GetAccessGrantsByVehicle(
	ctx contractapi.TransactionContextInterface,
	onChainID string,
) ([]*AccessGrant, error) {
	// Use partial composite key to find all access grants for this vehicle
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("access", []string{onChainID})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var grants []*AccessGrant
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var grant AccessGrant
		err = json.Unmarshal(queryResponse.Value, &grant)
		if err != nil {
			return nil, err
		}
		grants = append(grants, &grant)
	}

	return grants, nil
}
