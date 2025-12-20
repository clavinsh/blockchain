package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type VehicleContract struct {
	contractapi.Contract
}

// SubmitTelemetry stores telemetry data for a vehicle
// Each submission creates a new record with composite key: telemetry~carId~timestamp
func (c *VehicleContract) SubmitTelemetry(
	ctx contractapi.TransactionContextInterface,
	carId string,
	carData string,
) error {
	record := VehicleTelemetry{
		CarId:      carId,
		CarData:    carData,
		InsertTime: time.Now(),
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	// Use composite key: telemetry~carId~timestamp
	key, err := ctx.GetStub().CreateCompositeKey("telemetry", []string{carId, fmt.Sprintf("%d", record.InsertTime.UnixNano())})
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(key, recordJSON)
}

// ReadTelemetry retrieves a specific telemetry record by composite key
func (c *VehicleContract) ReadTelemetry(
	ctx contractapi.TransactionContextInterface,
	key string,
) (*VehicleTelemetry, error) {
	recordJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("telemetry record not found")
	}

	var record VehicleTelemetry
	err = json.Unmarshal(recordJSON, &record)
	return &record, err
}

// GetTelemetryByVehicle retrieves all telemetry records for a specific vehicle
func (c *VehicleContract) GetTelemetryByVehicle(
	ctx contractapi.TransactionContextInterface,
	carId string,
) ([]*VehicleTelemetry, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("telemetry", []string{carId})
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
