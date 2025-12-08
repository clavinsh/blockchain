package main

import (
	"log"
	"os"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	chaincode, err := contractapi.NewChaincode(&VehicleContract{})
	if err != nil {
		log.Panicf("Error creating chaincode: %v", err)
	}

	// Check if running as external chaincode service
	ccAddress := os.Getenv("CHAINCODE_SERVER_ADDRESS")
	ccID := os.Getenv("CHAINCODE_ID")

	if ccAddress != "" && ccID != "" {
		// Run as external chaincode server
		server := &contractapi.ChaincodeServer{
			CCID:     ccID,
			Address:  ccAddress,
			CC:       chaincode,
			TLSProps: contractapi.TLSProperties{Disabled: true},
		}

		log.Printf("Starting chaincode server at %s with ID %s", ccAddress, ccID)
		if err := server.Start(); err != nil {
			log.Panicf("Error starting chaincode server: %v", err)
		}
	} else {
		// Run in traditional mode (peer-managed)
		if err := chaincode.Start(); err != nil {
			log.Panicf("Error starting chaincode: %v", err)
		}
	}
}
