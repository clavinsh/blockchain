package handlers

import (
	"net/http"
	"strconv"

	"fabric-gateway/fabric"

	"github.com/gin-gonic/gin"
)

type QueryHandler struct {
	fabricClient *fabric.Client
}

func NewQueryHandler(client *fabric.Client) *QueryHandler {
	return &QueryHandler{fabricClient: client}
}

// GetAllVehicles returns all vehicles
func (h *QueryHandler) GetAllVehicles(c *gin.Context) {
	result, err := h.fabricClient.EvaluateTransaction("GetAllVehicles")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get vehicles: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"vehicles": result,
	})
}

// GetVehiclesByOwner returns vehicles for a specific owner
func (h *QueryHandler) GetVehiclesByOwner(c *gin.Context) {
	ownerUserID := c.Param("ownerUserId")

	if ownerUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "ownerUserId is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction("GetVehiclesByOwner", ownerUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get vehicles: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"vehicles": result,
	})
}

// GetVehiclesByVINPrefix returns vehicles with VIN starting with prefix
func (h *QueryHandler) GetVehiclesByVINPrefix(c *gin.Context) {
	vinPrefix := c.Query("prefix")

	if vinPrefix == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "prefix query parameter is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction("GetVehiclesByVINPrefix", vinPrefix)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get vehicles: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"vehicles": result,
	})
}

// GetVehiclesRegisteredAfter returns vehicles registered after a specific date
func (h *QueryHandler) GetVehiclesRegisteredAfter(c *gin.Context) {
	timestamp := c.Query("after")

	if timestamp == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "after query parameter is required (RFC3339 format)",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction("GetVehiclesRegisteredAfter", timestamp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get vehicles: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"vehicles": result,
	})
}

// GetVehiclesByMultipleCriteria allows filtering by multiple criteria
func (h *QueryHandler) GetVehiclesByMultipleCriteria(c *gin.Context) {
	ownerUserID := c.Query("owner")
	vinPrefix := c.Query("vinPrefix")
	afterDate := c.Query("after")

	result, err := h.fabricClient.EvaluateTransaction(
		"GetVehiclesByMultipleCriteria",
		ownerUserID,
		vinPrefix,
		afterDate,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get vehicles: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"vehicles": result,
	})
}

// QueryVehiclesWithPagination demonstrates pagination
func (h *QueryHandler) QueryVehiclesWithPagination(c *gin.Context) {
	queryString := c.Query("query")
	pageSizeStr := c.DefaultQuery("pageSize", "10")
	bookmark := c.DefaultQuery("bookmark", "")

	pageSize, err := strconv.ParseInt(pageSizeStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid pageSize",
		})
		return
	}

	if queryString == "" {
		queryString = `{"selector": {}}`
	}

	result, err := h.fabricClient.EvaluateTransaction(
		"QueryVehiclesWithPagination",
		queryString,
		strconv.FormatInt(pageSize, 10),
		bookmark,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to query vehicles: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"result":  result,
	})
}

// GetVehicleHistory returns the history of changes for a vehicle
func (h *QueryHandler) GetVehicleHistory(c *gin.Context) {
	onChainID := c.Param("onChainId")

	if onChainID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "onChainId is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction("GetVehicleHistory", onChainID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get vehicle history: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"history": result,
	})
}

// GetAccessGrantsByVehicle returns all access grants for a vehicle
func (h *QueryHandler) GetAccessGrantsByVehicle(c *gin.Context) {
	onChainID := c.Param("onChainId")

	if onChainID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "onChainId is required",
		})
		return
	}

	result, err := h.fabricClient.EvaluateTransaction("GetAccessGrantsByVehicle", onChainID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to get access grants: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"grants":  result,
	})
}
