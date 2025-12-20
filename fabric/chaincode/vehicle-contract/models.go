package main

import (
	"time"
)

// VehicleTelemetry stores vehicle ID, telemetry data, and timestamp
type VehicleTelemetry struct {
	VehicleID     string    `json:"vehicleId"`
	TelemetryData string    `json:"telemetryData"` // JSON string containing telemetry
	InsertedAt    time.Time `json:"insertedAt"`
}

// PaginatedQueryResult is used for paginated queries
type PaginatedQueryResult struct {
	Records             []*VehicleTelemetry `json:"records"`
	FetchedRecordsCount int32               `json:"fetchedRecordsCount"`
	Bookmark            string              `json:"bookmark"`
}

// HistoryQueryResult structure for returning history query results
type HistoryQueryResult struct {
	TxId      string            `json:"txId"`
	Timestamp time.Time         `json:"timestamp"`
	IsDelete  bool              `json:"isDelete"`
	Record    *VehicleTelemetry `json:"record"`
}
