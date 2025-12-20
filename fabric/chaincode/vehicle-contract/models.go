package main

import (
	"time"
)

// VehicleTelemetry stores car ID, car data, and timestamp
type VehicleTelemetry struct {
	CarId   string    `json:"carId"`
	CarData string    `json:"carData"` // JSON string containing telemetry
	InsertTime time.Time `json:"insertTime"`
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
