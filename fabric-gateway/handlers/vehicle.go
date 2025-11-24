package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/yourusername/insurance-ubi/fabric-gateway/fabric"
    "github.com/yourusername/insurance-ubi/fabric-gateway/models"
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
            Error:   err.Error(),
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
            Error:   err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, models.Response{
        Success: true,
        Result:  result,
		TxID:    "tx-" + req.OnChainID, // TODO: in actual impl get the real tx-ID 
    })
}

func (h *VehicleHandler) ReadVehicle(c *gin.Context) {
    onChainID := c.Param("onChainId")

    result, err := h.fabricClient.EvaluateTransaction(
        "ReadVehicle",
        onChainID,
    )

    if err != nil {
        c.JSON(http.StatusInternalServerError, models.Response{
            Success: false,
            Error:   err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "vehicle": result,
    })
}

