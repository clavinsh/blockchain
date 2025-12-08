package handlers

import (
	"net/http"

	"fabric-gateway/fabric"
	"fabric-gateway/models"

	"github.com/gin-gonic/gin"
)

type VehicleHandler struct {
	fabricClient *fabric.Client
}

func NewVehicleHandler(client *fabric.Client) *VehicleHandler {
	return &VehicleHandler{fabricClient: client}
}

func (h *VehicleHandler) RegisterVehicle(c *gin.Context) {
	var req models.RegisterVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	result, err := h.fabricClient.SubmitTransaction(
		"RegisterVehicle",
		req.OnChainID,
		req.VIN,
		req.OwnerUserID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Error:   "Failed to register vehicle: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Result:  result,
		TxID:    req.OnChainID,
	})
}

func (h *VehicleHandler) ReadVehicle(c *gin.Context) {
	onChainID := c.Param("onChainId")

	if onChainID == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Error:   "onChainId is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction(
		"ReadVehicle",
		onChainID,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Error:   "Vehicle not found: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"vehicle": result,
	})
}
