package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"fabric-gateway/fabric"
	"fabric-gateway/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	fabricClient, err := fabric.NewClient("mychannel", "vehicle")
	if err != nil {
		log.Fatalf("Failed to create Fabric client: %v", err)
	}
	defer fabricClient.Close()

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	telemetryHandler := handlers.NewTelemetryHandler(fabricClient)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Telemetry routes - these match the chaincode functions
	telemetryRoutes := router.Group("/api/telemetry")
	{
		telemetryRoutes.POST("/submit", telemetryHandler.SubmitTelemetry)
		telemetryRoutes.GET("/vehicle/:carId", telemetryHandler.GetTelemetryByVehicle)
		telemetryRoutes.GET("/all", telemetryHandler.GetAllTelemetry)
		telemetryRoutes.GET("/after", telemetryHandler.GetTelemetryAfter)
		telemetryRoutes.GET("/range", telemetryHandler.GetTelemetryByRange)
	}

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down gracefully...")
		os.Exit(0)
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Fabric Gateway API running on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
