package handlers

import (
    "fmt"
    "net/http"

    "github.com/gin-gonic/gin"
    "fabric-gateway/fabric"
    "fabric-gateway/models"
)

type AccessHandler struct {
    fabricClient *fabric.Client
}

func NewAccessHandler(client *fabric.Client) *AccessHandler {
    return &AccessHandler{fabricClient: client}
}

func (h *AccessHandler) GrantAccess(c *gin.Context) {
    var req models.GrantAccessRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, models.Response{
            Success: false,
            Error:   err.Error(),
        })
        return
    }

    result, err := h.fabricClient.SubmitTransaction(
        "GrantAccess",
        req.OnChainID,
        req.InsuranceCompanyID,
        fmt.Sprintf("%d", req.DurationDays),
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

func (h *AccessHandler) ReadAccess(c *gin.Context) {
    onChainID := c.Param("onChainId")
    companyID := c.Param("companyId")

    result, err := h.fabricClient.EvaluateTransaction(
        "ReadAccess",
        onChainID,
        companyID,
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
        "access":  result,
    })
}

