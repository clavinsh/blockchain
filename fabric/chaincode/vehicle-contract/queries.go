package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// QueryResult structure for returning query results
type QueryResult struct {
	Key    string            `json:"key"`
	Record *VehicleTelemetry `json:"record"`
}

// GetAllTelemetry returns all telemetry records from world state
func (c *VehicleContract) GetAllTelemetry(ctx contractapi.TransactionContextInterface) ([]*VehicleTelemetry, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*VehicleTelemetry
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record VehicleTelemetry
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			continue // Skip non-telemetry entries
		}
		records = append(records, &record)
	}

	return records, nil
}

// GetTelemetryAfter returns telemetry records inserted after a specific timestamp
// timestamp should be in RFC3339 format: "2024-01-01T00:00:00Z"
func (c *VehicleContract) GetTelemetryAfter(
	ctx contractapi.TransactionContextInterface,
	timestamp string,
) ([]*VehicleTelemetry, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"insertTime": {
				"$gt": "%s"
			}
		},
		"sort": [{"insertTime": "desc"}]
	}`, timestamp)

	return c.getQueryResultForQueryString(ctx, queryString)
}

// GetTelemetryByRange returns telemetry for a vehicle within a time range
func (c *VehicleContract) GetTelemetryByRange(
	ctx contractapi.TransactionContextInterface,
	carId string,
	startTime string,
	endTime string,
) ([]*VehicleTelemetry, error) {
	selector := map[string]interface{}{
		"carId": carId,
	}

	if startTime != "" && endTime != "" {
		selector["insertTime"] = map[string]interface{}{
			"$gte": startTime,
			"$lte": endTime,
		}
	} else if startTime != "" {
		selector["insertTime"] = map[string]interface{}{
			"$gte": startTime,
		}
	} else if endTime != "" {
		selector["insertTime"] = map[string]interface{}{
			"$lte": endTime,
		}
	}

	queryMap := map[string]interface{}{
		"selector": selector,
		"sort":     []map[string]string{{"insertTime": "desc"}},
	}

	queryBytes, err := json.Marshal(queryMap)
	if err != nil {
		return nil, err
	}

	return c.getQueryResultForQueryString(ctx, string(queryBytes))
}

// QueryTelemetryWithPagination demonstrates pagination for large result sets
func (c *VehicleContract) QueryTelemetryWithPagination(
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

	var records []*VehicleTelemetry
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record VehicleTelemetry
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return &PaginatedQueryResult{
		Records:             records,
		FetchedRecordsCount: responseMetadata.FetchedRecordsCount,
		Bookmark:            responseMetadata.Bookmark,
	}, nil
}

// GetTelemetryHistory returns the history of changes for a specific telemetry record
func (c *VehicleContract) GetTelemetryHistory(
	ctx contractapi.TransactionContextInterface,
	key string,
) ([]HistoryQueryResult, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(key)
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

		var record VehicleTelemetry
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &record)
			if err != nil {
				return nil, err
			}
		}

		// Convert protobuf timestamp to time.Time
		timestamp := time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos))

		historyRecord := HistoryQueryResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			IsDelete:  response.IsDelete,
			Record:    &record,
		}
		records = append(records, historyRecord)
	}

	return records, nil
}

// Helper function to execute rich queries
func (c *VehicleContract) getQueryResultForQueryString(
	ctx contractapi.TransactionContextInterface,
	queryString string,
) ([]*VehicleTelemetry, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []*VehicleTelemetry
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var record VehicleTelemetry
		err = json.Unmarshal(queryResponse.Value, &record)
		if err != nil {
			return nil, err
		}
		records = append(records, &record)
	}

	return records, nil
}
