package handlers

import (
	"encoding/json"
	"net/http"

	"fabric-gateway/fabric"

	"github.com/gin-gonic/gin"
)

type TelemetryHandler struct {
	fabricClient *fabric.Client
}

func NewTelemetryHandler(client *fabric.Client) *TelemetryHandler {
	return &TelemetryHandler{fabricClient: client}
}

// SubmitTelemetryRequest matches the .NET SubmitTelemetryRequest
type SubmitTelemetryRequest struct {
	CarId   string `json:"carId" binding:"required"`
	CarData string `json:"carData" binding:"required"`
}

// TelemetryResponse for successful operations
type TelemetryResponse struct {
	Success bool   `json:"success"`
	Result  string `json:"result,omitempty"`
	TxId    string `json:"txId,omitempty"`
	Error   string `json:"error,omitempty"`
}

// VehicleTelemetry matches the chaincode model
type VehicleTelemetry struct {
	CarId      string `json:"carId"`
	CarData    string `json:"carData"`
	InsertTime string `json:"insertTime"`
}

// SubmitTelemetry handles POST /api/telemetry/submit
func (h *TelemetryHandler) SubmitTelemetry(c *gin.Context) {
	var req SubmitTelemetryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, TelemetryResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	txId, err := h.fabricClient.SubmitTransaction(
		"SubmitTelemetry",
		req.CarId,
		req.CarData,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, TelemetryResponse{
			Success: false,
			Error:   "Failed to submit telemetry: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, TelemetryResponse{
		Success: true,
		Result:  "Telemetry submitted successfully",
		TxId:    txId,
	})
}

// GetTelemetryByVehicle handles GET /api/telemetry/vehicle/:carId
func (h *TelemetryHandler) GetTelemetryByVehicle(c *gin.Context) {
	carId := c.Param("carId")

	if carId == "" {
		c.JSON(http.StatusBadRequest, TelemetryResponse{
			Success: false,
			Error:   "carId is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction(
		"GetTelemetryByVehicle",
		carId,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, TelemetryResponse{
			Success: false,
			Error:   "Failed to get telemetry: " + err.Error(),
		})
		return
	}

	// Parse the result as array of telemetry records
	var records []VehicleTelemetry
	if result != "" {
		if err := json.Unmarshal([]byte(result), &records); err != nil {
			// If unmarshal fails, return empty array
			records = []VehicleTelemetry{}
		}
	}

	c.JSON(http.StatusOK, records)
}

// GetAllTelemetry handles GET /api/telemetry/all
func (h *TelemetryHandler) GetAllTelemetry(c *gin.Context) {
	result, err := h.fabricClient.EvaluateTransaction("GetAllTelemetry")

	if err != nil {
		c.JSON(http.StatusInternalServerError, TelemetryResponse{
			Success: false,
			Error:   "Failed to get all telemetry: " + err.Error(),
		})
		return
	}

	var records []VehicleTelemetry
	if result != "" {
		if err := json.Unmarshal([]byte(result), &records); err != nil {
			records = []VehicleTelemetry{}
		}
	}

	c.JSON(http.StatusOK, records)
}

// GetTelemetryAfter handles GET /api/telemetry/after?timestamp=...
func (h *TelemetryHandler) GetTelemetryAfter(c *gin.Context) {
	timestamp := c.Query("timestamp")

	if timestamp == "" {
		c.JSON(http.StatusBadRequest, TelemetryResponse{
			Success: false,
			Error:   "timestamp query parameter is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction(
		"GetTelemetryAfter",
		timestamp,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, TelemetryResponse{
			Success: false,
			Error:   "Failed to get telemetry: " + err.Error(),
		})
		return
	}

	var records []VehicleTelemetry
	if result != "" {
		if err := json.Unmarshal([]byte(result), &records); err != nil {
			records = []VehicleTelemetry{}
		}
	}

	c.JSON(http.StatusOK, records)
}

// GetTelemetryByRange handles GET /api/telemetry/range?carId=...&startTime=...&endTime=...
func (h *TelemetryHandler) GetTelemetryByRange(c *gin.Context) {
	carId := c.Query("carId")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")

	if carId == "" {
		c.JSON(http.StatusBadRequest, TelemetryResponse{
			Success: false,
			Error:   "carId query parameter is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction(
		"GetTelemetryByRange",
		carId,
		startTime,
		endTime,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, TelemetryResponse{
			Success: false,
			Error:   "Failed to get telemetry: " + err.Error(),
		})
		return
	}

	var records []VehicleTelemetry
	if result != "" {
		if err := json.Unmarshal([]byte(result), &records); err != nil {
			records = []VehicleTelemetry{}
		}
	}

	c.JSON(http.StatusOK, records)
}
