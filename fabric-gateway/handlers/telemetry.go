package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/yourusername/insurance-ubi/fabric-gateway/fabric"
    "github.com/yourusername/insurance-ubi/fabric-gateway/models"
)

type TelemetryHandler struct {
    fabricClient *fabric.Client
}

func NewTelemetryHandler(client *fabric.Client) *TelemetryHandler {
    return &TelemetryHandler{fabricClient: client}
}

func (h *TelemetryHandler) SubmitDataHash(c *gin.Context) {
    var req models.SubmitHashRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, models.Response{
            Success: false,
            Error:   err.Error(),
        })
        return
    }

    result, err := h.fabricClient.SubmitTransaction(
        "SubmitDataHash",
        req.OnChainID,
        req.DataHash,
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
    })
}

